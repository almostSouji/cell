import 'reflect-metadata';

import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import fastify, { FastifyRequest } from 'fastify';
import fastifyRawBody from 'fastify-raw-body';
import { getVerifyRequest } from './utils/verify.js';
import { logger } from './utils/logger.js';
import process from 'node:process';
import {
	API,
	APIInteraction,
	APIInteractionResponsePong,
	ApplicationCommandOptionType,
	ButtonStyle,
	ChannelType,
	ComponentType,
	InteractionResponseType,
	InteractionType,
	MessageFlags,
	PermissionFlagsBits,
} from '@discordjs/core';
import { REST } from '@discordjs/rest';
import { container } from 'tsyringe';
import { AdminToggleCommand } from './interactions/admin.js';
import { InviteAppCommand } from './interactions/invite.js';
import { PanelCommand } from './interactions/panel.js';

const server = fastify({ trustProxy: true, logger: true });
await server.register(fastifyHelmet);
await server.register(fastifySensible);
await server.register(fastifyRawBody);

if (!process.env.DISCORD_PUBKEY) {
	logger.error('Missing ENV value DISCORD_PUBKEY');
	process.exit(1);
}

type DiscordFastifyGeneric = {
	Headers: {
		'x-signature-ed25519': string;
		'x-signature-timestamp': string;
	};
};

const verifyDiscord = getVerifyRequest(process.env.DISCORD_PUBKEY);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
container.register(REST, { useValue: rest });

const api = new API(rest);
container.register(API, { useValue: api });

server.post('/interactions', async (request: FastifyRequest<DiscordFastifyGeneric>) => {
	if (!(await verifyDiscord(request))) {
		// eslint-disable-next-line @typescript-eslint/no-throw-literal
		throw { statusCode: 401, message: 'Invalid signature.' };
	}

	const body = request.body as APIInteraction;

	if (body.type === InteractionType.Ping) {
		return { type: InteractionResponseType.Pong } satisfies APIInteractionResponsePong;
	}

	try {
		if (body.type === InteractionType.ApplicationCommand) {
			const commandName = body.data.name;

			if (commandName === PanelCommand.name) {
				const showPanel = ('options' in body.data &&
					body.data.options?.find((o) => o.name === PanelCommand.options[0].name)) || {
					value: false,
					type: ApplicationCommandOptionType.Boolean,
				};

				if (showPanel.type !== ApplicationCommandOptionType.Boolean) {
					throw new Error('Options shape looks different than expected');
				}

				return api.interactions.reply(body.id, body.token, {
					components: [
						{
							type: ComponentType.ActionRow,
							components: [
								{
									type: ComponentType.Button,
									style: ButtonStyle.Primary,
									custom_id: 'ADMIN',
									label: 'Toggle admin role',
								},
								{
									type: ComponentType.Button,
									style: ButtonStyle.Secondary,
									custom_id: 'INVITE',
									label: 'Show or create invite',
								},
							],
						},
						{
							type: ComponentType.ActionRow,
							components: [
								{
									type: ComponentType.Button,
									style: ButtonStyle.Secondary,
									custom_id: 'ADD_TEXT',
									label: '+text',
								},
								{
									type: ComponentType.Button,
									style: ButtonStyle.Secondary,
									custom_id: 'ADD_NSFW',
									label: '+nsfw',
								},
								{
									type: ComponentType.Button,
									style: ButtonStyle.Secondary,
									custom_id: 'ADD_VOICE',
									label: '+voice',
								},
								{
									type: ComponentType.Button,
									style: ButtonStyle.Secondary,
									custom_id: 'ADD_CATEGORY',
									label: '+category',
								},
							],
						},
					],
					flags: showPanel.value ? undefined : MessageFlags.Ephemeral,
				});
			}

			if (commandName === AdminToggleCommand.name) {
				const { roles, owner_id } = await api.guilds.get(body.guild_id!, { with_counts: true });
				const appMember = await api.guilds.getMember(body.guild_id!, process.env.DISCORD_CLIENT_ID!);
				const highestAppRole = roles
					.filter((r) => appMember.roles.includes(r.id))
					.toSorted((one, other) => (other.position = one.position))[0];

				const appIsOwner = owner_id === process.env.DISCORD_CLIENT_ID!;
				const highestAdminRoleAppCanAssign = roles
					.toSorted((one, other) => other.position - one.position)
					.find((r) => {
						const isAdminRole = (BigInt(r.permissions) & PermissionFlagsBits.Administrator) !== 0n;
						const passHierarchy = r.position < (highestAppRole?.position ?? 0);

						return isAdminRole && (passHierarchy || appIsOwner);
					});

				if (!highestAdminRoleAppCanAssign) {
					const newRole = await api.guilds.createRole(body.guild_id!, {
						name: 'Admin',
						permissions: String(PermissionFlagsBits.Administrator),
						color: 0xda3e44,
					});
					await api.guilds.addRoleToMember(body.guild_id!, body.member!.user.id, newRole.id, {
						reason: 'Requested through Admin toggle',
					});

					return api.interactions.reply(body.id, body.token, {
						content: `Added <@&${newRole.id}> (the admin role created just for you).`,
						flags: MessageFlags.Ephemeral,
					});
				}

				const memberHasRole = body.member?.roles.includes(highestAdminRoleAppCanAssign.id) ?? false;
				if (memberHasRole) {
					await api.guilds.removeRoleFromMember(body.guild_id!, body.member!.user.id, highestAdminRoleAppCanAssign.id, {
						reason: 'Requested through Admin toggle',
					});
					return api.interactions.reply(body.id, body.token, {
						content: `Removed <@&${highestAdminRoleAppCanAssign.id}> (the highest admin role that the app can assign).`,
						flags: MessageFlags.Ephemeral,
					});
				}

				await api.guilds.addRoleToMember(body.guild_id!, body.member!.user.id, highestAdminRoleAppCanAssign.id, {
					reason: 'Requested through Admin toggle',
				});
				return api.interactions.reply(body.id, body.token, {
					content: `Added <@&${highestAdminRoleAppCanAssign.id}> (the highest admin role that the app can assign).`,
					flags: MessageFlags.Ephemeral,
				});
			}

			if (commandName === InviteAppCommand.name && 'resolved' in body.data && 'options' in body.data) {
				const resolved = body.data.resolved;
				const options = body.data.options;
				const targetUser = options?.find((o) => o.name === InviteAppCommand.options[0].name);
				const inviteAsBot = options?.find((o) => o.name === InviteAppCommand.options[1].name);

				console.dir({ targetUser, inviteAsBot }, { depth: null });

				if (
					!resolved ||
					(resolved && !('users' in resolved)) ||
					!targetUser ||
					targetUser.type !== ApplicationCommandOptionType.User ||
					!inviteAsBot ||
					inviteAsBot.type !== ApplicationCommandOptionType.Boolean
				) {
					throw new Error('Options shape looks different than expected');
				}

				const resolvedUser = resolved.users?.[targetUser.value];

				if (!resolvedUser) {
					throw new Error('Could not resolve target user.');
				}

				const scopeDependentSuffix = inviteAsBot.value ? `&scope=bot` : `&scope=applications.commands`;
				const invite = `https://discordapp.com/oauth2/authorize?client_id=${resolvedUser.id}${scopeDependentSuffix}`;

				console.dir({ selectedUserSnowflake: targetUser }, { depth: null });
				return api.interactions.reply(body.id, body.token, {
					content: `Here's the invite: [invite](${invite})!${inviteAsBot.value ? '-# You will have to give it roles to grant permissions.' : ''}`,
					flags: MessageFlags.Ephemeral,
				});
			}
		}

		if (body.type === InteractionType.MessageComponent) {
			const componentName = body.data.custom_id;

			if (componentName === 'DELETE') {
				return api.interactions.reply(body.id, body.token, {
					content: `I cannot do that anymore ._.`,
					flags: MessageFlags.Ephemeral,
				});
			}

			if (componentName === 'DELETE_CHANNEL') {
				await api.interactions.reply(body.id, body.token, {
					content: 'OK! Deleting this channel!\n-# If nothing happenes something went wrong, i guess',
					flags: MessageFlags.Ephemeral,
				});

				await api.channels.delete(body.channel.id);
			}

			if (componentName.startsWith('ADD')) {
				const channelType = componentName.split('_')[1] ?? 'TEXT';
				const channel = await api.guilds.createChannel(body.guild_id!, {
					type: ['TEXT', 'NSFW'].includes(channelType)
						? ChannelType.GuildText
						: channelType === 'VOICE'
							? ChannelType.GuildVoice
							: channelType === 'CATEGORY'
								? ChannelType.GuildCategory
								: ChannelType.GuildText,
					name: channelType.toLowerCase(),
					nsfw: channelType === 'NSFW',
				});

				if (['TEXT', 'VOICE', 'NSFW'].includes(channelType)) {
					await api.channels.createMessage(channel.id, {
						components: [
							{
								type: ComponentType.ActionRow,
								components: [
									{
										type: ComponentType.Button,
										custom_id: 'DELETE_CHANNEL',
										style: ButtonStyle.Danger,
										label: 'DELETE',
									},
								],
							},
						],
					});
				}

				return api.interactions.reply(body.id, body.token, {
					content: `Created a ${channelType.toLowerCase()} channel for you: <#${channel.id}>.`,
					flags: MessageFlags.Ephemeral,
				});
			}

			if (componentName === 'INVITE') {
				const invites = await api.guilds.getInvites(body.guild_id!);
				const invite = invites[0];

				if (!invite) {
					const guildChannels = await api.guilds.getChannels(body.guild_id!);
					const channel = guildChannels.find((c) =>
						[
							ChannelType.GuildText,
							ChannelType.GuildVoice,
							ChannelType.GuildForum,
							ChannelType.GuildAnnouncement,
							ChannelType.GuildStageVoice,
						].includes(c.type),
					);

					if (!channel) {
						return api.interactions.reply(body.id, body.token, {
							content: 'There are no invites and found no channel to create an invite on.',
							flags: MessageFlags.Ephemeral,
						});
					}

					const invite = await api.channels.createInvite(channel.id, {
						max_uses: 0,
						temporary: false,
						unique: false,
						max_age: 0,
					});

					return api.interactions.reply(body.id, body.token, {
						content: `Created an invite for you! [\`${invite.code}\`](https://discord.com/invite/${invite.code})`,
						flags: MessageFlags.Ephemeral,
					});
				}

				return api.interactions.reply(body.id, body.token, {
					content: `Here is your invite! [\`${invite.code}\`](https://discord.com/invite/${invite.code})`,
					flags: MessageFlags.Ephemeral,
				});
			}

			if (componentName === 'ADMIN') {
				const { roles, owner_id } = await api.guilds.get(body.guild_id!, { with_counts: true });
				const appMember = await api.guilds.getMember(body.guild_id!, process.env.DISCORD_CLIENT_ID!);
				const highestAppRole = roles
					.filter((r) => appMember.roles.includes(r.id))
					.toSorted((one, other) => (other.position = one.position))[0];

				const appIsOwner = owner_id === process.env.DISCORD_CLIENT_ID!;
				const highestAdminRoleAppCanAssign = roles
					.toSorted((one, other) => other.position - one.position)
					.find((r) => {
						const isAdminRole = (BigInt(r.permissions) & PermissionFlagsBits.Administrator) !== 0n;
						const passHierarchy = r.position < (highestAppRole?.position ?? 0);

						return isAdminRole && (passHierarchy || appIsOwner);
					});

				if (!highestAdminRoleAppCanAssign) {
					const newRole = await api.guilds.createRole(body.guild_id!, {
						name: 'Admin',
						permissions: String(PermissionFlagsBits.Administrator),
						color: 0xda3e44,
					});
					await api.guilds.addRoleToMember(body.guild_id!, body.member!.user.id, newRole.id, {
						reason: 'Requested through Admin toggle',
					});

					return api.interactions.reply(body.id, body.token, {
						content: `Added <@&${newRole.id}> (the admin role created just for you).`,
						flags: MessageFlags.Ephemeral,
					});
				}

				const memberHasRole = body.member?.roles.includes(highestAdminRoleAppCanAssign.id) ?? false;
				if (memberHasRole) {
					await api.guilds.removeRoleFromMember(body.guild_id!, body.member!.user.id, highestAdminRoleAppCanAssign.id, {
						reason: 'Requested through Admin toggle',
					});
					return api.interactions.reply(body.id, body.token, {
						content: `Removed <@&${highestAdminRoleAppCanAssign.id}> (the highest admin role that the app can assign).`,
						flags: MessageFlags.Ephemeral,
					});
				}

				await api.guilds.addRoleToMember(body.guild_id!, body.member!.user.id, highestAdminRoleAppCanAssign.id, {
					reason: 'Requested through Admin toggle',
				});
				return api.interactions.reply(body.id, body.token, {
					content: `Added <@&${highestAdminRoleAppCanAssign.id}> (the highest admin role that the app can assign).`,
					flags: MessageFlags.Ephemeral,
				});
			}
		}

		return undefined;
	} catch (error_) {
		const error = error_ as Error;

		logger.error(error, error.message);

		if (error.message === 'Unknown Guild') {
			return api.interactions.reply(body.id, body.token, {
				content: `\`🐞\` Well, that didn't work.\n-# Make sure the app has a bot user on this guild! If it isn't [invite it](<https://discordapp.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID!}&scope=bot>)!`,
				flags: MessageFlags.Ephemeral,
			});
		}

		if (error.message === 'Missing Permissions') {
			return api.interactions.reply(body.id, body.token, {
				content: `\`🐛\` Well, that didn't work.\n-# This app is made to toggle admin roles and help orchestrate test servers, it works best with a very high role and the \`ADMINISTRATOR\` \`8\` permission. Don't use this app if you don't trust it. Again, it is made for test servers, not production use!`,
				flags: MessageFlags.Ephemeral,
			});
		}

		return api.interactions.reply(body.id, body.token, {
			content: `\`🪲\` Well, that didn't work. \`${error.message}\``,
			flags: MessageFlags.Ephemeral,
		});
	}
});

await server.listen({
	port: Number(process.env.PORT!),
});

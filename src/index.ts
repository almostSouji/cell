import 'reflect-metadata';
import { logger, createMessageActionRow, createButton } from '@yuudachi/framework';
import {
	Client,
	GuildMemberRoleManager,
	TextChannel,
	GuildChannel,
	CategoryChannel,
	GatewayIntentBits,
	ActivityType,
	ButtonStyle,
	PermissionFlagsBits,
	ChannelType,
} from 'discord.js';
import { DELETE_CHANNEL_ACTIONROW } from './commands/create.js';
import { handleCommands } from './functions/handleCommands.js';

import { passOwnerEasteregg } from './functions/passOwnerEasteregg.js';
import {
	CREATE_PREFIX,
	KEY_ADMIN,
	KEY_CANCEL,
	KEY_CONFIRM,
	KEY_DELETE,
	KEY_DELETE_CHANNEL,
	KEY_INVITE,
	SUFFIX_CATEGORY,
	SUFFIX_NSFW,
	SUFFIX_TEXT,
	SUFFIX_VOICE,
} from './keys.js';
import {
	CANCEL_DELETE,
	CANNOT_DELETE,
	CANNOT_UPDATE_ROLES,
	DELETE_SURE,
	INVITE_CREATE,
	READY,
	ROLES_UPDATED,
} from './messages/messages.js';

export interface ProcessEnv {
	DISCORD_TOKEN: string;
	DISCORD_CLIENT_ID: string;
	DEPLOY_GUILD_ID?: string;
}

export enum OpCodes {
	NOOP,
	LIST,
	REVIEW,
	BAN,
	DELETE,
	PAGE_TRIGGER,
}

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
	presence: {
		activities: [
			{
				type: ActivityType.Watching,
				name: 'over sandboxes',
			},
		],
		status: 'online',
	},
});

client.on('ready', () => {
	logger.info(READY(client.user!.tag, client.user!.id));
});

client.on('interactionCreate', async (interaction) => {
	void handleCommands(interaction);

	if (!interaction.guild || !interaction.isButton()) return;
	switch (interaction.customId) {
		case KEY_ADMIN:
			{
				const adminRole = interaction.guild.roles.cache.find((r) => r.name === 'Admin');
				const manager = interaction.member?.roles;
				if (adminRole && manager && manager instanceof GuildMemberRoleManager) {
					try {
						if (manager.resolve(adminRole.id)) {
							await manager.remove(adminRole.id);
						} else {
							await manager.add(adminRole.id);
						}
						void interaction.reply({
							content: ROLES_UPDATED,
							ephemeral: true,
						});
					} catch {
						void interaction.reply({
							content: CANNOT_UPDATE_ROLES,
							ephemeral: true,
						});
					}
				}
			}
			break;
		case KEY_DELETE: {
			if (interaction.guildId === '1045039086840324136') {
				await interaction.reply({
					content: 'No, I still need this!',
					ephemeral: true,
				});
				return;
			}
			void interaction.reply({
				content: DELETE_SURE,
				ephemeral: true,
				components: [
					createMessageActionRow([
						createButton({
							customId: KEY_CANCEL,
							label: 'No, stop!',
							style: ButtonStyle.Primary,
						}),
						createButton({
							customId: KEY_CONFIRM,
							label: 'Yes, delete the sandbox (irreversible)!',
							style: ButtonStyle.Danger,
						}),
					]),
				],
			});
			break;
		}
		case KEY_CONFIRM:
			try {
				await interaction.update({
					content: 'Deletion in progress...',
					components: [],
				});
				await interaction.guild.delete();
			} catch {
				if (interaction.replied) {
					void interaction.update({
						content: CANNOT_DELETE,
						components: [],
					});
				} else {
					void interaction.reply({
						content: CANNOT_DELETE,
						components: [],
					});
				}
			}
			break;
		case KEY_CANCEL:
			void interaction.update({
				content: CANCEL_DELETE,
				components: [],
			});
			break;
		case KEY_INVITE: {
			const invites = await interaction.guild.invites.fetch();
			const invite = invites.first();
			if (invite) {
				void interaction.reply({
					content: INVITE_CREATE(invite.toString()),
					ephemeral: true,
				});
			} else {
				let channel = interaction.guild.channels.cache.find(
					(c) =>
						(c
							.permissionsFor(client.user!)
							?.has([PermissionFlagsBits.CreateInstantInvite, PermissionFlagsBits.ViewChannel]) &&
							c.isTextBased() &&
							!c.isThread()) ??
						false,
				);

				if (!channel) {
					channel = await interaction.guild.channels.create({ name: 'welcome', type: ChannelType.GuildText });
				}
				const c = channel as TextChannel;
				const invite = await c.createInvite({ maxAge: 0, reason: 'invite request' });
				void interaction.reply({
					content: INVITE_CREATE(invite.toString()),
					ephemeral: true,
				});
			}
			break;
		}
		case KEY_DELETE_CHANNEL:
			await interaction.update({ content: '✓ Channel deletion in progress...', components: [] });
			await interaction.channel?.delete();
			break;
		default: {
			const rest = interaction.customId.split(`${CREATE_PREFIX}_`)[1];
			let channel: GuildChannel;
			try {
				const extra = (interaction.guild.channels.cache.find(
					(c) => c.name === 'extra' && c.type === ChannelType.GuildCategory,
				) ??
					(await await interaction.guild.channels.create({
						name: 'extra',
						type: ChannelType.GuildText,
					}))) as CategoryChannel;

				switch (rest) {
					case SUFFIX_TEXT: {
						const txtChannel = await interaction.guild.channels.create({
							name: SUFFIX_TEXT.toLowerCase(),
							type: ChannelType.GuildText,
							parent: extra,
						});
						channel = txtChannel;
						void txtChannel.send({
							content: '\u200B',
							components: [DELETE_CHANNEL_ACTIONROW],
						});
						break;
					}
					case SUFFIX_NSFW: {
						const txtChannel = await interaction.guild.channels.create({
							name: SUFFIX_NSFW.toLowerCase(),
							type: ChannelType.GuildText,
							parent: extra,
							nsfw: true,
						});
						channel = txtChannel;
						void txtChannel.send({
							content: '\u200B',
							components: [DELETE_CHANNEL_ACTIONROW],
						});
						break;
					}
					case SUFFIX_VOICE:
						channel = await interaction.guild.channels.create({
							name: SUFFIX_VOICE.toLowerCase(),
							type: ChannelType.GuildVoice,
							parent: extra,
						});
						break;
					case SUFFIX_CATEGORY:
						channel = await interaction.guild.channels.create({
							name: SUFFIX_CATEGORY.toLowerCase(),
							type: ChannelType.GuildCategory,
						});
						break;
					default:
						logger.info(`Unknown switch option ${rest ?? 'undefined'}.`);
				}

				void interaction.reply({
					content: `✓ Created ${rest ?? 'undefined'} channel <#${channel!.id}>.`,
					ephemeral: true,
				});
			} catch (e) {
				const error = e as Error;
				logger.error(error, error.message);
			}
		}
	}
});

passOwnerEasteregg(client);

void client.login();

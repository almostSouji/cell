import { createMessageActionRow, createButton, truncate, logger } from '@yuudachi/framework';
import {
	ButtonStyle,
	ChannelType,
	Colors,
	CommandInteraction,
	GuildDefaultMessageNotifications,
	PermissionFlagsBits,
	SystemChannelFlagsBitField,
} from 'discord.js';
import { createSandboxId } from '../functions/util.js';
import type { CreateCommand } from '../interactions/create.js';
import {
	KEY_ADD_CATEGORY,
	KEY_ADD_NSFW,
	KEY_ADD_TEXT,
	KEY_ADD_VOICE,
	KEY_ADMIN,
	KEY_DELETE,
	KEY_DELETE_CHANNEL,
	KEY_INVITE,
} from '../keys.js';
import {
	APPLICATION_INVITE,
	CHANNELS_OF_TYPE_ADDED,
	ENTER_GUILD,
	GUILD_LIMIT_REACHED,
	JOIN_BEFORE_APP,
	NOT_APPLICATION,
	WELCOME_MESSAGE,
} from '../messages/messages.js';
import type { ArgumentsOf } from '../types/ArgumentsOf.js';

export const WELCOME_CHANNEL_ACTIONROWS = [
	createMessageActionRow([
		createButton({
			customId: KEY_ADMIN,
			label: 'Toggle Admin role',
			style: ButtonStyle.Primary,
		}),
		createButton({
			customId: KEY_DELETE,
			label: 'Delete Sandbox',
			style: ButtonStyle.Danger,
		}),
		createButton({
			customId: KEY_INVITE,
			label: 'Show invite',
			style: ButtonStyle.Secondary,
		}),
	]),
	createMessageActionRow([
		createButton({
			customId: KEY_ADD_TEXT,
			label: '+text',
			style: ButtonStyle.Secondary,
		}),
		createButton({
			customId: KEY_ADD_NSFW,
			label: '+nsfw',
			style: ButtonStyle.Secondary,
		}),
		createButton({
			customId: KEY_ADD_VOICE,
			label: '+voice',
			style: ButtonStyle.Secondary,
		}),
		createButton({
			customId: KEY_ADD_CATEGORY,
			label: '+category',
			style: ButtonStyle.Secondary,
		}),
	]),
];

export const DELETE_CHANNEL_ACTIONROW = createMessageActionRow([
	createButton({
		customId: KEY_DELETE_CHANNEL,
		label: 'Delete Channel',
		style: ButtonStyle.Danger,
	}),
]);

export async function handleCreateCommand(interaction: CommandInteraction, args: ArgumentsOf<typeof CreateCommand>) {
	const {
		user,
		client: { guilds },
	} = interaction;
	if (guilds.cache.size > 10) {
		await interaction.reply({
			content: GUILD_LIMIT_REACHED(guilds.cache.size),
			ephemeral: true,
		});
		return;
	}
	const parts = [];
	try {
		await interaction.deferReply({
			ephemeral: true,
		});

		logger.info(`${user.tag} (${user.id}) is creating a guild!`);

		const guild = await guilds.create({
			name: `Sandbox ${createSandboxId()}`,
			defaultMessageNotifications: GuildDefaultMessageNotifications.OnlyMentions,
			systemChannelFlags: [
				SystemChannelFlagsBitField.Flags.SuppressPremiumSubscriptions,
				SystemChannelFlagsBitField.Flags.SuppressGuildReminderNotifications,
				SystemChannelFlagsBitField.Flags.SuppressJoinNotificationReplies,
			],
			icon: './box.png',
		});

		await guild.roles.create({
			name: 'Admin',
			color: Colors.Blurple,
			permissions: PermissionFlagsBits.Administrator,
		});
		await guild.roles.create({
			name: 'Assignable ADMINISTRATOR',
			color: Colors.LuminousVividPink,
			permissions: PermissionFlagsBits.Administrator,
		});
		guild.channels.cache.forEach((c) => void c.delete());

		const welcome = await guild.channels.create({
			name: 'welcome',
			type: ChannelType.GuildText,
		});

		const invite = await welcome
			.createInvite({
				reason: 'Initial invite',
				temporary: true,
				unique: true,
			})
			.catch(() => undefined);

		const extra = await guild.channels.create({
			name: 'extra',
			type: ChannelType.GuildCategory,
		});

		const message = await welcome.send({
			embeds: [
				{
					description: WELCOME_MESSAGE(user.tag, `<t:${Math.floor(Date.now() / 1000)}:R>`),
					color: 0x2f3136,
				},
			],
			components: WELCOME_CHANNEL_ACTIONROWS,
		});

		await message.pin();
		await guild.setSystemChannel(welcome);
		await guild.roles.everyone.setPermissions([
			PermissionFlagsBits.ViewChannel,
			PermissionFlagsBits.SendMessages,
			PermissionFlagsBits.EmbedLinks,
			PermissionFlagsBits.AttachFiles,
			PermissionFlagsBits.ReadMessageHistory,
			PermissionFlagsBits.UseExternalEmojis,
			PermissionFlagsBits.UseExternalStickers,
			PermissionFlagsBits.Connect,
			PermissionFlagsBits.Speak,
			PermissionFlagsBits.ChangeNickname,
		]);

		if (args.textchannels) {
			for (let i = 0; i < args.textchannels; i++) {
				const channel = await guild.channels.create({
					name: `text-${i}`,
					type: ChannelType.GuildText,
					parent: extra,
				});
				void channel.send({
					content: '\u200B',
					components: [DELETE_CHANNEL_ACTIONROW],
				});
			}
			parts.push(CHANNELS_OF_TYPE_ADDED(args.textchannels, 'GUILD_TEXT'));
		}

		if (args.nsfwtextchannels) {
			for (let i = 0; i < args.nsfwtextchannels; i++) {
				const channel = await guild.channels.create({
					name: `nsfwtext-${i}`,
					type: ChannelType.GuildText,
					parent: extra,
					nsfw: true,
				});
				void channel.send({
					content: '\u200B',
					components: [DELETE_CHANNEL_ACTIONROW],
				});
			}
			parts.push(CHANNELS_OF_TYPE_ADDED(args.nsfwtextchannels, 'GUILD_TEXT (nsfw)'));
		}

		if (args.voicechannels) {
			for (let i = 0; i < args.voicechannels; i++) {
				await guild.channels.create({
					name: `voice-${i}`,
					type: ChannelType.GuildVoice,
					parent: extra,
				});
			}
			parts.push(CHANNELS_OF_TYPE_ADDED(args.voicechannels, 'GUILD_VOICE'));
		}

		if (args.categorychannels) {
			for (let i = 0; i < args.categorychannels; i++) {
				await guild.channels.create({
					name: `category-${i}`,
					type: ChannelType.GuildCategory,
				});
			}
			parts.push(CHANNELS_OF_TYPE_ADDED(args.categorychannels, 'GUILD_CATEGORY'));
		}

		if (args.bot) {
			const { bot: targetIsBot, tag: targetTag, id: targetId } = args.bot.user;
			if (targetIsBot) {
				const invite = `https://discordapp.com/oauth2/authorize?client_id=${targetId}&permissions=0&scope=bot`;
				parts.push(JOIN_BEFORE_APP);
				parts.push(APPLICATION_INVITE(targetTag, targetId, invite));
			} else {
				parts.push(NOT_APPLICATION(targetTag, targetId));
			}
		}

		parts.push(ENTER_GUILD(invite ? `[join \`${invite.code}\`](${invite.toString()})` : '`could not create invite`'));
		await interaction.editReply({
			content: parts.join('\n'),
		});
	} catch (e) {
		const error = e as Error;
		logger.error(error, error.message);
		await interaction.editReply({
			content: truncate(error.message, 1000, ''),
		});
	}
}

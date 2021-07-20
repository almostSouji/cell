import { CommandInteraction, Constants, MessageActionRow, MessageButton, Permissions } from 'discord.js';
import { logger } from '../functions/logger';
import { createSandboxId } from '../functions/util';
import { CreateCommand } from '../interactions/create';
import {
	APPLICATION_INVITE,
	CHANNELS_OF_TYPE_ADDED,
	ENTER_GUILD,
	GUILD_LIMIT_REACHED,
	JOIN_BEFORE_APP,
	NOT_APPLICATION,
	WELCOME_MESSAGE,
} from '../messages/messages';
import { ArgumentsOf } from '../types/ArgumentsOf';

export async function handleCreateCommand(interaction: CommandInteraction, args: ArgumentsOf<typeof CreateCommand>) {
	const {
		user,
		client,
		client: { guilds },
	} = interaction;
	if (guilds.cache.size > 10) {
		return interaction.reply({
			content: GUILD_LIMIT_REACHED(guilds.cache.size),
			ephemeral: true,
		});
	}
	const parts = [];
	await interaction.defer({
		ephemeral: true,
	});

	logger.info(`${user.tag} (${user.id}) is creating a guild!`);

	const guild = await guilds.create(`Sandbox ${createSandboxId()}`, {
		defaultMessageNotifications: 'ONLY_MENTIONS',
		systemChannelFlags: ['SUPPRESS_PREMIUM_SUBSCRIPTIONS', 'SUPPRESS_GUILD_REMINDER_NOTIFICATIONS'],
		icon: './box.png',
	});
	await guild.roles.create({
		name: 'Admin',
		color: Constants.Colors.BLURPLE,
		permissions: Permissions.FLAGS.ADMINISTRATOR,
	});
	await guild.roles.create({
		name: 'Assignable ADMINISTRATOR',
		color: Constants.Colors.LUMINOUS_VIVID_PINK,
		permissions: Permissions.FLAGS.ADMINISTRATOR,
	});
	guild.channels.cache.forEach((c) => void c.delete());

	const welcome = await guild.channels.create('welcome', {
		type: 'GUILD_TEXT',
	});
	const invite = await welcome.createInvite({
		maxAge: 0,
		maxUses: 0,
		reason: 'Initial invite',
		temporary: false,
		unique: true,
	});

	const extra = await guild.channels.create('extra', {
		type: 'GUILD_CATEGORY',
	});

	const message = await welcome.send({
		content: WELCOME_MESSAGE(user.tag, `<t:${Math.floor(Date.now() / 1000)}:R>`),
		components: [
			new MessageActionRow().addComponents([
				new MessageButton().setCustomId('admin').setLabel('Toggle Admin role').setStyle('PRIMARY'),
				new MessageButton().setCustomId('delete').setLabel('Delete sandbox').setStyle('DANGER'),
			]),
		],
	});
	void message.pin();
	void guild.setSystemChannel(welcome);
	await guild.roles.everyone.setPermissions([
		'VIEW_CHANNEL',
		'SEND_MESSAGES',
		'EMBED_LINKS',
		'ATTACH_FILES',
		'READ_MESSAGE_HISTORY',
		'USE_EXTERNAL_EMOJIS',
		'CONNECT',
		'SPEAK',
		'CHANGE_NICKNAME',
	]);

	if (args.textchannels) {
		for (let i = 0; i < args.textchannels; i++) {
			await guild.channels.create(`text-${i}`, {
				type: 'GUILD_TEXT',
				parent: extra,
			});
		}
		parts.push(CHANNELS_OF_TYPE_ADDED(args.textchannels, 'GUILD_TEXT'));
	}

	if (args.nsfwtextchannels) {
		for (let i = 0; i < args.nsfwtextchannels; i++) {
			await guild.channels.create(`nsfwtext-${i}`, {
				type: 'GUILD_TEXT',
				parent: extra,
				nsfw: true,
			});
		}
		parts.push(CHANNELS_OF_TYPE_ADDED(args.nsfwtextchannels, 'GUILD_TEXT (nsfw)'));
	}

	if (args.voicechannels) {
		for (let i = 0; i < args.voicechannels; i++) {
			await guild.channels.create(`voice-${i}`, {
				type: 'GUILD_VOICE',
				parent: extra,
			});
		}
		parts.push(CHANNELS_OF_TYPE_ADDED(args.voicechannels, 'GUILD_VOICE'));
	}

	if (args.categorychannels) {
		for (let i = 0; i < args.categorychannels; i++) {
			await guild.channels.create(`category-${i}`, {
				type: 'GUILD_CATEGORY',
			});
		}
		parts.push(CHANNELS_OF_TYPE_ADDED(args.categorychannels, 'GUILD_CATEGORY'));
	}

	if (args.bot) {
		const { bot: targetIsBot, tag: targetTag, id: targetId } = args.bot.user;
		if (targetIsBot) {
			const invite = `<https://discordapp.com/oauth2/authorize?client_id=${client.user!.id}&permissions=0&scope=${
				args.scopes ?? 'interactions.commands'
			}>`;
			parts.push(JOIN_BEFORE_APP);
			parts.push(APPLICATION_INVITE(targetTag, targetId, invite));
		} else {
			parts.push(NOT_APPLICATION(targetTag, targetId));
		}
	}

	parts.push(ENTER_GUILD(invite.toString()));
	await interaction.editReply({
		content: parts.join('\n'),
	});
}

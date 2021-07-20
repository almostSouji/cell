/* eslint-disable @typescript-eslint/no-misused-promises */
import { Intents, Client, GuildMemberRoleManager, MessageActionRow, MessageButton } from 'discord.js';

import { handleCommands } from './functions/handleCommands';

import { logger } from './functions/logger';
import {
	CANCEL_DELETE,
	CANNOT_DELETE,
	CANNOT_UPDATE_ROLES,
	DELETE_SURE,
	READY,
	ROLES_UPDATED,
	TIME_OUT,
} from './messages/messages';

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
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
	presence: {
		activities: [
			{
				type: 'WATCHING',
				name: 'over sandboxes',
			},
		],
		status: 'online',
	},
});

client.on('ready', () => {
	logger.info(READY(client.user!.tag, client.user!.id));
});

client.on('interaction', async (interaction) => {
	void handleCommands(interaction);

	if (!interaction.guild || !interaction.isButton()) return;
	switch (interaction.customId) {
		case 'admin':
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
		case 'delete':
			void interaction.reply({
				content: DELETE_SURE,
				ephemeral: true,
				components: [
					new MessageActionRow().addComponents(
						new MessageButton().setCustomId('cancel').setLabel('No, stop!').setStyle('SECONDARY'),
						new MessageButton().setCustomId('confirm').setLabel('Yes, delete the sandbox').setStyle('DANGER'),
					),
				],
			});
			setTimeout(
				() =>
					interaction.editReply({
						content: TIME_OUT,
						components: [],
					}),
				10_000,
			);
			break;
		case 'confirm':
			try {
				await interaction.guild.delete();
			} catch {
				void interaction.reply({
					content: CANNOT_DELETE,
					ephemeral: true,
				});
			}
			break;
		case 'cancel':
			void interaction.reply({
				content: CANCEL_DELETE,
				ephemeral: true,
			});
	}
});

void client.login();

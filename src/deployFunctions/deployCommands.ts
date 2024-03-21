import 'reflect-metadata';
import { logger } from '@yuudachi/framework';
import { REST, Routes } from 'discord.js';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { CreateCommand } from '../interactions/create.js';
import { DeleteCommand } from '../interactions/delete.js';
import { InviteBotCommand } from '../interactions/inviteBot.js';
import { ListCommand } from '../interactions/list.js';
/* eslint-enable @typescript-eslint/no-unused-vars */
enum ApplicationCommandContextType {
	Guild,
	BotDm,
	PrivateChannel,
}

enum ApplicationIntegrationType {
	GuildInstall,
	UserInstall,
}

async function main() {
	const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN!);

	try {
		if ((process.env.DISCORD_GUILD?.length ?? 0) > 16) {
			logger.info(`Start refreshing interaction (/) commands on guild ${process.env.DISCORD_GUILD!}`);
			await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, process.env.DISCORD_GUILD!), {
				body: [],
			});
		} else {
			logger.info('Start refreshing global interaction (/) commands');
			await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
				body: [InviteBotCommand, CreateCommand, DeleteCommand, ListCommand].map((command) => ({
					...command,
					integration_types: [ApplicationIntegrationType.UserInstall],
					contexts: [
						ApplicationCommandContextType.Guild,
						ApplicationCommandContextType.PrivateChannel,
						ApplicationCommandContextType.BotDm,
					],
				})),
			});
		}

		logger.info('Sucessfully reloaded interaction (/) commands.');
	} catch (e) {
		const error = e as Error;
		logger.error(error);
	}
}

void main();

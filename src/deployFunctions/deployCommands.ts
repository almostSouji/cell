import { config } from 'dotenv';
import { resolve } from 'path';
import { REST } from '@discordjs/rest';
import { Routes, Snowflake } from 'discord-api-types/v8';

config({ path: resolve(__dirname, '../../.env') });

/* eslint-disable @typescript-eslint/no-unused-vars */
import { CreateCommand } from '../interactions/create';
import { InviteBotCommand } from '../interactions/inviteBot';
import { ListCommand } from '../interactions/list';
import { DeleteCommand } from '../interactions/delete';
/* eslint-enable @typescript-eslint/no-unused-vars */
import { logger } from '../functions/logger';

async function main() {
	const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN!);

	try {
		if ((process.env.DISCORD_GUILD?.length ?? 0) > 16) {
			logger.info(`Start refreshing interaction (/) commands on guild ${process.env.DISCORD_GUILD!}`);
			await rest.put(
				Routes.applicationGuildCommands(
					process.env.DISCORD_CLIENT_ID as Snowflake,
					process.env.DISCORD_GUILD as Snowflake,
				),
				{
					body: [CreateCommand, ListCommand, DeleteCommand],
				},
			);
		} else {
			logger.info('Start refreshing global interaction (/) commands');
			await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID as Snowflake), {
				body: [InviteBotCommand],
			});
		}

		logger.info('Sucessfully reloaded interaction (/) commands.');
	} catch (e) {
		const error = e as Error;
		logger.error(error);
	}
}

void main();

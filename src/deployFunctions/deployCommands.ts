import { config } from 'dotenv';
import { resolve } from 'path';
import { REST } from '@discordjs/rest';
import { Routes, Snowflake } from 'discord-api-types/v8';

config({ path: resolve(__dirname, '../../.env') });

/* eslint-disable @typescript-eslint/no-unused-vars */
import { CreateCommand } from '../interactions/create';
import { InviteBotCommand } from '../interactions/inviteBot';
import { ListCommand } from '../interactions/list';
/* eslint-enable @typescript-eslint/no-unused-vars */
import { logger } from '../functions/logger';

const commands = [CreateCommand, InviteBotCommand, ListCommand];

async function main() {
	const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN!);

	try {
		logger.info('Start refreshing interaction (/) commands');
		await rest.put(
			// @ts-ignore
			Routes.applicationCommands(process.env.DISCORD_CLIENT_ID as Snowflake),
			{
				body: commands,
			},
		);
		logger.info('Sucessfully reloaded interaction (/) commands.');
	} catch (e) {
		const error = e as Error;
		logger.error(error);
	}
}

void main();

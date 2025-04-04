import { ApplicationIntegrationType, InteractionContextType, Routes } from '@discordjs/core';
import { REST } from '@discordjs/rest';
import { logger } from '../utils/logger.js';
import { AdminToggleCommand } from '../interactions/admin.js';
import { InviteAppCommand } from '../interactions/invite.js';
import { PanelCommand } from '../interactions/panel.js';

const token = process.env.DISCORD_TOKEN;
const appId = process.env.DISCORD_CLIENT_ID;

if (!token || !appId) {
	logger.error('Missing ENV key');
	process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

const commands = [AdminToggleCommand, InviteAppCommand, PanelCommand];

try {
	logger.info(`Start refreshing interaction commands for application ${appId}.`);
	await rest.put(Routes.applicationCommands(appId), {
		body: commands.map((command) => ({
			...command,
			integration_types: [ApplicationIntegrationType.GuildInstall],
			contexts: [InteractionContextType.Guild],
		})),
	});

	logger.info(commands, 'Successfully reloaded interaction commands.');
} catch (error) {
	logger.error(error);
}

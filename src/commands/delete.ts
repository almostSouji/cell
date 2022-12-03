import { logger } from '@yuudachi/framework';
import type { CommandInteraction } from 'discord.js';
import type { DeleteCommand } from '../interactions/delete.js';
import { DELETE_ERROR, DELETE_NOT_GUILD, DELETE_NOT_SANDBOX, DELETE_SUCCESS } from '../messages/messages.js';

import type { ArgumentsOf } from '../types/ArgumentsOf.js';

export async function handleDeleteCommand(interaction: CommandInteraction, args: ArgumentsOf<typeof DeleteCommand>) {
	await interaction.deferReply({
		ephemeral: true,
	});

	const parts = [];

	const guild = interaction.client.guilds.resolve(args.guild);
	if (!guild) {
		parts.push(DELETE_NOT_GUILD(args.guild));
	} else if (guild.ownerId === interaction.client.user.id) {
		try {
			logger.info(`${interaction.user.tag} (${interaction.user.id}) is deleting sandbox ${guild.name} (${guild.id})`);
			await guild.delete();
			parts.push(DELETE_SUCCESS(guild.name, guild.id));
		} catch (e) {
			const error = e as Error;
			parts.push(DELETE_ERROR(error.message, guild.name, guild.id));
		}
	} else {
		parts.push(DELETE_NOT_SANDBOX(guild.name, guild.id));
	}

	await interaction.editReply({
		content: parts.join('\n'),
	});
}

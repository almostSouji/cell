import { CommandInteraction } from 'discord.js';
import { DeleteCommand } from '../interactions/delete';
import { DELETE_ERROR, DELETE_NOT_GUILD, DELETE_NOT_SANDBOX, DELETE_SUCCESS } from '../messages/messages';

import { ArgumentsOf } from '../types/ArgumentsOf';

export async function handleDeleteCommand(interaction: CommandInteraction, args: ArgumentsOf<typeof DeleteCommand>) {
	await interaction.deferReply({
		ephemeral: true,
	});

	const parts = [];

	const guild = interaction.client.guilds.resolve(args.guild);
	if (!guild) {
		parts.push(DELETE_NOT_GUILD(args.guild));
	} else if (guild.ownerId === interaction.client.user!.id) {
		try {
			await guild.delete();
			parts.push(DELETE_SUCCESS(guild.name, guild.id));
		} catch (e: any) {
			parts.push(DELETE_ERROR(e.message, guild.name, guild.id));
		}
	} else {
		parts.push(DELETE_NOT_SANDBOX(guild.name, guild.id));
	}

	await interaction.editReply({
		content: parts.join('\n'),
	});
}

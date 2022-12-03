import type { Interaction } from 'discord.js';
import { transformInteraction } from './commandParsing/transformInteraction.js';
import { handleCreateCommand } from '../commands/create.js';
import { handleDeleteCommand } from '../commands/delete.js';
import { handleInviteBotCommand } from '../commands/inviteBot.js';
import { handleListCommand } from '../commands/list.js';
import { CreateCommand } from '../interactions/create.js';
import { DeleteCommand } from '../interactions/delete.js';
import { InviteBotCommand } from '../interactions/inviteBot.js';
import { ListCommand } from '../interactions/list.js';
import { INTERACTION_NO_HANDLER } from '../messages/messages.js';

export function handleCommands(interaction: Interaction) {
	if (!interaction.isCommand()) return;
	const { commandName, options } = interaction;
	const args = [...options.data];

	switch (commandName) {
		case CreateCommand.name:
			return handleCreateCommand(interaction, transformInteraction<typeof CreateCommand>(args));
		case InviteBotCommand.name:
			return handleInviteBotCommand(interaction, transformInteraction<typeof InviteBotCommand>(args));

		case DeleteCommand.name:
			return handleDeleteCommand(interaction, transformInteraction<typeof DeleteCommand>(args));
		case ListCommand.name:
			return handleListCommand(interaction);

		default:
			return interaction.reply({
				content: INTERACTION_NO_HANDLER(commandName, interaction.id),
				ephemeral: true,
			});
	}
}

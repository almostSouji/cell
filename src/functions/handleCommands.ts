import { Interaction } from 'discord.js';
import { handleCreateCommand } from '../commands/create';
import { handleDeleteCommand } from '../commands/delete';
import { handleInviteBotCommand } from '../commands/inviteBot';
import { handleListCommand } from '../commands/list';
import { CreateCommand } from '../interactions/create';
import { DeleteCommand } from '../interactions/delete';
import { InviteBotCommand } from '../interactions/inviteBot';
import { ListCommand } from '../interactions/list';
import { INTERACTION_NO_HANDLER } from '../messages/messages';
import { transformInteraction } from './commandParsing/transformInteraction';

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
				content: INTERACTION_NO_HANDLER(interaction.commandName, interaction.id),
				ephemeral: true,
			});
	}
}

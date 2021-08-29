import { CommandInteraction } from 'discord.js';
import { InviteBotCommand } from '../interactions/inviteBot';
import { APPLICATION_INVITE, NOT_APPLICATION } from '../messages/messages';
import { ArgumentsOf } from '../types/ArgumentsOf';

export async function handleInviteBotCommand(
	interaction: CommandInteraction,
	args: ArgumentsOf<typeof InviteBotCommand>,
) {
	await interaction.defer({
		ephemeral: true,
	});
	const parts = [];
	const { bot: targetIsBot, tag: targetTag, id: targetId } = args.bot.user;
	if (targetIsBot) {
		const invite = `https://discordapp.com/oauth2/authorize?client_id=${targetId}&permissions=0&scope=${
			args.scopes ?? 'interactions.commands'
		}`;
		parts.push(APPLICATION_INVITE(targetTag, targetId, invite));
	} else {
		parts.push(NOT_APPLICATION(targetTag, targetId));
	}

	await interaction.editReply({
		content: parts.join('\n'),
	});
}

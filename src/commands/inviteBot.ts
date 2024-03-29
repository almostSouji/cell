import type { CommandInteraction } from 'discord.js';
import type { InviteBotCommand } from '../interactions/inviteBot.js';
import { APPLICATION_INVITE, NOT_APPLICATION } from '../messages/messages.js';
import type { ArgumentsOf } from '../types/ArgumentsOf.js';

export async function handleInviteBotCommand(
	interaction: CommandInteraction,
	args: ArgumentsOf<typeof InviteBotCommand>,
) {
	await interaction.deferReply({
		ephemeral: true,
	});
	const parts = [];
	const { bot: targetIsBot, tag: targetTag, id: targetId } = args.bot.user;
	if (targetIsBot) {
		const invite = `https://discordapp.com/oauth2/authorize?client_id=${targetId}&permissions=0&scope=bot`;
		parts.push(APPLICATION_INVITE(targetTag, targetId, invite));
	} else {
		parts.push(NOT_APPLICATION(targetTag, targetId));
	}

	await interaction.editReply({
		content: parts.join('\n'),
	});
}

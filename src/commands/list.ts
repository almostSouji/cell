import { ChannelType, CommandInteraction, TextChannel } from 'discord.js';
import { WELCOME_CHANNEL_ACTIONROWS } from './create.js';
import { WELCOME_MESSAGE_FORCE } from '../messages/messages.js';

export async function handleListCommand(interaction: CommandInteraction) {
	await interaction.deferReply({
		ephemeral: true,
	});
	const parts = [];

	for (const guild of interaction.client.guilds.cache
		.filter((g) => g.ownerId === interaction.client.user.id)
		.values()) {
		let welcome = guild.channels.cache.find((c) => c.name === 'welcome' && c.isTextBased() && !c.isThread()) as
			| TextChannel
			| undefined;

		if (!welcome) {
			welcome = await guild.channels.create({
				name: 'welcome',
				type: ChannelType.GuildText,
			});
		}

		const welcomeMessage = await welcome.messages
			.fetch({ limit: 100 })
			.then((mm) => mm.find((m) => m.components.length > 0));
		if (!welcomeMessage) {
			await welcome.send({
				embeds: [
					{
						description: WELCOME_MESSAGE_FORCE(`<t:${Math.floor(Date.now() / 1000)}:R>`),
						color: 0x2f3136,
					},
				],
				components: WELCOME_CHANNEL_ACTIONROWS,
			});
		}

		let invite = await guild.invites.fetch().then((i) => i.first());
		if (!invite) {
			invite = await welcome
				.createInvite({
					reason: 'List invite',
					unique: true,
				})
				.catch(() => undefined);
		}

		parts.push(
			`• \`${guild.name}\` \`${guild.id}\` ${
				invite ? `[join \`${invite.code}\`](${invite.toString()})` : '`could not create invite`'
			}`,
		);
	}

	await interaction.editReply({
		content: parts.join('\n'),
	});
}

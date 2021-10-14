import { CommandInteraction, Constants, MessageActionRow, MessageButton, MessageEmbed, TextChannel } from 'discord.js';
import { WELCOME_MESSAGE } from '../messages/messages';

export async function handleListCommand(interaction: CommandInteraction) {
	await interaction.defer({
		ephemeral: true,
	});
	const parts = [];

	for (const guild of interaction.client.guilds.cache
		.filter((g) => g.ownerId === interaction.client.user!.id)
		.values()) {
		let welcome = guild.channels.cache.find((c) => c.name === 'welcome' && c.type === 'GUILD_TEXT') as
			| TextChannel
			| undefined;

		if (!welcome) {
			welcome = await guild.channels.create('welcome', {
				type: 'GUILD_TEXT',
			});
		}

		const welcomeMessage = await welcome.messages
			.fetch({ limit: 100 })
			.then((mm) => mm.find((m) => m.components.length > 0));
		if (!welcomeMessage) {
			await welcome.send({
				embeds: [
					new MessageEmbed()
						.setDescription(WELCOME_MESSAGE(interaction.client.user!.tag, `<t:${Math.floor(Date.now() / 1000)}:R>`))
						.setColor('#2F3136'),
				],
				components: [
					new MessageActionRow().addComponents([
						new MessageButton()
							.setCustomId('admin')
							.setLabel('Toggle Admin role')
							.setStyle(Constants.MessageButtonStyles.PRIMARY),
						new MessageButton()
							.setCustomId('delete')
							.setLabel('Delete sandbox')
							.setStyle(Constants.MessageButtonStyles.DANGER),
						new MessageButton()
							.setCustomId('invite')
							.setLabel('Invite')
							.setStyle(Constants.MessageButtonStyles.SECONDARY),
					]),
					new MessageActionRow().addComponents([
						new MessageButton()
							.setCustomId('addtext')
							.setLabel('+text')
							.setStyle(Constants.MessageButtonStyles.SECONDARY),
						new MessageButton()
							.setCustomId('addnsfw')
							.setLabel('+nsfw')
							.setStyle(Constants.MessageButtonStyles.SECONDARY),
						new MessageButton()
							.setCustomId('addvoice')
							.setLabel('+voice')
							.setStyle(Constants.MessageButtonStyles.SECONDARY),
						new MessageButton()
							.setCustomId('addcategory')
							.setLabel('+category')
							.setStyle(Constants.MessageButtonStyles.SECONDARY),
					]),
				],
			});
		}

		let invite = await guild.invites.fetch().then((i) => i.first());
		if (!invite) {
			invite = await welcome.createInvite({
				maxAge: 0,
				maxUses: 0,
				reason: 'Initial invite',
				temporary: false,
				unique: true,
			});
		}

		parts.push(`• \`${guild.name}\` \`${guild.id}\` [join guild](${invite.toString()})`);
	}

	await interaction.editReply({
		content: parts.join('\n'),
	});
}

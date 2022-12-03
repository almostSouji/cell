import { ApplicationCommandOptionType } from 'discord.js';

export const InviteBotCommand = {
	name: 'invite-bot',
	description: 'Create an invite link for provided Discord application',
	default_permission: true,
	options: [
		{
			type: ApplicationCommandOptionType.User,
			name: 'bot',
			description: 'Application to invite',
			required: true,
		},
	],
} as const;

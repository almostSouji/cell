import { ApplicationCommandOptionType, ApplicationCommandType } from '@discordjs/core';

export const InviteAppCommand = {
	type: ApplicationCommandType.ChatInput,
	name: 'invite-app',
	description: 'Generate invite link for an app ',
	options: [
		{
			type: ApplicationCommandOptionType.User,
			name: 'target',
			description: 'Application to invite',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.Boolean,
			name: 'bot',
			description: 'Invite as BOT user (vs. application)',
			required: true,
		},
	],
} as const;

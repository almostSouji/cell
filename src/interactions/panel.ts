import { ApplicationCommandOptionType, ApplicationCommandType } from '@discordjs/core';

export const PanelCommand = {
	type: ApplicationCommandType.ChatInput,
	name: 'panel',
	description: 'Show the channel panel',
	options: [
		{
			type: ApplicationCommandOptionType.Boolean,
			name: 'show',
			description: 'Post the panel for everyone to see (and use)',
			required: false,
		},
	],
} as const;

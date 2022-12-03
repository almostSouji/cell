import { ApplicationCommandOptionType } from 'discord.js';

export const DeleteCommand = {
	name: 'delete',
	description: '🔧 Delete a sandbox',
	default_permission: false,
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'guild',
			description: 'Sandbox to delete',
			required: true,
		},
	],
} as const;

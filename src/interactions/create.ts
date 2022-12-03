import { ApplicationCommandOptionType } from 'discord.js';

export const CreateCommand = {
	name: 'create',
	description: '🔧 Create a new sandbox with provided parameters',
	default_permission: true,
	options: [
		{
			type: ApplicationCommandOptionType.Integer,
			name: 'textchannels',
			description: 'Amount of text channels to create (default 0)',
		},
		{
			type: ApplicationCommandOptionType.Integer,
			name: 'voicechannels',
			description: 'Amount of voice channels to create (default 0)',
		},
		{
			type: ApplicationCommandOptionType.Integer,
			name: 'categorychannels',
			description: 'Amount of category channels to create (default 0)',
		},
		{
			type: ApplicationCommandOptionType.Integer,
			name: 'nsfwtextchannels',
			description: 'Amount of nsfw text channels to create (default 0)',
		},
		{
			type: ApplicationCommandOptionType.User,
			name: 'bot',
			description: 'Application to invite',
		},
	],
} as const;

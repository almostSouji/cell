export const CreateCommand = {
	name: 'create',
	description: 'Create a new sandbox with provided parameters',
	default_permission: true,
	options: [
		{
			type: 4,
			name: 'textchannels',
			description: 'Amount of text channels to create (default 0)',
		},
		{
			type: 4,
			name: 'voicechannels',
			description: 'Amount of voice channels to create (default 0)',
		},
		{
			type: 4,
			name: 'categorychannels',
			description: 'Amount of category channels to create (default 0)',
		},
		{
			type: 4,
			name: 'nsfwtextchannels',
			description: 'Amount of nsfw text channels to create (default 0)',
		},
		{
			type: 6,
			name: 'bot',
			description: 'Application to invite',
		},
		{
			type: 3,
			name: 'scopes',
			description: 'Scopes to invite the application with',
			choices: [
				{
					name: 'interactions (default)',
					value: 'applications.commands',
				},
				{
					name: 'bot',
					value: 'bot',
				},
				{
					name: 'bot & interactions',
					value: 'bot%20applications.commands',
				},
			],
		},
	],
} as const;

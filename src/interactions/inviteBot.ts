export const InviteBotCommand = {
	name: 'invite-bot',
	description: 'Create an invite link for provided Discord application',
	default_permission: true,
	options: [
		{
			type: 6,
			name: 'bot',
			description: 'Application to invite',
			required: true,
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

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
	],
} as const;

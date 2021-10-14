export const DeleteCommand = {
	name: 'delete',
	description: '🔧 Delete a sandbox',
	default_permission: false,
	options: [
		{
			type: 3,
			name: 'guild',
			description: 'Sandbox to delete',
			required: true,
		},
	],
} as const;

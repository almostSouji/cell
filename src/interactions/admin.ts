import { ApplicationCommandType } from '@discordjs/core';

export const AdminToggleCommand = {
	type: ApplicationCommandType.ChatInput,
	name: 'admin-toggle',
	description: 'Toggle admin role',
	options: [],
} as const;

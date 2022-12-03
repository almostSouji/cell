/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
import { ApplicationCommandOptionType, CommandInteractionOption } from 'discord.js';

import type { ArgumentsOf, Command } from '../../types/ArgumentsOf.js';

export function transformInteraction<T extends Command>(
	options: CommandInteractionOption[],
	opts: any = {},
): ArgumentsOf<T> {
	if (options.length === 0) return opts;

	const top = options.shift();
	if (!top) return opts;

	if (
		top.type === ApplicationCommandOptionType.Subcommand ||
		top.type === ApplicationCommandOptionType.SubcommandGroup
	) {
		opts[top.name] = transformInteraction(top.options ? [...top.options.values()] : []);
	} else if (top.type === ApplicationCommandOptionType.User) {
		opts[top.name] = { user: top.user, member: top.member };
	} else if (top.type === ApplicationCommandOptionType.Channel) {
		opts[top.name] = top.channel;
	} else if (top.type === ApplicationCommandOptionType.Role) {
		opts[top.name] = top.role;
	} else {
		opts[top.name] = top.value;
	}

	return transformInteraction(options, opts);
}

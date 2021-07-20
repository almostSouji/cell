import { Snowflake, MessageEmbed } from 'discord.js';

export function createSandboxId(): string {
	return Buffer.from(Date.now().toString()).toString('base64').slice(-6, -2);
}

export function truncate(text: string, len: number, splitChar = ' '): string {
	if (text.length <= len) return text;
	const words = text.split(splitChar);
	const res: string[] = [];
	for (const word of words) {
		const full = res.join(splitChar);
		if (full.length + word.length + 1 <= len - 3) {
			res.push(word);
		}
	}

	const resText = res.join(splitChar);
	return resText.length === text.length ? resText : `${resText.trim()}...`;
}

const LIMIT_EMBED_DESCRIPTION = 2048 as const;
const LIMIT_EMBED_TITLE = 256 as const;
const LIMIT_EMBED_FIELDS = 25 as const;
const LIMIT_EMBED_FIELD_NAME = 256 as const;
const LIMIT_EMBED_FIELD_VALUE = 1024 as const;
const LIMIT_EMBED_AUTHOR_NAME = 256 as const;
const LIMIT_EMBED_FOOTER_TEXT = 2048 as const;

export function truncateEmbed(embed: MessageEmbed): MessageEmbed {
	if (embed.description && embed.description.length > LIMIT_EMBED_DESCRIPTION) {
		embed.description = truncate(embed.description, LIMIT_EMBED_DESCRIPTION);
	}
	if (embed.title && embed.title.length > LIMIT_EMBED_TITLE) {
		embed.title = truncate(embed.title, LIMIT_EMBED_TITLE);
	}
	if (embed.fields.length > LIMIT_EMBED_FIELDS) {
		embed.fields = embed.fields.slice(0, LIMIT_EMBED_FIELDS);
	}
	if (embed.author?.name) {
		embed.author.name = truncate(embed.author.name, LIMIT_EMBED_AUTHOR_NAME);
	}
	if (embed.footer?.text) {
		embed.footer.text = truncate(embed.footer.text, LIMIT_EMBED_FOOTER_TEXT);
	}
	for (const field of embed.fields) {
		field.name = truncate(field.name, LIMIT_EMBED_FIELD_NAME);
		field.value = truncate(field.value, LIMIT_EMBED_FIELD_VALUE);
	}
	return embed;
}

export function serializeTargets(op: number, user: Snowflake, channel: Snowflake, message: Snowflake): string {
	const b = Buffer.alloc(2 + 24);
	b.writeUInt16LE(op);
	b.writeBigUInt64LE(BigInt(user), 2);
	b.writeBigUInt64LE(BigInt(channel), 10);
	b.writeBigUInt64LE(BigInt(message), 18);
	return b.toString('binary');
}

export interface DeserializedTargets {
	user: Snowflake;
	channel: Snowflake;
	message: Snowflake;
}

export function deserializeTargets(buffer: Buffer): DeserializedTargets {
	return {
		user: `${buffer.readBigInt64LE(2)}` as const,
		channel: `${buffer.readBigInt64LE(10)}` as const,
		message: `${buffer.readBigInt64LE(18)}` as const,
	};
}

export function serializeOpCode(op: number): string {
	const b = Buffer.alloc(2);
	b.writeUInt16LE(op);
	return b.toString('binary');
}

export function cleanContent(initial: string): string {
	return initial.replace(/\b(?:fuck|shi+t)\b/g, '');
}

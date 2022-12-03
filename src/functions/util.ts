import type { Snowflake } from 'discord.js';

export function createSandboxId(): string {
	return Buffer.from(Date.now().toString()).toString('base64').slice(-6, -2);
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

import { verifyKey } from 'discord-interactions';
import type { FastifyRequest } from 'fastify';

export function getVerifyRequest(pubKey: string) {
	return async function verifyRequest(
		req: FastifyRequest<{
			Headers: {
				'x-signature-ed25519': string;
				'x-signature-timestamp': string;
			};
		}>,
	) {
		const signature = req.headers['x-signature-ed25519'];
		const timestamp = req.headers['x-signature-timestamp'];

		if (!req.rawBody) {
			throw new Error('Expected to find raw body on request, none found');
		}

		return verifyKey(req.rawBody, signature, timestamp, pubKey);
	};
}

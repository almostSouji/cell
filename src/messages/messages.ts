export const INTERACTION_NO_HANDLER = (name: string, id: string) => `No handler found for ${name} (${id})`;
export const READY = (tag: string, id: string) => `Ready on ${tag} (${id})`;
export const GUILD_LIMIT_REACHED = (amount: number) =>
	`Bots can only create guilds if they are on 9 or less guilds themselves. Current amount of servers: \`${amount}\``;
export const WELCOME_MESSAGE = (tag: string, now: string) =>
	`>>> **Welcome! This server is an application managed sandbox**\n• You can use the left button to grant yourself administrator privileges.\n• There is an additional administrator role to grant alts and bots.\n• This sandbox has been created by \`${tag}\` ${now}.`;
export const CREATION_LOG = (tag: string, id: string) => `Creating sandbox for ${tag} (${id})`;
export const NOT_APPLICATION = (tag: string, id: string) =>
	`✘ Target \`${tag}\` (${id}) is not an application. Can not create invite.`;
export const APPLICATION_INVITE = (tag: string, id: string, invite: string) =>
	`✓ Invite ${tag} (${id}): [(invite application)](<${invite}>)`;
export const JOIN_BEFORE_APP = '**Please make sure to join the server first and give yourself permissions!**';
export const CHANNELS_OF_TYPE_ADDED = (num: number, type: string) => `✓ Added \`${num}\` channels of type \`${type}\``;
export const ENTER_GUILD = (invite: string) => `✓ Your invite was created: [(join server)](${invite})`;
export const CANNOT_DELETE = '✘ Cannot delete the sandbox.';
export const CANNOT_UPDATE_ROLES = '✘ Cannot update roles.';
export const ROLES_UPDATED = '✓ Roles updated.';
export const CANCEL_DELETE = '✓ Cancelled sandbox deletion.';
export const DELETE_SURE = 'Do you really want to delete this sandbox? This action is irreversible!';
export const TIME_OUT = '✘ This action timed out.';
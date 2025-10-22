# Project setup

1. Create a [Discord application](https://discord.com/developers/applications)
2. Create a `.env` file in the project root following the format

```
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
```

3. Install dependencies, deploy commands and run the bot

```
yarn
yarn deploy:glob
yarn build && yarn start
```

# Server Setup

> [!CAUTION]
> This project is meant for easily reproducing issues and managing test servers.
> It is not recommended for production use in actual community servers.

1. Create a Discord server (preferably with an alt account, so the "Toggle admin role" feature isn't overwritten by owner permissions)
2. Invite the app with the `bot` scope and `MANAGE_ROLES` and `MANAGE_CHANNELS` permission
3. use `/panel` in a channel of your choice

> [!IMPORTANT]
> Discord decided that apps can no longer own servers.
> As a result Cell can no longer create and take down sandboxes on the fly and instead needs to be invited and can only manage channels and roles.

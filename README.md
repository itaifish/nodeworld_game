# Nodeworld

This game is a homage to the videogame [edgeworld](https://edgeworld.fandom.com/wiki/Edgeworld_Wiki), with base building, factions, battling, and realtime building delays.

The backend and frontend is Typescript, bootstrapped with Create-T3-App. This includes Prisma, NextJS, NextAuth, and tRPC. The game client and animations are in phaser3.

The development build of this game is currently hosted at <https://dev.nodeworld.protractors.dev/>

## Development / Contributing

### Getting started

1. Fork this repository on github and clone to your local computer
2. Run `yarn` to install all necessary dependencies
    1. If you don't have `yarn` or `nodejs/npm`, you can download and install node [here](https://nodejs.org/en), or use [nvm](https://github.com/nvm-sh/nvm) if you may need multiple versions of npm.
    2. To install yarn, run `npm i -g yarn`
3. Create a .env file, duplicated from the `.env.example` file
4. By default, you should only need to set 4 fields (the rest you can keep as-is):
    1. DATABASE_URL
        1. This is the URL for your (posgres) database. The easiest way to get a database up and running is to use railway.
        2. Navigate to [railway.app](https://railway.app/)
        3. Click 'Start New Project' then 'Provision Posgres'
        4. Click on the new square with the elephant icon, navigate to the 'connect' tab, and under 'Available Variables', copy `DATABASE_URL` to your clipboard
        5. Put that value in your .env for the DATABASE_URL key
    2. NEXTAUTH_SECRET
        1. This is a randomized secret the server uses to encrypt data. It doesn't matter what its value is, but make sure it doesn't leak
        2. Open a linux or git bash terminal and run `openssl rand -base64 32`
        3. Put that value in your .env for the NEXTAUTH_SECRET key
    3. DISCORD_CLIENT_ID & DISCORD_CLIENT_SECRET
        1. Nodeworld uses discord as an OAuth provider. In order to get this working locally, you'll need to create a discord application that we can use for OAuth
        2. Head to <https://discord.com/developers/applications>
        3. Click 'New Application'
        4. Click on 'OAuth2' in the sidebar
        5. Add `http://localhost:3000/api/auth/callback/discord` and `https://localhost:3000` to the 'Redirects' field
        6. Copy the Client ID and Client Secret values into your .env
5. Run `yarn run migrate`. This will define all the tables in the DB
6. Run `yarn run dev` to load up a local development server. You should be good to go!

### Making Changes

#### **Database**

Nodeworld uses a database ORM called [Prisma](https://www.prisma.io/). In order to modify the structure of tables in the DB, open up the `prisma/schema.prisma`. After modifying this file to your liking ([Prisma Docs](https://www.prisma.io/docs) are very helpful here), run `yarn run generate` to transpile the corresponding typescript. In order to save your changes to the DB, run `yarn run migrate`.

#### **Backend**

Nearly all of the relevant backend logic is in the `src/server` folder. Nodeworld uses [tRPC](https://trpc.io/) for an end-to-end typesafe RPC solution. 

#### **Frontend**

While Nodeworld is running in a Next.js/React container, all of the relevant frontend logic is done in [Phaser 3](https://phaser.io/). The `src/game` folder is where this code sits.  

#### **Merging Changes**

When your changes are ready to be merged into the main repository, open up a pull request. Include screenshots of any visual changes, and a description of what was changed and why.

## Game Mechanics

### Summary

Nodeworld is a base-building idle game, where most actions have real-world cooldown times ranging from a couple of seconds to multiple days. Each player starts out with their own base and a couple of starting resources. Players can use resources to construct buildings, some of which generate resources over time. Players can upgrade their buildings, as well as their base itself in order to harvest more resources, have a bigger area, and much more.

The world map is made up of multiple nodes (hence, Nodeworld) shaped like hexagons and arranged in a grid. Guilds can capture and control these nodes via combat, by deploying soliders to overwhelm the defenses of the existing node. By default, nodes are unclaimed. Players must be part of a guild to capture territory on the world map. Nodes will give resources and other benefits to the guild that controls them, which is shared among guild members.

Players can also complete PvE quests in order to level up and make use of their troops, if they do not wish to participate in guild PVP.  
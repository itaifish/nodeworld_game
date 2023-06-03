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

### Base

Each player starts with a level 1 base, which gives them access to a 12x12 tile area for building. The [formula](https://github.com/itaifish/nodeworld_game/blob/06e3deec8b3bbd013c363b3811e14dfef13ece8c/src/game/logic/base/BaseManager.ts#L17) for the size of a player's base is given by:
> baseSize = 8 + baseLevel * 4

meaning that for each level gained beyond 1, the base grows in both width and height by 4 tiles. Players also start out with [500 food, 500 aluminum, 500 gold, 500 iron, and 250 plutonium](https://github.com/itaifish/nodeworld_game/blob/06e3deec8b3bbd013c363b3811e14dfef13ece8c/src/game/logic/base/BaseManager.ts#L9).

A player's base is by default safe from attacks. However, there are some conditions in which a player's base can be attacked, which will be explained in the factions & world map section.

### Buildings

Buildings can be subdivided into three main categories: Resource Management, Technology/Research, and finally Military/Defense. You can view all the specific stats of each building in the [source code](https://github.com/itaifish/nodeworld_game/blob/e06bebc9d28ac8edc113d96891be7809bde84e98/src/game/logic/buildings/BuildingManager.ts#L51). Resource buildings (Other than dwellings, which just allow for more units to be built) all generate resources, and can be harvested to gain the resources they've generated. They all have a maximum storage capacity, so make sure to check in regularly so you don't miss out on valuable resources. When buildings are upgraded they can store more resources, as well as generate more resources.

#### Resource Management

These are buildings that help manage different resources.There are 4 resource buildings:

1. Capital Building: This is your main building, and it can generate a bit of each resource. Maximum 1.
2. Dwelling: This building increases your maximum unit cap for soliders
3. Harvestor: This building generates food. This is necessary to train military units and is also required for a few buildings.
4. Extractor: This building generates Iron, Aluminum, and Plutonium.

#### Technology and Research

There are buildings that enable the player to gain upgrades for their units, base and buildings

1. Capital Building: No building can be a higher level than the capital building. Upgrade the capital building in order to upgrade other buildings.
2. Research Lab: The research lab unlocks the tech tree for military technology. Maximum 1.
3. University: The university unlocks the tech tree for civilian technology. This can be used to upgrade item drops, increase harvest rates, and lower cooldown times.

#### Military and Defense

There are buildings that can train military units, as well as defensive buildings that can attack invading forces

1. Barracks: This building is used to train ground units.
2. Aerospace Depot: This building is used to train flying units.
3. Scattergun Turret: This building is a defensive building that can attack ground units.
4. Anti-Aircraft Turret: This building is a defensive building that can attack flying units.
5. Energy Shield Wall: This building is a very tough building with no damage capabilities. It can be used to soak damage while other turrets and units deal damage to the opponent.

### Guilds

Guilds are groups of players who enter into an alliance in order to 
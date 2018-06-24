# karmabot
A slack bot to keep track of points for users (or anything, really)

## What it does
It listens for messages matching the pattern `something++` or `something--`, and keeps track of the scores of that thing.
Any word can be incremented or decremented, including `@User` mentions. You can also increment (or decrement) by more than 1
point at a time, using multiple plusses or minuses (`+++` corresponds to `+2` points, `----` corresponds to `-3` points, etc),
though there _is_ a Buzzkill Mode to prevent people from incrementing or decrementing too much at once.

You can also use double-quotes to specify a multi-word phrase to be ++'d or --'d, like `"small batches"++` or
`"something bad"--`.

## Running it locally
You can run it locally with `yarn start:dev`, which uses `nodemon` to watch for file changes and restart automatically.
The bot itself is written in Typescript, so it runs through `ts-node`.

It expects a `.env` file to be located in the root of the project, which contains a `TOKEN` field representing the token
assigned by Slack itself to operate as a bot. Startup fails if there is no such key in a `.env` file (or if the file does
not exist).

## Running tests

`yarn test` (or `npm run test`)

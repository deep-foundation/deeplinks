[![npm](https://img.shields.io/npm/v/@deep-foundation/deeplinks.svg)](https://www.npmjs.com/package/@deep-foundation/deeplinks)
[![Gitpod](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/deep-foundation/deeplinks) 
[![Discord](https://badgen.net/badge/icon/discord?icon=discord&label&color=purple)](https://discord.gg/deep-foundation)

# Usage

## Generate deep.config.json

Automatically catch public ip of server.
```
npx @deep-foundation/deeplinks -g
```

Manual define domains.
```
npx @deep-foundation/deeplinks -g --deeplinks "http://deeplinks.deep.foundation" --deepcase "http://deepcase.deep.foundation"
```

## Deep Terminal

```
npx @deep-foundation/deeplinks -e
>
```

## Launch command envs based on config

For example, let's run migrations. Don't forget to clear the timestamp keys in the .migrate file before migrating.
```
npm @deep-foundation/deeplinks --bash "npx migrate@latest up --matches '*.js'"
```

## Alternative deep.config.json

By default, deep.config.json is taken from the folder in which the command is executed. You can set config alternatively.

```
npm @deep-foundation/deeplinks -c "$(cat ../../call-options.json)"
```

## Restart

### Server

```
docker restart deep-links
```

### GitPod

Deep.Links is started together with Deep.Case app and other services in GitPod. So to restart it from GitPod you should do the following:

1. Find terminal there `npm run gitpod-start` command was executed.
![IMG_1490](https://github.com/deep-foundation/deepcase-app/assets/1431904/81ecd4d4-f4d2-4812-8948-0a155347218d)

2. Press `CTRL+C` in terminal to stop a Deep instance (Deep.Links and Deep.Case).
![IMG_1491](https://github.com/deep-foundation/deepcase-app/assets/1431904/39966c49-b8fd-4030-bcac-d8a0e4ff4e17)

3. Press `↑` button on your keyboard to get last executed command.
![IMG_1492](https://github.com/deep-foundation/deepcase-app/assets/1431904/9ef60c58-ca70-43f3-be91-91966d85dddc)

4. Press `Enter` to execute that command again, that will finish restart sequence.
![IMG_1493](https://github.com/deep-foundation/deepcase-app/assets/1431904/56f48dad-d751-44c7-8871-164f824f122b)

## Dignostics

### Get all logs:

```sh
docker logs deep-links
```

### Get live logs:

```sh
docker logs -f deep-links
```

### Enter the sh from inside the docker container:

```sh
docker exec -it deep-links sh
```

## Library
See [Documentation] for examples and API

[Documentation]: https://deep-foundation.github.io/deeplinks/

## Maintenance

### Refresh package-lock.json

This command deletes `node_modules`, `package-lock.json` and runs `npm i`. So everything is refreshed.

```bash
npm run package:refresh
```

### Release a new version

```bash
npm run package:release
```

After that it might be required to release new versions of:
1. https://github.com/deep-foundation/deepcase
2. https://github.com/deep-foundation/deepcase-app
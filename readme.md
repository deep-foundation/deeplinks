# deepcase deeplinks application

## envs

```
export MIGRATIONS_DEEPLINKS_APP_URL=localhost:3007;
export MIGRATIONS_HASURA_PATH=localhost:8080;
export MIGRATIONS_HASURA_SSL=0;
export MIGRATIONS_HASURA_SECRET=myadminsecretkey;

export NEXT_PUBLIC_DEEPLINKS_SERVER=http://localhost:3007;
export NEXT_PUBLIC_HASURA_PATH=localhost:8080;
export NEXT_PUBLIC_HASURA_PATH=localhost:8080;
export NEXT_PUBLIC_HASURA_SSL=0;
```

## dev server

```
npm ci
npm run dev 3000
```

## prod server

```
npm ci
npm run build
npm run start
```

## run electron dev
(renderer client builded, not dev)

```
export ASSET_PREFIX='.'; npm run build; npm run export;
npx cap copy electron; npx cap open electron;
```

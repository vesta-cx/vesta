# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" tailwindcss="plugins:typography,forms" sveltekit-adapter="adapter:cloudflare+cfTarget:workers" drizzle="database:sqlite+sqlite:libsql" mdsvex paraglide="languageTags:en, nl, de, es, it, fr+demo:yes" mcp="ide:cursor+setup:remote" --install pnpm silent-cell-cb53
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Preview the music blog

Open `/shellac-notes/west-end-blues` in the local dev server. The post, profile, credits, and related posts use local fixtures in `src/lib/server/blog/posts.ts`. Replace the data in the loader with Erato results when the API is ready. No Erato requests are made from these routes.

The dev server still loads the site's WorkOS middleware. If you don't have local WorkOS configuration, use placeholder values in `.dev.vars` for the public fixture routes only:

```dotenv
PRIVATE_WORKOS_CLIENT_ID=client_local_fixture
PRIVATE_WORKOS_API_KEY=sk_local_fixture
PRIVATE_WORKOS_COOKIE_PASSWORD=local_fixture_password_not_for_deploy
```

The artwork is the original Okeh label. The preview is a 30-second excerpt of the 1928 recording. Both come from the [Internet Archive transfer](https://archive.org/details/west-end-blues).

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

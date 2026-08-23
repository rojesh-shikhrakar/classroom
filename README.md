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
bun x sv@0.17.0 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" playwright tailwindcss="plugins:typography,forms" sveltekit-adapter="adapter:cloudflare+cfTarget:workers" mdsvex better-auth="demo:password,github" ai-tools="ide:vscode,claude-code,other+delivery:plugin+tools:mcp,svelte-code-writer,svelte-core-bestpractices,svelte-file-editor+mcpSetup:remote" drizzle="database:d1" --install bun classroom
```

## Developing

Install dependencies and start the development server with Bun:

```sh
bun install
bun run dev

# or start the server and open the app in a new browser tab
bun run dev -- --open
```

## Building

To create a production version of your app:

```sh
bun run build
```

You can preview the production build with `bun run preview`.

## Instructor access

Set `ADMIN_EMAILS` to a comma-separated list of instructor email addresses before starting or deploying the app. Admin pages also accept users whose database `role` is `admin`.

Apply D1 migrations before running an existing installation:

```sh
bunx wrangler d1 migrations apply personal-class --local
```

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

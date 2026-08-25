# Angular 22 + Ionic 9 SSR starter

This repository is a proof of concept for the target architecture of
`digital-edition-frontend-ng`:

- Angular 22 with standalone bootstrap
- zoneless change detection
- the `@angular/build:application` builder
- Ionic 9 standalone web components
- dynamic server-side rendering
- compile-time Angular i18n for English and Swedish
- no Angular client hydration

The landing page is deliberately built from Ionic components and includes a
small signal-driven interaction. This makes both server output and client
startup easy to verify.

## Development SSR

`npm start` runs Angular's development server with dynamic SSR enabled. It is
not a client-rendered-only development mode. Initial requests and full page
loads are rendered on the server, while the development server also provides
source maps and live reloading.

Install dependencies and start the English development SSR server:

```bash
npm install
npm start
```

Run the Swedish development SSR server instead:

```bash
npm run start:sv
```

The Angular development server localizes one locale at a time and serves the
selected locale at `http://localhost:4200/`. Therefore, development uses `/`
rather than the production `/en/` and `/sv/` locale paths.

These commands are intended for development only; `ng serve` is not the
production Node server.

## Build and run the production SSR bundle locally

Build the optimized application and start its generated Node server:

```bash
npm run build
npm run serve:ssr:ng22-ion9-ssr-starter
```

This runs the same built server entry point that is deployed in production. It
listens on port 4000 by default:

- `http://localhost:4000/en/` renders the English server bundle.
- `http://localhost:4000/sv/` renders the Swedish server bundle.
- `http://localhost:4000/` redirects according to `Accept-Language`, falling
  back to English.

The application builder emits separate browser and server entry points below
`dist/ng22-ion9-ssr-starter/{browser,server}/{en,sv}`. Its generated
`AngularNodeAppEngine` dispatches requests to the matching localized server
entry point. This is the application-builder equivalent of the handwritten
`proxy-server.js` used by `digital-edition-frontend-ng`.

In a real production environment, build artifacts would normally be produced
by CI and `server.mjs` would run under a container or process manager behind a
reverse proxy. The `serve:ssr` script is a convenient way to run that production
artifact directly, both locally and in simple deployments.

| Command                                                               | Mode              | SSR         | Localization                            |
| --------------------------------------------------------------------- | ----------------- | ----------- | --------------------------------------- |
| `npm start`                                                           | Development       | Dynamic SSR | English at `/`                          |
| `npm run start:sv`                                                    | Development       | Dynamic SSR | Swedish at `/`                          |
| `npm run build` followed by `npm run serve:ssr:ng22-ion9-ssr-starter` | Production bundle | Dynamic SSR | English at `/en/` and Swedish at `/sv/` |

After building, run the self-contained SSR smoke test. It starts and stops the production server automatically.

```bash
npm run test:ssr:smoke
```

The smoke test checks both translations, locale headers and base paths, Ionic
server markup, absence of Angular hydration markers, and language negotiation.

## Implementation notes

Dynamic SSR is selected in `src/app/app.routes.server.ts` with
`RenderMode.Server`. The browser configuration uses `provideIonicAngular()`,
while the server configuration adds `IonicServerModule` through
`importProvidersFrom()`.

`provideClientHydration()` is intentionally absent. `IonicServerModule` still
runs Ionic's server-side component serialization before Angular sends the
document; that Ionic/Stencil operation is distinct from Angular client
hydration. In the browser, Angular performs a normal client bootstrap and
replaces the server-rendered application.

The localized build is configured in `angular.json`. English is the source
locale and Swedish translations live in `src/locale/messages.sv.xlf`. Extract
source messages after marking new content:

```bash
npm run extract-i18n
```

Production host-header validation is enabled. Loopback hosts are allowed for
local verification; add each real deployment hostname to
`build.options.security.allowedHosts` before deployment.

## Verification

```bash
npm test -- --watch=false
npm run build
npm run test:ssr:smoke
```

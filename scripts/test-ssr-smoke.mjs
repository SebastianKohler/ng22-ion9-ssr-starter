import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const port = process.env['SSR_SMOKE_PORT'] ?? '4217';
const serverEntry = resolve('dist/ng22-ion9-ssr-starter/server/server.mjs');
const origin = `http://localhost:${port}`;
const server = spawn(process.execPath, [serverEntry], {
  env: { ...process.env, PORT: port },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.setEncoding('utf8');
server.stderr.setEncoding('utf8');
server.stdout.on('data', (chunk) => {
  serverOutput += chunk;
});
server.stderr.on('data', (chunk) => {
  serverOutput += chunk;
});

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitUntilReady() {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`SSR server exited before it was ready.\n${serverOutput}`);
    }

    try {
      const response = await fetch(`${origin}/en/`);
      if (response.ok) {
        return;
      }
    } catch {
      // The server has not started listening yet.
    }

    await new Promise((resolveReady) => setTimeout(resolveReady, 100));
  }

  throw new Error(`Timed out waiting for the SSR server.\n${serverOutput}`);
}

async function verifyLocale(path, locale, expectedText) {
  const response = await fetch(`${origin}${path}`);
  const html = await response.text();

  assert(response.status === 200, `${path} returned ${response.status}.`);
  assert(
    response.headers.get('content-language') === locale,
    `${path} did not return Content-Language: ${locale}.`,
  );
  assert(html.includes(`<html lang="${locale}"`), `${path} has the wrong lang.`);
  assert(html.includes(`<base href="/${locale}/">`), `${path} has the wrong base href.`);
  assert(html.includes(expectedText), `${path} is not translated as expected.`);
  assert(html.includes('sc-ion-'), `${path} is missing Ionic server-rendered markup.`);
  assert(!html.includes('ngh='), `${path} unexpectedly contains Angular hydration markers.`);
}

async function verifyPrerenderedFile(locale, expectedText) {
  const outputPath = resolve('dist/ng22-ion9-ssr-starter/browser', locale, 'prerender/index.html');
  const html = await readFile(outputPath, 'utf8');

  assert(html.includes(`<html lang="${locale}"`), `${outputPath} has the wrong lang.`);
  assert(html.includes(expectedText), `${outputPath} is not translated as expected.`);
  assert(html.includes('<ion-button'), `${outputPath} is missing the Ionic button.`);
  assert(html.includes('sc-ion-button'), `${outputPath} is missing Ionic serialized markup.`);
  assert(!html.includes('ngh='), `${outputPath} unexpectedly contains hydration markers.`);
}

try {
  await waitUntilReady();
  await verifyLocale('/en/', 'en', 'Server rendering works');
  await verifyLocale('/sv/', 'sv', 'Serverrendering fungerar');
  await verifyPrerenderedFile('en', 'Ionic prerendering works');
  await verifyPrerenderedFile('sv', 'Förrendering med Ionic fungerar');
  await verifyLocale('/en/prerender', 'en', 'Ionic prerendering works');
  await verifyLocale('/sv/prerender', 'sv', 'Förrendering med Ionic fungerar');

  const redirect = await fetch(`${origin}/`, {
    headers: { 'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8' },
    redirect: 'manual',
  });
  assert(redirect.status === 302, `/ returned ${redirect.status} instead of 302.`);
  assert(
    redirect.headers.get('location') === '/sv',
    '/ did not select Swedish from Accept-Language.',
  );

  console.log(
    'SSR smoke test passed for dynamic SSR, prerendered en/sv routes, Ionic markup, and locale routing.',
  );
} finally {
  if (server.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
}

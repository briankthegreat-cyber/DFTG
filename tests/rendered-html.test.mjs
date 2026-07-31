import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the EMBERLINE first-action experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>EMBERLINE: Caravan of the Last Dawn<\/title>/i);
  assert.match(html, /BEGIN JOURNEY/);
  assert.match(html, /First Spark · one tap to play/);
  assert.match(html, /Build by day\. Hold through night\. Carry the sun\./);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("ships accessible, portrait-first game controls", async () => {
  const html = await (await render()).text();
  assert.match(html, /<button[^>]*class="primary-button begin-button"/i);
  assert.match(html, /Single-player strategy · No energy · No paid power/);
  assert.match(html, /viewport/);
});

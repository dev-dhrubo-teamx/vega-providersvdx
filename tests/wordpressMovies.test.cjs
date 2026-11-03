const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("esbuild");
const cheerio = require("cheerio");

function loadModule(file, mocks = {}) {
  const code = transformSync(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), { loader: "ts", format: "cjs" }).code;
  const module = { exports: {} };
  new Function("module", "exports", "require", code)(module, module.exports, (name) => {
    if (mocks[name]) return mocks[name];
    throw new Error(`Unexpected import ${name}`);
  });
  return module.exports;
}

function apiContext(posts, categories = []) {
  const requests = [];
  return {
    requests,
    providerContext: {
      cheerio,
      commonHeaders: {},
      axios: { get: async (url, config = {}) => {
        requests.push({ url, config });
        if (url.endsWith("/categories")) return { data: categories };
        const id = Number(url.match(/posts\/(\d+)/)?.[1]);
        if (id) return { data: posts.find((post) => post.id === id) };
        return { data: posts };
      } },
    },
  };
}

const post = (content) => ({
  id: 7,
  slug: "authorized-movie",
  date: "2026-01-02T00:00:00",
  link: "https://procloudstream.ifree.page/authorized-movie/",
  title: { rendered: "Authorized Movie" },
  content: { rendered: content },
  categories: [3],
  _embedded: { "wp:featuredmedia": [{ source_url: "https://images.example/poster.jpg" }], "wp:term": [[{ taxonomy: "category", name: "Action" }]] },
});

test("extracts plain-text, anchor MP4 URLs, query strings, and multiple sources", async () => {
  const ctx = apiContext([post("<p>Description</p><p>https://cdn.example/a.MP4?token=1</p><a href='https://cdn.example/b.mp4?token=2'>Watch</a>")]);
  const meta = loadModule("providers/wordpressMovies/meta.ts", { "../types": {}, "./utils": loadModule("providers/wordpressMovies/utils.ts", { "../types": {} }) }).getMeta;
  const stream = loadModule("providers/wordpressMovies/stream.ts", { "../types": {}, "./utils": loadModule("providers/wordpressMovies/utils.ts", { "../types": {} }) }).getStream;
  const info = await meta({ link: "7", providerContext: ctx.providerContext });
  const result = await stream({ link: info.linkList[0].directLinks[0].link, providerContext: ctx.providerContext });
  assert.equal(info.image, "https://images.example/poster.jpg");
  assert.equal(result.length, 2);
  assert.deepEqual(new Set(result.map((item) => item.link)), new Set([
    "https://cdn.example/a.MP4?token=1",
    "https://cdn.example/b.mp4?token=2",
  ]));
});

test("returns empty streams when the post has no MP4", async () => {
  const ctx = apiContext([post("<p>No playable video here</p><img src='https://cdn.example/poster.mp4.jpg'>")]);
  const utils = loadModule("providers/wordpressMovies/utils.ts", { "../types": {} });
  const stream = loadModule("providers/wordpressMovies/stream.ts", { "../types": {}, "./utils": utils }).getStream;
  assert.deepEqual(await stream({ link: JSON.stringify({ postId: 7 }), providerContext: ctx.providerContext }), []);
});

test("rejects unsafe and private MP4 URLs", () => {
  const utils = loadModule("providers/wordpressMovies/utils.ts", { "../types": {} });
  assert.equal(utils.isSafeVideoUrl("javascript:alert(1).mp4"), false);
  assert.equal(utils.isSafeVideoUrl("http://127.0.0.1/movie.mp4"), false);
  assert.equal(utils.isSafeVideoUrl("https://cdn.example/movie.mp4?x=1"), true);
});

test("passes pagination and category parameters to WordPress", async () => {
  const ctx = apiContext([]);
  const posts = loadModule("providers/wordpressMovies/posts.ts", { "../types": {}, "./utils": loadModule("providers/wordpressMovies/utils.ts", { "../types": {} }) });
  await posts.getPosts({ filter: "category:3", page: 2, signal: new AbortController().signal, providerContext: ctx.providerContext });
  assert.equal(ctx.requests[0].config.params.page, 2);
  assert.equal(ctx.requests[0].config.params.categories, 3);
});

test("handles missing featured media", async () => {
  const ctx = apiContext([{ ...post("https://cdn.example/movie.mp4"), _embedded: {} }]);
  const utils = loadModule("providers/wordpressMovies/utils.ts", { "../types": {} });
  const meta = loadModule("providers/wordpressMovies/meta.ts", { "../types": {}, "./utils": utils }).getMeta;
  assert.equal((await meta({ link: "7", providerContext: ctx.providerContext })).image, "");
});

test("propagates WordPress API errors", async () => {
  const utils = loadModule("providers/wordpressMovies/utils.ts", { "../types": {} });
  const meta = loadModule("providers/wordpressMovies/meta.ts", { "../types": {}, "./utils": utils }).getMeta;
  await assert.rejects(meta({ link: "7", providerContext: { cheerio, commonHeaders: {}, axios: { get: async () => { throw new Error("API unavailable"); } } } }), /API unavailable/);
});

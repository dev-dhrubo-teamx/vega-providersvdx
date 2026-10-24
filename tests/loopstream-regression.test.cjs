const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { buildSync } = require("esbuild");

function load(moduleName) {
  const result = buildSync({
    entryPoints: [path.join(__dirname, "../providers/loopstream", `${moduleName}.ts`)],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
  });
  const module = { exports: {} };
  new Function("module", "exports", result.outputFiles[0].text)(
    module,
    module.exports,
  );
  return module.exports;
}

const meta = load("meta");
const stream = load("stream");
const posts = load("posts");
const shared = load("shared");
const providerContext = {};
const jawanUrl =
  "https://fsldownload.com/d/kw49ShFiN4WxRU3Y.cNIXJyM-pH2CX6gyRV2gZpLxkrj-4dHHmhZd5K2fcqBRk8Elj8ekUwVaRjutYkbiIwWaUt5AVCVuupqHIw1ZIEW2oj61zYdDZqQy__N9wg3y_sszdZCcsRFvWoj3scFWdsRojpMNZxV8OHjhslMLe4O-o-eu_9p731337w_sbdqpA_WgiYfI86Tn1yE-6ewck1TjAI4eTHM.nbH7_orxwXB6Za8cHqwSGQ";

test("loopstream preserves Jawan metadata and exposes the exact Archive URL", async () => {
  const info = await meta.getMeta({
    link: "mylibrary://jawan",
    providerContext,
  });

  assert.equal(info.title, "Jawan");
  assert.equal(info.type, "movie");
  assert.equal(info.linkList[0].directLinks[0].link, jawanUrl);
  assert.equal(info.linkList[0].directLinks[0].type, "movie");
});

test("loopstream resolves both the internal ID and linkList URL to mp4", async () => {
  for (const link of ["mylibrary://jawan", jawanUrl]) {
    const streams = await stream.getStream({
      link,
      type: "movie",
      providerContext,
    });

    assert.deepEqual(streams, [
      {
        server: "Loopstream direct",
        link: jawanUrl,
        type: "mp4",
      },
    ]);
  }
});

test("loopstream routes library items by their generated category", async () => {
  assert.deepEqual(
    (await posts.getPosts({ filter: "Anime", page: 1 })).map((post) => post.link),
    ["mylibrary://stranger-things"],
  );
});

test("loopstream supports a direct HLS URL and rejects an unsupported media URL", async () => {
  const hls = await stream.getStream({
    link: "https://cdn.example/video.m3u8?token=test",
    type: "movie",
    providerContext,
  });
  assert.deepEqual(hls, [
    {
      server: "Loopstream direct",
      link: "https://cdn.example/video.m3u8?token=test",
      type: "m3u8",
    },
  ]);

  const unsupported = await stream.getStream({
    link: "https://cdn.example/video.webm",
    type: "movie",
    providerContext,
  });
  assert.deepEqual(unsupported, []);
});

test("loopstream delegates YouTube embeds to the existing YouTube resolver", async () => {
  const youtubeContext = {
    kvStore: {
      get: async () => undefined,
      set: async () => undefined,
    },
    axios: {
      get: async () => ({ data: "<html></html>" }),
      post: async (url) => {
        assert.match(url, /youtubei\/v1\/player/);
        return {
          data: {
            streamingData: {
              hlsManifestUrl: "https://youtube.example/video/master.m3u8",
              formats: [],
            },
          },
        };
      },
    },
  };

  const streams = await stream.getStream({
    link: "https://youtu.be/zFXwHhdOwdA",
    type: "movie",
    providerContext: youtubeContext,
  });

  assert.equal(streams.length, 1);
  assert.equal(streams[0].link, "https://youtube.example/video/master.m3u8");
  assert.equal(streams[0].type, "m3u8");
});

test("generated series entries expose episodes and quality/source choices", () => {
  const url480 = "https://cdn.example/show-s01e01-480.mp4?token=%5B1%5D";
  const url720 = "https://cdn.example/show-s01e01-720.mp4?token=%5B2%5D";
  const links = meta.buildLinkList({
    title: "Example Show",
    audioType: "Hindi Dub",
    language: "Hindi",
    episodes: [
      { episode: 1, title: "Pilot", quality: "480p", sourceType: "mp4", videoUrl: url480 },
      { episode: 1, title: "Pilot", quality: "720p", sourceType: "mp4", videoUrl: url720 },
      { episode: 2, title: "Second", quality: "720p", sourceType: "mp4", videoUrl: "https://cdn.example/show-s01e02-720.mp4" },
      { episode: 2, title: "Duplicate", quality: "720p", sourceType: "embed", videoUrl: "https://unsupported.example/embed" },
    ],
  });

  assert.equal(links.length, 2);
  assert.equal(links[0].title, "Episode 1");
  assert.equal(links[0].directLinks.length, 2);
  assert.match(links[0].directLinks[0].title, /Hindi Dub · Hindi$/);
  assert.equal(links[0].directLinks[1].link, url720);
  assert.equal(links[0].directLinks[1].type, "series");
  assert.equal(links[1].directLinks.length, 1);
});

test("generated entries reject duplicate links and invalid episode URLs", () => {
  const items = shared.normalizeLibraryItems([
    { title: "A", link: "mylibrary://a", image: "", category: "Movies", sourceType: "mp4", videoUrl: "https://cdn.example/a.mp4" },
    { title: "Duplicate", link: "mylibrary://a", image: "", category: "Movies", sourceType: "mp4", videoUrl: "https://cdn.example/other.mp4" },
    { title: "Series", link: "mylibrary://series", image: "", category: "TV Series", episodes: [
      { episode: 1, sourceType: "mp4", videoUrl: "not-a-url" },
      { episode: 1, sourceType: "mp4", videoUrl: "https://cdn.example/e1.mp4" },
    ] },
  ]);
  assert.equal(items.length, 2);
  assert.equal(items[1].episodes.length, 1);
});

test("the generated Adultery movie appears with metadata and preserves its MP4 URL", async () => {
  const link = "mylibrary://adultery-alumni-association-2";
  const postsForMovies = await posts.getPosts({ filter: "Movies", page: 1 });
  const post = postsForMovies.find((candidate) => candidate.link === link);
  assert.deepEqual(post, {
    title: "Adultery Alumni Association 2",
    link,
    image: "https://image.tmdb.org/t/p/w500/wJHAEuL4ObSAp33T2iADrti0fAM.jpg",
  });

  const info = await meta.getMeta({ link, providerContext });
  assert.equal(info.type, "movie");
  assert.ok(info.tags.includes("Movies"));
  assert.ok(info.tags.includes("2019"));
  assert.ok(info.tags.includes("Original"));
  assert.ok(info.tags.includes("Japanese"));
  const videoUrl = info.linkList[0].directLinks[0].link;
  assert.equal(videoUrl, "https://archive.org/download/upload-67642d96/Daemons-of-the-Shadow-Realm-S01E06-720p-HEVC-%5BHIN-ENG-JAP%5D.mp4");

  const streams = await stream.getStream({ link: videoUrl, type: "movie", providerContext });
  assert.deepEqual(streams, [{ server: "Loopstream direct", link: videoUrl, type: "mp4" }]);
});

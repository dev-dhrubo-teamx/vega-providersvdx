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
const providerContext = {};
const archiveUrl =
  "https://ia800107.us.archive.org/5/items/upload-67642d96/Daemons-of-the-Shadow-Realm-S01E06-720p-HEVC-%5BHIN-ENG-JAP%5D.mp4";

test("loopstream preserves Jawan metadata and exposes the exact Archive URL", async () => {
  const info = await meta.getMeta({
    link: "mylibrary://jawan",
    providerContext,
  });

  assert.equal(info.title, "Jawan");
  assert.equal(info.type, "movie");
  assert.equal(info.linkList[0].directLinks[0].link, archiveUrl);
  assert.equal(info.linkList[0].directLinks[0].type, "movie");
});

test("loopstream resolves both the internal ID and linkList URL to mp4", async () => {
  for (const link of ["mylibrary://jawan", archiveUrl]) {
    const streams = await stream.getStream({
      link,
      type: "movie",
      providerContext,
    });

    assert.deepEqual(streams, [
      {
        server: "Loopstream direct",
        link: archiveUrl,
        type: "mp4",
        quality: "720",
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

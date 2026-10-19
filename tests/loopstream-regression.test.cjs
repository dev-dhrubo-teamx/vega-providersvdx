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

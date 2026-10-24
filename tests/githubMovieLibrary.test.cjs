const assert = require("assert");
const { buildSync } = require("esbuild");
const path = require("path");

const output = buildSync({ entryPoints: [path.join(__dirname, "../providers/githubMovieLibrary/library.ts")], bundle: true, platform: "node", format: "cjs", write: false }).outputFiles[0].text;
const moduleObject = { exports: {} };
new Function("require", "exports", "module", output)(require, moduleObject.exports, moduleObject);
const library = moduleObject.exports;
const parsed = library.parseMovieLibrary({ movies: [{ id: "x", title: "X", qualities: [{ label: "720p", url: "https://a.test/x.mp4", type: "mp4" }] }, { title: "invalid" }] });
assert.equal(parsed.movies.length, 1);
assert.equal(parsed.movies[0].qualities[0].url, "https://a.test/x.mp4");
assert.equal(library.movieIdFromLink(library.movieLink("x")), "x");

function load(entry) {
  const output = buildSync({ entryPoints: [path.join(__dirname, `../providers/githubMovieLibrary/${entry}.ts`)], bundle: true, platform: "node", format: "cjs", write: false }).outputFiles[0].text;
  const moduleObject = { exports: {} };
  new Function("require", "exports", "module", output)(require, moduleObject.exports, moduleObject);
  return moduleObject.exports;
}

(async () => {
  const directUrl = "https://ia.example.test/library-720-%5Bsource%5D.mp4?download=1";
  const json = { movies: [{ id: "movie-1", title: "Movie 1", poster: "poster", qualities: [
    { label: "480p", url: "https://ia.example.test/library-480.mp4", type: "mp4" },
    { label: "720p", url: directUrl, type: "mp4" },
  ] }] };
  const context = {
    commonHeaders: {},
    kvStore: { get: async () => "https://example.test/movies.json" },
    axios: { get: async () => ({ data: json }) },
  };
  const posts = await load("posts").getPosts({ filter: "all", page: 1, providerValue: "", signal: new AbortController().signal, providerContext: context });
  assert.deepStrictEqual(posts[0], { title: "Movie 1", link: "github-library://movie-1", image: "poster" });
  const info = await load("meta").getMeta({ link: posts[0].link, providerContext: context });
  assert.equal(info.type, "movie");
  assert.equal(info.linkList[1].quality, "720p");
  assert.equal(info.linkList[1].directLinks[0].link, directUrl);
  assert.equal(info.linkList[1].directLinks[0].type, "movie");
  const streams = await load("stream").getStream({ link: info.linkList[1].directLinks[0].link, type: "movie", providerContext: context });
  assert.deepStrictEqual(streams, [{ server: "GitHub Movie Library direct", link: directUrl, type: "mp4", quality: "720p" }]);
  assert.equal(streams[0].link, directUrl);
  console.log("githubMovieLibrary tests passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });

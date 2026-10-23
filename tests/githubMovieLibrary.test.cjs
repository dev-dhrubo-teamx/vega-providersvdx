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

const streamOutput = buildSync({ entryPoints: [path.join(__dirname, "../providers/githubMovieLibrary/stream.ts")], bundle: true, platform: "node", format: "cjs", write: false }).outputFiles[0].text;
const streamModule = { exports: {} };
new Function("require", "exports", "module", streamOutput)(require, streamModule.exports, streamModule);
const directUrl = "https://media.example.test/library-720.mp4";
const streamContext = {
  commonHeaders: {},
  kvStore: { get: async () => "https://example.test/movies.json" },
  axios: { get: async () => ({ data: { movies: [{ id: "movie-1", title: "Movie 1", qualities: [{ label: "720p", url: directUrl, type: "mp4" }] }] } }) },
};
streamModule.exports.getStream({ link: directUrl, type: "movie", providerContext: streamContext }).then((streams) => {
  assert.deepStrictEqual(streams, [{ server: "GitHub Movie Library direct", link: directUrl, type: "mp4", quality: "720p" }]);
  console.log("githubMovieLibrary tests passed");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

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
console.log("githubMovieLibrary tests passed");

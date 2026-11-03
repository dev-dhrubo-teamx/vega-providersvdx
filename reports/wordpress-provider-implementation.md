# WordPress Movies provider implementation

## Flow

```mermaid
flowchart LR
  A[WordPress post] --> B[GET /wp-json/wp/v2/posts]
  B --> C[getPosts: Post[]]
  C --> D[getMeta(post ID)]
  D --> E[REST post with _embed]
  E --> F[Cheerio parses content.rendered]
  F --> G[JSON playback descriptor: postId + sources]
  G --> H[getStream]
  H --> I[Fetch authorized post again]
  I --> J[Extract and validate MP4 URLs]
  J --> K[Vega Stream[]]
```

## Implementation

- `providers/wordpressMovies/catalog.ts` exposes Latest Movies and dynamically loads non-empty WordPress categories from `/wp-json/wp/v2/categories`.
- `posts.ts` requests published posts with `_embed=1`, `page`, `per_page=20`, and optional `categories` or `search`. WordPress post IDs are used as stable provider links.
- `meta.ts` fetches the post, decodes title/content with Cheerio, extracts categories and featured media, and creates a JSON playback descriptor containing the post ID and discovered authorized sources.
- `utils.ts` extracts MP4 URLs from both anchor `href` values and visible rendered text. It accepts case-insensitive `.mp4` paths and query strings, deduplicates sources, rejects unsafe schemes, credentials, localhost, loopback/private IPv4, and non-MP4 paths.
- `stream.ts` decodes the descriptor, refetches the WordPress post by ID, re-extracts and validates the content URLs, and returns one Vega `Stream` per source with `type: "mp4"`.

The stream implementation does not download media into memory, disable TLS verification, expose credentials, or fetch arbitrary user-supplied URLs. It does not claim successful playback without an authorized end-to-end test.

## Verification

`tests/wordpressMovies.test.cjs` uses mocked WordPress responses and covers plain-text URLs, anchor URLs, query strings, uppercase extensions, multiple sources, missing video, unsafe/private URLs, missing featured media, pagination/category parameters, and API errors.

## Actual verification

- `node --test tests/wordpressMovies.test.cjs` — passed: 1 test file, 6 tests, 0 failures.
- `npx esbuild ... --outdir=/tmp/wordpressMovies-build-check` — passed for all four bundled modules; the repository `dist/` directory was not modified.
- `npx tsc --noEmit` — repository-wide check remains failing on pre-existing errors in unrelated providers/shared files; no diagnostic was reported for `providers/wordpressMovies`.
- No authorized live playback test was run, so successful end-to-end playback is unverified.

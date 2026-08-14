// Serves the declared-but-missing icon paths as a gzip-encoded 404.
//
// Why a function instead of the platform's stock 404: that page is a 79-byte
// text/plain body, under the edge's compression threshold, so it comes back with
// no Content-Encoding. This test case needs a response that is BOTH non-2xx and
// gzip-encoded, so the client constructs a gzip decompression stream on an error
// path it then abandons.
//
// Why gzip is applied here rather than left to the edge: relying on CDN
// compression heuristics is exactly the coin-flip that makes the stock 404
// useless. Compressing in the function and setting Content-Encoding explicitly
// makes the response deterministic.
//
// CommonJS on purpose: with no package.json declaring "type": "module", an
// `export default` here fails to load on the Node runtime.

const zlib = require("zlib");

const BODY = Buffer.from(
  `<!doctype html>
<html><head><title>404 — Not Found</title></head>
<body>
<h1>The page could not be found</h1>
<p>NOT_FOUND</p>
<p>This icon was declared in the page's icon metadata but never shipped.
It is supposed to 404.</p>
${"<!-- padding to keep this comfortably above any compression threshold -->\n".repeat(60)}
</body></html>
`,
  "utf8",
);

const GZIPPED = zlib.gzipSync(BODY);

module.exports = (req, res) => {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Encoding", "gzip");
  res.setHeader("Content-Length", String(GZIPPED.length));
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(req.method === "HEAD" ? undefined : GZIPPED);
};

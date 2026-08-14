# icon-crash

A deliberately malformed static web app, for testing how clients handle icon
metadata that points at files which do not exist.

The page declares three icons and ships none of them:

```html
<link rel="icon" href="/icon-light-32x32.png" media="(prefers-color-scheme: light)" />
<link rel="icon" href="/icon-dark-32x32.png"  media="(prefers-color-scheme: dark)"  />
<link rel="apple-touch-icon" href="/apple-icon.png" />
```

This is what a v0.app / Next.js `metadata.icons` block emits when the generated
icons never make it into `/public`.

## Behaviour

| Path | Response |
| --- | --- |
| `/` | 200 `text/html` |
| `/icon-light-32x32.png` | 404, `Content-Encoding: gzip` |
| `/icon-dark-32x32.png` | 404, `Content-Encoding: gzip` |
| `/apple-icon.png` | 404, `Content-Encoding: gzip` |

The icon paths are rewritten to `api/missing-icon.js`, which gzips its own body
and sets `Content-Encoding` explicitly. The platform's stock 404 is a 79-byte
`text/plain` body that falls under the edge's compression threshold and comes
back uncompressed — this test case needs the response to be **both** non-2xx and
gzip-encoded, so it cannot rely on CDN compression heuristics.

## Deploying

```bash
vercel deploy --prod
```

Zero-config: static root plus an auto-detected `/api` function. Note that
`vercel.json` deliberately sets no `outputDirectory` — setting it to `"."` makes
the whole directory static output and serves `api/*.js` as plain text instead of
building it as a function, which would make the icon paths return 200.

If the deployment is behind Deployment Protection, every path 302s to
`vercel.com/sso-api` and no client will see the 404s.

## Verifying

```bash
curl -sI -H 'Accept-Encoding: gzip' https://<deploy>/icon-light-32x32.png \
  | grep -iE 'HTTP|content-encoding'
# want: 404  +  content-encoding: gzip
```

**Do not add the icon files.** Shipping `icon-light-32x32.png`,
`icon-dark-32x32.png`, or `apple-icon.png` silently removes the test case.

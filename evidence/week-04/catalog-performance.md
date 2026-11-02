# Local catalog API timing

Date: 2 November 2026  
Runtime: Node.js v22.23.2  
Database: local SQLite 3.51.3  
Endpoint: authenticated `GET /api/courses`  
Catalog: three published demonstration courses

## Method

The app was already running on the same machine with a warmed process and SQLite cache. The measurement script signed in with the private student demonstration account from ignored `data/demo-access.txt`, sent five warm-up requests, then measured 30 requests. Each recorded duration includes the HTTP request and JSON response parsing. The script never prints the email, password, or token. Run `npm run measure:catalog` while the local app and demo account exist to repeat the check. Results are written to `catalog-performance.json`.

## Result

| Samples | p50 | p95 | Maximum |
|---:|---:|---:|---:|
| 30 | 15.47 ms | 16.88 ms | 17.48 ms |

These figures cover only the loopback API response. They exclude browser rendering, static assets, and normal network conditions, so they do not establish the full-page two-second NFR-01 target. A browser-level measurement remains outstanding.

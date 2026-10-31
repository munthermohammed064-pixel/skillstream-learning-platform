# Week 4 Preliminary Verification Evidence

Date: 31 October 2026
Runtime: Node.js v24.13.1
Command: `npm run verify:week4`
Data store: temporary SQLite `:memory:` database, cleared after the run

The checks invoke the same API request handlers used by the HTTP server, with an in-memory database. The token value and password are intentionally not printed. The last check queries the database and confirms one account exists and the stored password is a scrypt hash rather than the submitted password.

| ID | Check | HTTP result | Outcome |
|---|---|---:|---|
| P01 | Register a valid student | 201 | Pass; JWT returned and account created |
| P02 | Sign in using the registered password | 200 | Pass; returned account ID matched registration |
| P03 | Read profile using the JWT | 200 | Pass; email matched the registered account |
| P04 | Try to register the same email again | 409 | Pass; duplicate rejected |
| P05 | Register with a password shorter than 8 characters | 400 | Pass; weak password rejected |
| P06 | Sign in using the wrong password | 401 | Pass; request rejected |
| P07 | Read profile without a JWT | 401 | Pass; protected route rejected the request |

Database check: one account row was present after the workflow; `password_hash` began with `scrypt$` and did not equal the submitted password.

## Verification limit

This is API handler evidence, not a browser screenshot. Localhost requests from the isolated environment were blocked, so this run did not verify the browser-to-server connection. For the submission demo, run `npm start` locally, open <http://localhost:3000>, register, sign out, sign in, and capture the working page with the account role visible.

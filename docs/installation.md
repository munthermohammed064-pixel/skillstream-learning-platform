# Installation and reproducibility

Tested on Windows on 27 November 2026 with Node.js 22.23.2 and FFmpeg 9.0. The application uses built-in HTTP, SQLite and crypto modules. package.json declares the Node requirement. No npm packages or build step are required.

## Download and run

Install Git and Node.js 22.13 or later. For the Windows sample video, install Python with Pillow and FFmpeg available on PATH. The video generator uses Windows Segoe UI and Consolas fonts.

git clone --branch codex/week-07-reproducibility https://github.com/munthermohammed064-pixel/skillstream-learning-platform.git
cd skillstream-learning-platform
node -v
npm start

Open http://localhost:3000 and register a student or teacher. An empty catalog is expected before a teacher publishes courses or the sample data is generated.

## Sample course setup

Stop the server before preparing demonstration data. Run these commands in order.

python -m pip install Pillow
ffmpeg -version
python scripts/create-demo-media.py
npm run demo
npm run admin
npm start

Read generated student/teacher credentials locally from data/demo-access.txt and administrator credentials from data/admin-access.txt. Each developer generates their own credentials.

## Configuration and checks

PORT defaults to 3000. SKILLSTREAM_DATA_DIR defaults to data inside the project. SQLite tables and the local signing key are created automatically. PowerShell can override the port with $env:PORT='3001'. Restart the process after changing configuration.

npm run verify:week4
npm run verify:courses
npm run verify:platform
npm run verify:realtime
npm run verify:demo

The last command needs the generated sample video and FFmpeg. The other four commands use isolated databases. Successful checks print PASS. npm start prints the localhost address.

## Troubleshooting

Generate the video before npm run demo if it reports missing demo media. Install Pillow if Python cannot import PIL. Check ffmpeg -version if encoding fails. Stop the existing server or change PORT for an address-in-use error. Use a supported Node version if node:sqlite is unavailable. Keep data, credentials and .env files private.

## Integrated workflow

The browser calls the HTTP server, which checks the session and delegates course and learning operations to platform.js. SQLite saves the records. realtime.js sends authorized notifications so open clients can refresh. Course publication, enrollment, protected media, progress, assignment submission and grading are exercised by the integration suites. The existing local architecture remains applicable.

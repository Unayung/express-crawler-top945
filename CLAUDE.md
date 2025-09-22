# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `yarn install` - Install dependencies
- `node index.js` - Run the application
- `nodemon index.js` - Run the application with auto-restart on file changes

### Access
- Application runs on `http://localhost:3000`
- Usage: `http://localhost:3000/?u=https://TOP_945_URL_WITH_TheGUID`

## Architecture

This is a web scraper application built with Express and Puppeteer that downloads audio files from TOP 945 website.

### Key Components

1. **Express Server** (index.js:1-56)
   - Single GET endpoint at `/` that accepts a URL parameter `u`
   - Triggers scraping and downloading process
   - Returns immediate response while downloads happen asynchronously

2. **Puppeteer Scraper** (index.js:8-38)
   - `scrape()` function launches headless browser
   - Waits for specific DOM elements to load
   - Extracts audio source URL pattern
   - Collects all playlist items and constructs download URLs

3. **File Downloader** (index.js:43-52)
   - Creates timestamped directory in `./downloads/`
   - Uses node-fetch to download MP3 files
   - Streams responses directly to filesystem

### Dependencies
- `express` - Web server
- `puppeteer` - Browser automation for scraping
- `fs-extra` - Enhanced filesystem operations
- `nodemon` - Development auto-restart tool

### Download Structure
Files are saved to `./downloads/{timestamp}/` with original filenames preserved.
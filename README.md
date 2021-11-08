# bing_server_status

## What does this do?
This app sends status updates from Binghamton University's [System Status Dashboard](https://itstatus.binghamton.edu:8443) to Discord using webhooks.

## How does it work?

The app scrapes the dashboard to obtain  information about the system status.

## Setup

This is a Node.js application, so Node.js is required. `npm` is also needed.

The environment variable `DISCORD_WEBHOOK_URL` must be set.
Since this app uses the package `dotenv`, you can set it in a file called `.env`.
```
npm install
npm run build
```

## Running

```
npm start
```
Use the keyboard shortcut `Ctrl + C` to stop.

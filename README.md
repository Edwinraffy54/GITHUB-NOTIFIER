# PingPong Notifier (GitHub Activity Extension)

PingPong Notifier tracks a GitHub username and shows desktop notifications when that user has new public activity (for example: creating a repository, pushing commits, opening pull requests, starring repos).

## What it does

- Saves the GitHub username in extension storage.
- Shows the latest public activity in the popup.
- Checks GitHub every 5 minutes in the background.
- Remembers the last seen activity even after you close and reopen the browser.
- Notifies only for new activity after the baseline is saved.

## Install in Google Chrome

1. Open `chrome://extensions`.
2. Enable `Developer mode` (top-right).
3. Click `Load unpacked`.
4. Select this project folder:
   - `d:\Github notifier project\PIngPongEXT`
5. Pin the extension from the Extensions menu.

## Install in Microsoft Edge

1. Open `edge://extensions`.
2. Enable `Developer mode` (left panel).
3. Click `Load unpacked`.
4. Select this project folder:
   - `d:\Github notifier project\PIngPongEXT`
5. Pin the extension from the Extensions menu.

## Install in Firefox (Temporary Add-on)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click `Load Temporary Add-on`.
3. Select the `manifest.json` file from this project.

Note: temporary add-ons are removed when Firefox restarts.

## How to use

1. Click the extension icon.
2. Enter a GitHub username (for example: `torvalds`).
3. Click `Save`.
4. The popup will show the latest events.
5. Leave the browser running; notifications appear when new activity is detected.

## Notification behavior

- On first save, the extension stores the current latest event as baseline.
- Existing old events are not spammed as notifications.
- On next checks, only newer events trigger notifications.
- If many events are new, the extension shows the latest few plus a summary notification.

## Permissions used

- `storage`: save username and last seen event ID.
- `notifications`: show desktop notifications.
- `alarms`: run periodic checks in background.
- `https://api.github.com/*`: read public GitHub activity.

## Troubleshooting

- No notifications yet:
  - Wait up to 5 minutes for the next poll cycle.
  - Trigger new public activity on the tracked GitHub account.
- `GitHub API error (403)`:
  - You may have hit GitHub rate limits for unauthenticated requests.
  - Wait and try again.
- User not found:
  - Re-check the username spelling.

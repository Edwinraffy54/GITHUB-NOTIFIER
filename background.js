
const POLL_ALARM_NAME = "github-activity-poll";
const POLL_INTERVAL_MINUTES = 5;
const USERNAME_KEY = "githubUsername";
const USER_STATE_MAP_KEY = "lastSeenEventByUser";

function ensureAlarm() {
  chrome.alarms.create(POLL_ALARM_NAME, { periodInMinutes: POLL_INTERVAL_MINUTES });
}

function getSyncValue(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(key, resolve);
  });
}

function getLocalValue(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, resolve);
  });
}

function setLocalValue(value) {
  return new Promise((resolve) => {
    chrome.storage.local.set(value, resolve);
  });
}

function formatEventAction(event) {
  const payload = event.payload || {};
  switch (event.type) {
    case "CreateEvent":
      if (payload.ref_type === "repository") {
        return "created a new repository";
      }
      return `created ${payload.ref_type || "content"}`;
    case "DeleteEvent":
      return `deleted ${payload.ref_type || "content"}`;
    case "PushEvent":
      return "pushed new commits";
    case "PullRequestEvent":
      return `${payload.action || "updated"} a pull request`;
    case "IssuesEvent":
      return `${payload.action || "updated"} an issue`;
    case "ForkEvent":
      return "forked a repository";
    case "WatchEvent":
      return "starred a repository";
    case "ReleaseEvent":
      return `${payload.action || "published"} a release`;
    default:
      return event.type.replace("Event", "").toLowerCase();
  }
}

function createNotification(username, event) {
  const repoName = (event.repo && event.repo.name) || "a repository";
  const action = formatEventAction(event);
  const notificationId = `github-activity-${username}-${event.id}`;

  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: `New GitHub activity: ${username}`,
    message: `${action} in ${repoName}`
  });
}

async function checkForUpdates() {
  try {
    const syncData = await getSyncValue(USERNAME_KEY);
    const username = (syncData[USERNAME_KEY] || "").trim();

    if (!username) {
      return;
    }

    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/events/public`,
      {
        headers: {
          Accept: "application/vnd.github+json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API request failed with status ${response.status}`);
    }

    const events = await response.json();
    if (!Array.isArray(events) || events.length === 0) {
      return;
    }

    const latestEventId = events[0].id;
    const localData = await getLocalValue(USER_STATE_MAP_KEY);
    const stateByUser = localData[USER_STATE_MAP_KEY] || {};
    const previousLastSeenId = stateByUser[username];

    // Baseline first run so old activity does not trigger a burst of alerts.
    if (!previousLastSeenId) {
      stateByUser[username] = latestEventId;
      await setLocalValue({ [USER_STATE_MAP_KEY]: stateByUser });
      return;
    }

    if (previousLastSeenId === latestEventId) {
      return;
    }

    const newEvents = [];
    for (const event of events) {
      if (event.id === previousLastSeenId) {
        break;
      }
      newEvents.push(event);
    }

    if (newEvents.length > 0) {
      const eventsToNotify = newEvents.slice(0, 3).reverse();
      for (const event of eventsToNotify) {
        createNotification(username, event);
      }

      if (newEvents.length > 3) {
        chrome.notifications.create(`github-activity-${username}-summary-${Date.now()}`, {
          type: "basic",
          iconUrl: "icons/icon128.png",
          title: `New GitHub activity: ${username}`,
          message: `${newEvents.length - 3} more new updates are available.`
        });
      }
    }

    stateByUser[username] = latestEventId;
    await setLocalValue({ [USER_STATE_MAP_KEY]: stateByUser });
  } catch (error) {
    console.error("Failed to check GitHub activity:", error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarm();
  checkForUpdates();
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
  checkForUpdates();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === POLL_ALARM_NAME) {
    checkForUpdates();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes[USERNAME_KEY]) {
    checkForUpdates();
  }
});

ensureAlarm();
checkForUpdates();

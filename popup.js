const USERNAME_KEY = "githubUsername";

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

function formatTimestamp(isoDate) {
  if (!isoDate) {
    return "";
  }

  const date = new Date(isoDate);
  return date.toLocaleString();
}

document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const saveButton = document.getElementById("save-button");
  const notificationList = document.getElementById("notification-list");

  chrome.storage.sync.get(USERNAME_KEY, (data) => {
    const savedUsername = (data[USERNAME_KEY] || "").trim();
    if (savedUsername) {
      usernameInput.value = savedUsername;
      fetchNotifications(savedUsername, notificationList);
    } else {
      notificationList.innerHTML = "<li>Enter a GitHub username to start tracking activity.</li>";
    }
  });

  saveButton.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    if (!username) {
      notificationList.innerHTML = "<li>Please enter a valid GitHub username.</li>";
      return;
    }

    chrome.storage.sync.set({ [USERNAME_KEY]: username }, () => {
      fetchNotifications(username, notificationList);
    });
  });
});

async function fetchNotifications(username, notificationList) {
  notificationList.innerHTML = "<li>Loading recent activity...</li>";

  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/events/public`,
      {
        headers: {
          Accept: "application/vnd.github+json"
        }
      }
    );

    if (response.status === 404) {
      notificationList.innerHTML = "<li>User not found.</li>";
      return;
    }

    if (!response.ok) {
      notificationList.innerHTML = `<li>GitHub API error (${response.status}).</li>`;
      return;
    }

    const events = await response.json();
    notificationList.innerHTML = "";

    if (!Array.isArray(events) || events.length === 0) {
      notificationList.innerHTML = "<li>No recent public activity found.</li>";
      return;
    }

    events.slice(0, 5).forEach((event) => {
      const li = document.createElement("li");
      const repoName = (event.repo && event.repo.name) || "Unknown repository";
      const repoUrl = `https://github.com/${repoName}`;
      const action = formatEventAction(event);
      const timestamp = formatTimestamp(event.created_at);

      li.innerHTML = `
        <a href="${repoUrl}" target="_blank" rel="noopener noreferrer">
          <strong>${action}</strong><br>
          ${repoName}<br>
          <small>${timestamp}</small>
        </a>
      `;

      notificationList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    notificationList.innerHTML = "<li>Error fetching activity. Try again.</li>";
  }
}

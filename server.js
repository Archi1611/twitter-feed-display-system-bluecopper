const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const DB_FILE = "./tweet.db";
const DISPLAY_DURATION = 5 * 1000; // 5 seconds

let currentTweet = null;
let lastSwitchTime = 0;

// Load configurable handles
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

// Mock tweets PER HANDLE (simulating Twitter API v2 response)
const mockTweetsByHandle = {
  BlueCopper: [
    { id: "BC1", text: "Welcome to Blue Copper Technologies!", author: "@BlueCopper", url: "https://twitter.com/BlueCopperTech" }
  ],
  NodeJS: [
    { id: "N1", text: "Building scalable systems with Node.js", author: "@NodeJS", url: "https://twitter.com/nodejs" }
  ],
  X: [
    { id: "X1", text: "Scan the QR to view this post on X.", author: "@X", url: "https://twitter.com/X" }
  ],
  OpenAI: [
    { id: "O1", text: "AI research and deployment at scale.", author: "@OpenAI", url: "https://twitter.com/openai" }
  ],
  GitHub: [
    { id: "G1", text: "Code, collaborate, and build together.", author: "@GitHub", url: "https://twitter.com/github" }
  ]
};

// Flatten tweets (exactly like real API aggregation)
const allTweets = config.handles.flatMap(h => mockTweetsByHandle[h] || []);

// Dedup storage
function getSeenIds() {
  if (!fs.existsSync(DB_FILE)) return [];
  return fs.readFileSync(DB_FILE, "utf8").split("\n").filter(Boolean);
}

function getNextTweet() {
  const seen = getSeenIds();
  let tweet = allTweets.find(t => !seen.includes(t.id));

  if (!tweet) {
    fs.writeFileSync(DB_FILE, "");
    tweet = allTweets[0];
  }

  fs.appendFileSync(DB_FILE, tweet.id + "\n");
  return tweet;
}

app.get("/api/tweet", (req, res) => {
  const now = Date.now();

  if (req.query.force === "true" || !currentTweet || now - lastSwitchTime > DISPLAY_DURATION) {
    currentTweet = getNextTweet();
    lastSwitchTime = now;
    console.log("Switched to tweet:", currentTweet.id);
  }

  res.json(currentTweet);
});

// ✅ Hourly refresh (REAL implementation)
setInterval(() => {
  fs.writeFileSync(DB_FILE, "");
  console.log("Hourly refresh completed");
}, 60 * 60 * 1000);

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

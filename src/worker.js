require("dotenv").config();
const { runOnce } = require("./services/workerService");

const POLL_INTERVAL_MS = 5000;

console.log(`[worker] starting, polling every ${POLL_INTERVAL_MS}ms`);

setInterval(() => {
    runOnce().catch((err) => console.error("[worker] poll cycle error:", err));
}, POLL_INTERVAL_MS);
const conversationRepo = require('../repositories/conversation.repository');

const SLA_THRESHOLD_MS = 30 * 60 * 1000;

// The job deliberately creates no ticket and no urgency flag. awaitingAgentSince is the source of truth;
// this query keeps the SLA scan explicit and available for monitoring.
const runSlaCheck = async () => {
  const threshold = new Date(Date.now() - SLA_THRESHOLD_MS);
  const overdue = await conversationRepo.findOverdue(threshold);
  return overdue.map((conversation) => conversation._id.toString());
};

const startSlaCron = () => {
  runSlaCheck().catch((error) => console.error('[SLA] Check failed:', error.message));
  return setInterval(() => {
    runSlaCheck().catch((error) => console.error('[SLA] Check failed:', error.message));
  }, 60 * 1000);
};

module.exports = { SLA_THRESHOLD_MS, startSlaCron, runSlaCheck };

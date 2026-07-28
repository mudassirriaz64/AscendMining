const Conversation = require('../models/Conversation');

/**
 * Ensures the unique index on Conversation.userId exists and removes
 * any duplicate documents that may have accumulated from earlier
 * implementations.  Safe to call on every startup — idempotent.
 */
const deduplicateConversations = async () => {
  // 1. Ensure the unique index exists (idempotent — no-op if already created)
  await Conversation.ensureIndexes();

  // 2. Find userIds that appear more than once
  const duplicates = await Conversation.aggregate([
    { $group: { _id: '$userId', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (duplicates.length === 0) return;

  for (const { _id: userId, ids } of duplicates) {
    // Keep the oldest document (earliest createdAt) — it is most likely to
    // contain the original messages.  Delete the rest.
    const [keepId, ...removeIds] = ids.sort();
    if (removeIds.length > 0) {
      await Conversation.deleteMany({ _id: { $in: removeIds } });
      console.log(
        `[dedup] Removed ${removeIds.length} duplicate conversation(s) for user ${userId}, kept ${keepId}`
      );
    }
  }
};

module.exports = deduplicateConversations;

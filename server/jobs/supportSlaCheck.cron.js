const Conversation = require('../models/Conversation');
const SupportTicket = require('../models/SupportTicket');

const SLA_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// Track which conversations already have an active SLA alarm (avoid duplicate tickets)
const activeAlarms = new Set();

/**
 * Scans conversations where `awaitingAgentSince` is set and older than 30 minutes.
 * For each, creates an escalation ticket and returns alarm data for the socket layer.
 *
 * @param {object} io - Socket.IO server instance (to broadcast alarms)
 */
const runSlaCheck = async (io) => {
  try {
    const threshold = new Date(Date.now() - SLA_THRESHOLD_MS);

    // Find conversations that are overdue
    const overdueConvos = await Conversation.find({
      awaitingAgentSince: { $ne: null, $lte: threshold },
      unreadByAdmin: true,
    }).populate('userId', 'fullName username email');

    const currentlyOverdueIds = new Set(overdueConvos.map((c) => c._id.toString()));

    // ── Trigger new alarms ──────────────────────────────────────────────
    for (const convo of overdueConvos) {
      const convoId = convo._id.toString();

      if (activeAlarms.has(convoId)) continue; // already alarm-triggered

      // Check if an escalation ticket already exists for this conversation
      const existingTicket = await SupportTicket.findOne({
        conversationId: convo._id,
        escalationReason: 'no_agent_response_30min',
        status: { $nin: ['resolved', 'closed'] },
      });

      if (!existingTicket) {
        await SupportTicket.create({
          userId: convo.userId._id,
          conversationId: convo._id,
          subject: `SLA Alert: No agent response for ${convo.userId?.fullName || 'user'}`,
          escalationReason: 'no_agent_response_30min',
          status: 'open',
        });
      }

      activeAlarms.add(convoId);

      // Broadcast alarm to admin room
      if (io) {
        io.of('/support').to('admin').emit('alarm:trigger', {
          conversationId: convoId,
          userId: convo.userId._id,
          user: convo.userId,
          awaitingSince: convo.awaitingAgentSince,
          overdueMinutes: Math.round((Date.now() - convo.awaitingAgentSince.getTime()) / 60000),
        });
      }

      console.log(`[SLA] Alarm triggered for conversation ${convoId} (user: ${convo.userId?.fullName})`);
    }

    // ── Clear alarms that are no longer overdue ──────────────────────────
    for (const alarmId of activeAlarms) {
      if (!currentlyOverdueIds.has(alarmId)) {
        activeAlarms.delete(alarmId);

        if (io) {
          io.of('/support').to('admin').emit('alarm:clear', { conversationId: alarmId });
        }

        console.log(`[SLA] Alarm cleared for conversation ${alarmId}`);
      }
    }
  } catch (err) {
    console.error('[SLA] Cron check error:', err.message);
  }
};

/**
 * Start the SLA cron job. Runs every 60 seconds.
 * @param {object} io - Socket.IO server instance
 * @returns {NodeJS.Timeout} interval handle for cleanup
 */
const startSlaCron = (io) => {
  console.log('[SLA] Cron job started (runs every 60s, threshold: 30min)');

  // Run immediately on start
  runSlaCheck(io);

  // Then every 60 seconds
  const interval = setInterval(() => runSlaCheck(io), 60 * 1000);
  return interval;
};

module.exports = { startSlaCron, runSlaCheck };

/**
 * Consolidated emitter for support chat SLA alarms
 */
const emitAlarmClear = (namespace, conversationId) => {
  if (!namespace || !conversationId) return;
  namespace.to('admin-alerts').emit('alarm:clear', {
    conversationId: conversationId.toString(),
  });
};

const emitAlarmTrigger = (namespace, conversationId, awaitingAgentSince) => {
  if (!namespace || !conversationId) return;
  namespace.to('admin-alerts').emit('alarm:trigger', {
    conversationId: conversationId.toString(),
    awaitingAgentSince,
  });
};

module.exports = {
  emitAlarmClear,
  emitAlarmTrigger,
};

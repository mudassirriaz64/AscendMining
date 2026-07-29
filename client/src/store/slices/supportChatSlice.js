import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Investor Thunks ────────────────────────────────────────────────────────

export const fetchMyConversation = createAsyncThunk(
  'supportChat/fetchMyConversation',
  async ({ markRead = false } = {}, { rejectWithValue }) => {
    try {
      const params = markRead ? '?opened=true' : '';
      const res = await api.get(`/support/conversations/me${params}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load chat.');
    }
  }
);

export const fetchSessionMessages = createAsyncThunk(
  'supportChat/fetchSessionMessages',
  async ({ sessionId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/support/conversations/sessions/${sessionId}/messages`);
      return { sessionId, messages: res.data.data.messages };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load messages.');
    }
  }
);

export const createSession = createAsyncThunk(
  'supportChat/createSession',
  async ({ title } = {}, { rejectWithValue }) => {
    try {
      const res = await api.post('/support/conversations/sessions', { title });
      return res.data.data.session;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to create session.');
    }
  }
);

export const deleteSession = createAsyncThunk(
  'supportChat/deleteSession',
  async ({ sessionId }, { rejectWithValue }) => {
    try {
      await api.delete(`/support/conversations/sessions/${sessionId}`);
      return { sessionId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to delete session.');
    }
  }
);

export const closeSession = createAsyncThunk(
  'supportChat/closeSession',
  async ({ sessionId, reason = 'user_close' }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/support/conversations/sessions/${sessionId}/close`, { reason });
      return res.data.data.session;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to close session.');
    }
  }
);

export const sendMessageREST = createAsyncThunk(
  'supportChat/sendMessage',
  async ({ body, sessionId }, { rejectWithValue }) => {
    try {
      const res = await api.post('/support/conversations/message', { body, sessionId });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to send message.');
    }
  }
);

export const escalateConversation = createAsyncThunk(
  'supportChat/escalateConversation',
  async ({ conversationId, subject }, { rejectWithValue }) => {
    try {
      const res = await api.post('/support/tickets/escalate', { conversationId, subject });
      return res.data.data.ticket;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to create ticket.');
    }
  }
);

// ── Ticket Thunks ──────────────────────────────────────────────────────────

export const fetchMyTickets = createAsyncThunk(
  'supportChat/fetchMyTickets',
  async ({ page = 1, status } = {}, { rejectWithValue }) => {
    try {
      const params = { page };
      if (status) params.status = status;
      const res = await api.get('/support/tickets', { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load tickets.');
    }
  }
);

// ── Admin Thunks ───────────────────────────────────────────────────────────

export const fetchAdminConversations = createAsyncThunk(
  'supportChat/fetchAdminConversations',
  async ({ page = 1 } = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/admin/support/conversations', { params: { page } });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load conversations.');
    }
  }
);

export const openConversation = createAsyncThunk(
  'supportChat/openConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/admin/support/conversations/${conversationId}`);
      return { conversationId, ...res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to open conversation.');
    }
  }
);

export const adminReplyREST = createAsyncThunk(
  'supportChat/adminReply',
  async ({ conversationId, body, sessionId }, { rejectWithValue }) => {
    try {
      const res = await api.post('/support/conversations/message', { conversationId, body, sessionId });
      return { conversationId, sessionId, message: res.data.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to send reply.');
    }
  }
);

export const adminDeleteSession = createAsyncThunk(
  'supportChat/adminDeleteSession',
  async ({ sessionId }, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/support/conversations/sessions/${sessionId}`);
      return { sessionId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to delete session.');
    }
  }
);

export const fetchAdminTickets = createAsyncThunk(
  'supportChat/fetchAdminTickets',
  async ({ page = 1, status } = {}, { rejectWithValue }) => {
    try {
      const params = { page };
      if (status) params.status = status;
      const res = await api.get('/admin/support/tickets', { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load tickets.');
    }
  }
);

export const updateAdminTicket = createAsyncThunk(
  'supportChat/updateAdminTicket',
  async ({ id, status, assignedAgent }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/admin/support/tickets/${id}`, { status, assignedAgent });
      return res.data.data.ticket;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to update ticket.');
    }
  }
);

export const fetchAdminUnreadCount = createAsyncThunk(
  'supportChat/fetchAdminUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/admin/support/conversations/waiting');
      return res.data.data.count;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load unread count.');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const supportChatSlice = createSlice({
  name: 'supportChat',
  initialState: {
    conversation: null,
    sessions: [],
    activeSessionId: null,
    messages: [],
    escalationAvailable: false,
    conversations: [],
    conversationsMeta: { total: 0, page: 1, totalPages: 1 },
    activeConversationId: null,
    activeMessages: [],
    activeSessions: [],
    unreadCount: 0,
    activeAlarms: [],
    tickets: [],
    ticketsMeta: { total: 0, page: 1, totalPages: 1 },
    adminTickets: [],
    adminTicketsMeta: { total: 0, page: 1, totalPages: 1 },
    loading: false,
    error: null,
  },
  reducers: {
    appendMessage(state, action) {
      const payload = action.payload || {};
      const msg = payload.message || payload;
      if (!msg || !msg._id) return;
      const conversation = payload.conversation;
      const sessionId = payload.sessionId || msg.sessionId;

      if (state.activeSessionId && sessionId && String(state.activeSessionId) === String(sessionId)) {
        if (!state.messages.some((m) => m._id === msg._id)) {
          state.messages.push(msg);
        }
      } else if (!sessionId && state.conversation?._id && String(state.conversation._id) === String(msg.conversationId)) {
        if (!state.messages.some((m) => m._id === msg._id)) {
          state.messages.push(msg);
        }
      }
      if (conversation) {
        state.conversation = conversation;
        state.escalationAvailable = conversation.escalationAvailable;
      }
    },
    appendAdminMessage(state, action) {
      const { conversationId, message, conversation } = action.payload;
      if (state.activeConversationId === conversationId) {
        if (!state.activeMessages.some((m) => m._id === message._id)) {
          state.activeMessages.push(message);
        }
      }
      const convo = state.conversations.find((c) => c._id === conversationId);
      if (convo) {
        convo.lastMessagePreview = message.body?.substring(0, 80);
        convo.lastMessageAt = message.sentAt;
        convo.unreadByAdmin = message.senderRole === 'investor';
      }
    },
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload;
      state.activeMessages = [];
    },
    setActiveSession(state, action) {
      state.activeSessionId = action.payload;
      state.messages = [];
    },
    triggerAlarm(state, action) {
      const alarm = action.payload;
      if (!state.activeAlarms.find((a) => a.conversationId === alarm.conversationId)) {
        state.activeAlarms.push(alarm);
      }
    },
    clearAlarm(state, action) {
      const { conversationId } = action.payload;
      state.activeAlarms = state.activeAlarms.filter((a) => a.conversationId !== conversationId);
    },
    clearError(state) {
      state.error = null;
    },
    markMessagesRead(state, action) {
      const { readerRole, readAt } = action.payload;
      const targetRole = readerRole === 'investor' ? ['admin', 'support_agent'] : ['investor'];
      state.messages.forEach((msg) => {
        if (targetRole.includes(msg.senderRole) && !msg.readAt) {
          msg.readAt = readAt;
        }
      });
      state.activeMessages.forEach((msg) => {
        if (targetRole.includes(msg.senderRole) && !msg.readAt) {
          msg.readAt = readAt;
        }
      });
    },
    prependMessages(state, action) {
      const { messages } = action.payload;
      const newMsgs = messages.filter(m => !state.messages.some(existing => existing._id === m._id));
      state.messages = [...newMsgs, ...state.messages];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyConversation.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.conversation = action.payload.conversation;
        state.sessions = action.payload.sessions || [];
        state.activeSessionId = action.payload.activeSessionId || null;
        state.messages = action.payload.messages || [];
        state.escalationAvailable = action.payload.conversation?.escalationAvailable || false;
      })
      .addCase(fetchMyConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchSessionMessages.fulfilled, (state, action) => {
        state.activeSessionId = action.payload.sessionId;
        state.messages = action.payload.messages;
      });

    builder
      .addCase(createSession.fulfilled, (state, action) => {
        state.sessions.unshift(action.payload);
        state.activeSessionId = action.payload._id;
        state.messages = [];
      });

    builder
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter((s) => s._id !== action.payload.sessionId);
        if (state.activeSessionId === action.payload.sessionId) {
          state.activeSessionId = state.sessions[0]?._id || null;
          state.messages = [];
        }
      });

    builder
      .addCase(closeSession.fulfilled, (state, action) => {
        const idx = state.sessions.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) {
          state.sessions[idx] = action.payload;
        }
        if (state.activeSessionId === action.payload._id) {
          state.activeSessionId = state.sessions.find((s) => !s.closedAt)?._id || null;
          if (state.activeSessionId !== action.payload._id) {
            state.messages = [];
          }
        }
      });

    builder
      .addCase(sendMessageREST.fulfilled, (state, action) => {
        const { message, conversation, sessionId } = action.payload;
        if (!state.messages.some((m) => m._id === message._id)) {
          state.messages.push(message);
        }
        if (conversation) {
          state.conversation = conversation;
          state.escalationAvailable = conversation.escalationAvailable;
        }
      });

    builder
      .addCase(escalateConversation.fulfilled, (state) => {
        state.escalationAvailable = false;
      });

    builder
      .addCase(fetchMyTickets.pending, (state) => { state.loading = true; })
      .addCase(fetchMyTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.tickets;
        state.ticketsMeta = {
          total: action.payload.total,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchMyTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchAdminConversations.pending, (state) => { state.loading = true; })
      .addCase(fetchAdminConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload.conversations;
        state.conversationsMeta = {
          total: action.payload.total,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchAdminConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(openConversation.pending, (state) => { state.loading = true; })
      .addCase(openConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.activeConversationId = action.payload.conversationId;
        state.activeMessages = action.payload.messages || [];
        state.activeSessions = action.payload.sessions || [];
        state.activeAlarms = state.activeAlarms.filter(
          (a) => a.conversationId !== action.payload.conversationId
        );
        const convo = state.conversations.find((c) => c._id === action.payload.conversationId);
        if (convo) {
          convo.awaitingAgentSince = null;
          convo.unreadByAdmin = false;
        }
      })
      .addCase(openConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(adminReplyREST.fulfilled, (state, action) => {
        if (state.activeConversationId === action.payload.conversationId) {
          if (!state.activeMessages.some((m) => m._id === action.payload.message._id)) {
            state.activeMessages.push(action.payload.message);
          }
        }
      });

    builder
      .addCase(adminDeleteSession.fulfilled, (state, action) => {
        state.activeSessions = state.activeSessions.filter((s) => s._id !== action.payload.sessionId);
        state.activeMessages = state.activeMessages.filter((m) => m.sessionId !== action.payload.sessionId);
      });

    builder
      .addCase(fetchAdminTickets.pending, (state) => { state.loading = true; })
      .addCase(fetchAdminTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.adminTickets = action.payload.tickets;
        state.adminTicketsMeta = {
          total: action.payload.total,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchAdminTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateAdminTicket.fulfilled, (state, action) => {
        const idx = state.adminTickets.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.adminTickets[idx] = action.payload;
      });

    builder
      .addCase(fetchAdminUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

export const {
  appendMessage,
  appendAdminMessage,
  setActiveConversation,
  setActiveSession,
  triggerAlarm,
  clearAlarm,
  clearError,
  markMessagesRead,
  prependMessages,
} = supportChatSlice.actions;
export default supportChatSlice.reducer;

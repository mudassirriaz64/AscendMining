import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Investor Thunks ────────────────────────────────────────────────────────

export const fetchActiveSession = createAsyncThunk(
  'supportChat/fetchActiveSession',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/support/chat');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load chat.');
    }
  }
);

export const fetchMySessions = createAsyncThunk(
  'supportChat/fetchMySessions',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/support/chat/sessions');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load sessions.');
    }
  }
);

export const startNewSession = createAsyncThunk(
  'supportChat/startNewSession',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post('/support/chat/sessions');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to start session.');
    }
  }
);

export const fetchSessionMessages = createAsyncThunk(
  'supportChat/fetchSessionMessages',
  async (sessionId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/support/chat/sessions/${sessionId}/messages`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load messages.');
    }
  }
);

export const closeSession = createAsyncThunk(
  'supportChat/closeSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/support/chat/sessions/${sessionId}/close`);
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
      const res = await api.post('/support/chat/message', { body, sessionId });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to send message.');
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

export const createTicket = createAsyncThunk(
  'supportChat/createTicket',
  async ({ subject, conversationId, escalationReason }, { rejectWithValue }) => {
    try {
      const res = await api.post('/support/tickets', { subject, conversationId, escalationReason });
      return res.data.data.ticket;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to create ticket.');
    }
  }
);

// ── Admin Thunks ───────────────────────────────────────────────────────────

export const fetchAdminConversations = createAsyncThunk(
  'supportChat/fetchAdminConversations',
  async ({ page = 1 } = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/admin/support/chat', { params: { page } });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load conversations.');
    }
  }
);

export const fetchAdminConversationMessages = createAsyncThunk(
  'supportChat/fetchAdminConversationMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/admin/support/chat/${conversationId}/messages`);
      return { conversationId, messages: res.data.data.messages, sessions: res.data.data.sessions };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load messages.');
    }
  }
);

export const adminReplyREST = createAsyncThunk(
  'supportChat/adminReply',
  async ({ conversationId, body }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/admin/support/chat/${conversationId}/reply`, { body });
      return { conversationId, message: res.data.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to send reply.');
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
      const res = await api.get('/admin/support/chat/unread-count');
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
    // Investor session-based
    sessions: [],
    activeSession: null,
    activeSessionId: null,
    sessionMessages: [],
    // Admin
    conversations: [],
    conversationsMeta: { total: 0, page: 1, totalPages: 1 },
    activeConversationId: null,
    activeMessages: [],
    activeSessions: [], // sessions for the active admin conversation (for dividers)
    unreadCount: 0,
    // SLA alarms
    activeAlarms: [], // { conversationId, userId, user, awaitingSince, overdueMinutes }
    // Tickets
    tickets: [],
    ticketsMeta: { total: 0, page: 1, totalPages: 1 },
    adminTickets: [],
    adminTicketsMeta: { total: 0, page: 1, totalPages: 1 },
    // UI
    loading: false,
    error: null,
  },
  reducers: {
    // Socket-driven: incoming message on the active investor session
    appendSessionMessage(state, action) {
      const msg = action.payload.message;
      if (state.activeSessionId && msg.sessionId === state.activeSessionId) {
        state.sessionMessages.push(msg);
      }
    },
    // Socket-driven: new active session from server
    setActiveSocketSession(state, action) {
      state.activeSession = action.payload.session;
      state.activeSessionId = action.payload.session._id;
      state.sessionMessages = [];
      // Add to sessions list if not already there
      const exists = state.sessions.find((s) => s._id === action.payload.session._id);
      if (!exists) {
        state.sessions.unshift(action.payload.session);
      }
    },
    // Socket-driven: session closed
    markSessionClosed(state, action) {
      const { sessionId } = action.payload;
      const session = state.sessions.find((s) => s._id === sessionId);
      if (session) {
        session.isActive = false;
        session.status = 'resolved';
      }
      if (state.activeSessionId === sessionId) {
        state.activeSession = { ...state.activeSession, isActive: false, status: 'resolved' };
      }
    },
    // Socket-driven: admin incoming message
    appendAdminMessage(state, action) {
      const { conversationId, message } = action.payload;
      if (state.activeConversationId === conversationId) {
        state.activeMessages.push(message);
      }
      // Update lastMessagePreview in conversations list
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
      state.activeSessions = [];
    },
    // SLA alarm reducers (dispatched from socket events)
    triggerAlarm(state, action) {
      const alarm = action.payload;
      const exists = state.activeAlarms.find((a) => a.conversationId === alarm.conversationId);
      if (!exists) {
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
  },
  extraReducers: (builder) => {
    // fetchActiveSession
    builder
      .addCase(fetchActiveSession.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchActiveSession.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload.session;
        state.activeSessionId = action.payload.session?._id || null;
        state.sessionMessages = action.payload.messages || [];
      })
      .addCase(fetchActiveSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchMySessions
    builder
      .addCase(fetchMySessions.pending, (state) => { state.loading = true; })
      .addCase(fetchMySessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload.sessions;
      })
      .addCase(fetchMySessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // startNewSession
    builder
      .addCase(startNewSession.fulfilled, (state, action) => {
        state.activeSession = action.payload.session;
        state.activeSessionId = action.payload.session._id;
        state.sessionMessages = [];
        state.sessions.unshift(action.payload.session);
      });

    // fetchSessionMessages
    builder
      .addCase(fetchSessionMessages.pending, (state) => { state.loading = true; })
      .addCase(fetchSessionMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload.session;
        state.activeSessionId = action.payload.session._id;
        state.sessionMessages = action.payload.messages;
      })
      .addCase(fetchSessionMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // closeSession
    builder
      .addCase(closeSession.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.sessions.findIndex((s) => s._id === updated._id);
        if (idx !== -1) state.sessions[idx] = updated;
        if (state.activeSessionId === updated._id) {
          state.activeSession = updated;
        }
      });

    // sendMessageREST
    builder
      .addCase(sendMessageREST.fulfilled, (state, action) => {
        state.sessionMessages.push(action.payload.message);
      });

    // fetchMyTickets
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

    // createTicket
    builder
      .addCase(createTicket.fulfilled, (state, action) => {
        state.tickets.unshift(action.payload);
        state.ticketsMeta.total += 1;
      });

    // fetchAdminConversations
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

    // fetchAdminConversationMessages
    builder
      .addCase(fetchAdminConversationMessages.pending, (state) => { state.loading = true; })
      .addCase(fetchAdminConversationMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.activeConversationId = action.payload.conversationId;
        state.activeMessages = action.payload.messages;
        state.activeSessions = action.payload.sessions;
      })
      .addCase(fetchAdminConversationMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // adminReplyREST
    builder
      .addCase(adminReplyREST.fulfilled, (state, action) => {
        if (state.activeConversationId === action.payload.conversationId) {
          state.activeMessages.push(action.payload.message);
        }
      });

    // fetchAdminTickets
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

    // updateAdminTicket
    builder
      .addCase(updateAdminTicket.fulfilled, (state, action) => {
        const idx = state.adminTickets.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.adminTickets[idx] = action.payload;
      });

    // fetchAdminUnreadCount
    builder
      .addCase(fetchAdminUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

export const {
  appendSessionMessage,
  setActiveSocketSession,
  markSessionClosed,
  appendAdminMessage,
  setActiveConversation,
  triggerAlarm,
  clearAlarm,
  clearError,
} = supportChatSlice.actions;
export default supportChatSlice.reducer;

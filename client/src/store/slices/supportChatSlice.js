import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchConversation = createAsyncThunk(
  'supportChat/fetchConversation',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/support/chat');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load chat.');
    }
  }
);

export const sendMessageREST = createAsyncThunk(
  'supportChat/sendMessage',
  async (body, { rejectWithValue }) => {
    try {
      const res = await api.post('/support/chat/message', { body });
      return res.data.data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to send message.');
    }
  }
);

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

// Admin thunks
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
      return { conversationId, messages: res.data.data.messages };
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

// ── Slice ─────────────────────────────────────────────────────────────────────

const supportChatSlice = createSlice({
  name: 'supportChat',
  initialState: {
    // Investor
    conversation: null,
    messages: [],
    tickets: [],
    ticketsMeta: { total: 0, page: 1, totalPages: 1 },
    // Admin
    conversations: [],
    conversationsMeta: { total: 0, page: 1, totalPages: 1 },
    activeConversationId: null,
    activeMessages: [],
    adminTickets: [],
    adminTicketsMeta: { total: 0, page: 1, totalPages: 1 },
    // UI
    loading: false,
    error: null,
  },
  reducers: {
    appendMessage(state, action) {
      // Used by socket handler to push incoming real-time messages
      state.messages.push(action.payload);
    },
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
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchConversation
    builder
      .addCase(fetchConversation.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.conversation = action.payload.conversation;
        state.messages = action.payload.messages;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // sendMessageREST
    builder
      .addCase(sendMessageREST.fulfilled, (state, action) => {
        state.messages.push(action.payload);
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
  },
});

export const { appendMessage, appendAdminMessage, setActiveConversation, clearError } = supportChatSlice.actions;
export default supportChatSlice.reducer;

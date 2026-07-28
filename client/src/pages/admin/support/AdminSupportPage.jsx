import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MessageCircle, Ticket, Send, Clock, CheckCircle2,
  AlertCircle, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchAdminConversations,
  fetchAdminConversationMessages,
  adminReplyREST,
  fetchAdminTickets,
  updateAdminTicket,
  setActiveConversation,
  appendAdminMessage,
} from '../../../store/slices/supportChatSlice';
import { connectSocket, getSocket } from '../../../services/socketService';

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'text-slate-500 bg-slate-50 border-slate-200', icon: X },
};

const AdminSupportPage = () => {
  const dispatch = useDispatch();
  const {
    conversations, activeConversationId, activeMessages, activeSessions,
    adminTickets, adminTicketsMeta,
  } = useSelector((s) => s.supportChat);

  const [activeTab, setActiveTab] = useState('chat');
  const [replyInput, setReplyInput] = useState('');
  const [sending, setSending] = useState(false);
  const [ticketFilter, setTicketFilter] = useState('all');
  const messagesEndRef = useRef(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchAdminConversations());
    dispatch(fetchAdminTickets({}));
  }, [dispatch]);

  // ── Admin socket connection ───────────────────────────────────────────────
  useEffect(() => {
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };
    const token = getCookie('accessToken');
    if (!token) return;

    const socket = connectSocket(token);

    socket.on('new_message', ({ conversationId, message }) => {
      dispatch(appendAdminMessage({ conversationId, message }));
    });

    return () => {
      socket.off('new_message');
    };
  }, [dispatch]);

  // ── Auto scroll in message view ───────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // ── Select a conversation ─────────────────────────────────────────────────
  const handleSelectConversation = (conversationId) => {
    dispatch(setActiveConversation(conversationId));
    dispatch(fetchAdminConversationMessages(conversationId));
  };

  // ── Send reply ────────────────────────────────────────────────────────────
  const handleSendReply = async () => {
    if (!replyInput.trim() || !activeConversationId || sending) return;
    setSending(true);

    const socket = getSocket();
    const body = replyInput.trim();

    if (socket?.connected) {
      socket.emit('agent_reply', { conversationId: activeConversationId, body });
      setReplyInput('');
      setSending(false);
    } else {
      try {
        await dispatch(adminReplyREST({ conversationId: activeConversationId, body })).unwrap();
        setReplyInput('');
      } catch (err) {
        toast.error(err || 'Failed to send reply.');
      } finally {
        setSending(false);
      }
    }
  };

  // ── Update ticket status ──────────────────────────────────────────────────
  const handleTicketStatusChange = async (ticketId, status) => {
    try {
      await dispatch(updateAdminTicket({ id: ticketId, status })).unwrap();
      toast.success('Ticket updated!');
    } catch (err) {
      toast.error(err || 'Failed to update ticket.');
    }
  };

  const formatTime = (date) =>
    date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const activeConversation = conversations.find((c) => c._id === activeConversationId);
  const filteredTickets = ticketFilter === 'all'
    ? adminTickets
    : adminTickets.filter((t) => t.status === ticketFilter);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-light-bg">Support Center</h1>
        <p className="text-sm text-text-secondary mt-1">Manage live chats and support tickets</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-light-alt rounded-xl p-1 w-fit border border-border-light">
        {[
          { id: 'chat', label: 'Live Chats', icon: MessageCircle, count: conversations.length },
          { id: 'tickets', label: 'Tickets', icon: Ticket, count: adminTicketsMeta.total },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-text-light-bg shadow-sm border border-border-light'
                : 'text-text-secondary hover:text-text-light-bg'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── CHAT TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <div className="flex gap-4" style={{ height: '68vh' }}>
          {/* Conversations list */}
          <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-border-light flex flex-col overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-border-light">
              <p className="text-sm font-semibold text-text-light-bg">All Conversations</p>
              <p className="text-xs text-text-secondary mt-0.5">{conversations.length} threads</p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border-light">
              {conversations.length === 0 && (
                <div className="p-6 text-center text-text-secondary text-sm">No conversations yet.</div>
              )}
              {conversations.map((convo) => (
                <button
                  key={convo._id}
                  onClick={() => handleSelectConversation(convo._id)}
                  className={`w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-bg-light-alt transition-colors cursor-pointer ${
                    activeConversationId === convo._id ? 'bg-primary/5 border-l-2 border-primary' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#001f3f] to-[#083358] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {convo.userId?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-text-light-bg truncate">
                        {convo.userId?.fullName || 'Unknown User'}
                      </p>
                      {convo.unreadByAdmin && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {convo.lastMessagePreview || 'No messages yet'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(convo.lastMessageAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex-1 bg-white rounded-2xl border border-border-light flex flex-col overflow-hidden shadow-sm">
            {!activeConversationId ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-3 text-text-secondary">
                <MessageCircle size={40} className="opacity-20" />
                <p className="text-sm font-medium">Select a conversation to view messages</p>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="px-5 py-3 border-b border-border-light flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#001f3f] to-[#083358] flex items-center justify-center text-white text-xs font-bold">
                    {activeConversation?.userId?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-light-bg">
                      {activeConversation?.userId?.fullName || 'User'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      @{activeConversation?.userId?.username || '—'}
                    </p>
                  </div>
                </div>

                {/* Messages with session dividers */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {activeMessages.length === 0 && (
                    <div className="text-center text-sm text-text-secondary py-8">No messages in this conversation.</div>
                  )}
                  {(() => {
                    // Build a map of sessionId → session info for dividers
                    const sessionMap = {};
                    activeSessions.forEach((s) => { sessionMap[s._id] = s; });

                    // Track which sessions we've already shown dividers for
                    const shownDividers = new Set();
                    let lastSessionId = null;

                    return activeMessages.map((msg) => {
                      const isAgent = msg.senderRole !== 'investor';
                      const msgSessionId = msg.sessionId;
                      const showDivider = msgSessionId && !shownDividers.has(msgSessionId) && msgSessionId !== lastSessionId;
                      const session = msgSessionId ? sessionMap[msgSessionId] : null;
                      if (showDivider && msgSessionId) {
                        shownDividers.add(msgSessionId);
                        lastSessionId = msgSessionId;
                      } else if (msgSessionId) {
                        lastSessionId = msgSessionId;
                      }

                      return (
                        <React.Fragment key={msg._id}>
                          {showDivider && (
                            <div className="flex items-center gap-3 my-4">
                              <div className="flex-1 h-px bg-slate-200" />
                              <span className="text-[10px] text-slate-400 font-medium px-2 bg-white">
                                {session ? `Session started ${new Date(session.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Session'}
                              </span>
                              <div className="flex-1 h-px bg-slate-200" />
                            </div>
                          )}
                          <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                                  isAgent
                                    ? 'bg-gradient-to-br from-[#001f3f] to-[#083358] text-white rounded-br-sm'
                                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                                }`}
                              >
                                {msg.body}
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1 px-1">
                                {msg.senderRole !== 'investor' ? 'You · ' : ''}{formatTime(msg.sentAt)}
                              </span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply box */}
                <div className="border-t border-border-light px-4 py-3 flex items-end gap-3 bg-bg-light-alt/30">
                  <textarea
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                    placeholder="Type a reply…"
                    rows={1}
                    className="flex-1 resize-none bg-white border border-border-light rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder-text-secondary max-h-28 overflow-y-auto"
                    style={{ minHeight: '42px' }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyInput.trim() || sending}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#001f3f] to-[#083358] text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TICKETS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'tickets' && (
        <div className="flex flex-col gap-4">
          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((f) => (
              <button
                key={f}
                onClick={() => setTicketFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer border ${
                  ticketFilter === f
                    ? 'bg-[#001f3f] text-white border-[#001f3f]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label || f}
              </button>
            ))}
          </div>

          {/* Tickets table */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
            {filteredTickets.length === 0 ? (
              <div className="py-16 text-center text-text-secondary">
                <Ticket size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No tickets found.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light bg-bg-light-alt">
                    <th className="text-left px-5 py-3 text-text-secondary font-semibold">User</th>
                    <th className="text-left px-5 py-3 text-text-secondary font-semibold">Subject</th>
                    <th className="text-left px-5 py-3 text-text-secondary font-semibold">Status</th>
                    <th className="text-left px-5 py-3 text-text-secondary font-semibold">Created</th>
                    <th className="text-left px-5 py-3 text-text-secondary font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {filteredTickets.map((ticket) => {
                    const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                    const Icon = cfg.icon;
                    return (
                      <tr key={ticket._id} className="hover:bg-bg-light-alt/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-text-light-bg">{ticket.userId?.fullName || '—'}</p>
                          <p className="text-xs text-text-secondary">@{ticket.userId?.username || '—'}</p>
                        </td>
                        <td className="px-5 py-3.5 text-text-light-bg max-w-xs">
                          <p className="truncate">{ticket.subject}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`flex items-center gap-1.5 w-fit px-3 py-1 rounded-full border text-xs font-semibold ${cfg.color}`}>
                            <Icon size={11} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-text-secondary">
                          {new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={ticket.status}
                            onChange={(e) => handleTicketStatusChange(ticket._id, e.target.value)}
                            className="text-sm border border-border-light rounded-lg px-2.5 py-1 outline-none focus:border-primary bg-white text-text-light-bg cursor-pointer"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportPage;

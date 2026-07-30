import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Ticket, AlertTriangle, Trash2, Paperclip, FileText, Image as ImageIcon, Download, Loader2, Zap, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { connectSocket, getSocket } from '../../../services/socketService';
import { formatRelativeTime, formatFullTimestamp } from '../../../utils/date';
import { triggerTabFlash } from '../../../utils/browser';
import ConfirmModal from '../../../components/common/ConfirmModal';
import PromptModal from '../../../components/common/PromptModal';

const STATUS = {
  open: ['Open', 'bg-amber-50 text-amber-800'],
  in_progress: ['In progress', 'bg-blue-50 text-blue-800'],
  resolved: ['Resolved', 'bg-emerald-50 text-emerald-800'],
  closed: ['Closed', 'bg-slate-100 text-slate-700'],
};

const CANNED_RESPONSES = [
  { label: 'Greeting', text: "Hi! Thanks for reaching out — how can I help today?" },
  { label: 'Deposit received', text: "Your deposit has been received and is pending approval. We'll notify you once it's confirmed." },
  { label: 'Withdrawal status', text: "Your withdrawal request is being reviewed and typically completes within 24 hours." },
  { label: 'Escalation ack', text: "I've noted your ticket and our team will follow up shortly. Thanks for your patience." },
];

const AdminSupportPage = () => {
  const [view, setView] = useState('conversations');
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [alarmIds, setAlarmIds] = useState(() => new Set());
  const [alarmDismissed, setAlarmDismissed] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollPill, setShowScrollPill] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Attachments State
  const [uploading, setUploading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);

  const [confirmDeleteSession, setConfirmDeleteSession] = useState({ open: false, id: null });
  const [confirmCloseSession, setConfirmCloseSession] = useState({ open: false, id: null });
  const [confirmDeleteConversationModal, setConfirmDeleteConversationModal] = useState(false);
  const [promptCreateSession, setPromptCreateSession] = useState(false);

  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);
  const selectedIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const lastSelectedIdRef = useRef(null);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 100;
    setIsNearBottom(isAtBottom);
    if (isAtBottom) {
      setShowScrollPill(false);
    }
  };

  const handleInputChange = (e) => {
    const el = e.target;
    setReply(el.value);
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;

    // Typing start emit
    const socket = getSocket() || connectSocket();
    if (socket?.connected && selectedIdRef.current) {
      socket.emit('typing:start', { conversationId: selectedIdRef.current });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { conversationId: selectedIdRef.current });
      }, 3000);
    }
  };

  const loadConversations = useCallback(async () => {
    try {
      const response = await api.get('/admin/support/conversations');
      const convos = response.data.data.conversations || [];
      setConversations(convos);

      // Sync alarmIds with currently overdue conversations
      const overdueIds = convos
        .filter((c) => c.escalationAvailable)
        .map((c) => c._id);
      setAlarmIds(new Set(overdueIds));
    } catch (e) {
      console.warn('Failed to load support conversations:', e);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    try {
      const response = await api.get('/admin/support/tickets');
      setTickets(response.data.data.tickets || []);
    } catch (e) {
      console.warn('Failed to load support tickets:', e);
    }
  }, []);

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    loadConversations();
    loadTickets();
    const socket = connectSocket();
    const onMessage = (data) => {
      const msg = data?.message || data;
      if (!msg || !msg._id) return;
      const convo = data?.conversation;
      const targetConvoId = convo?._id || msg?.conversationId;
      if (targetConvoId && String(targetConvoId) === String(selectedIdRef.current)) {
        setMessages((current) => current.some((item) => item._id === msg._id) ? current : [...current, msg]);
        
        // If the message has a session ID, ensure we have the session details, else fetch them
        if (msg.sessionId) {
          setActiveSessions((current) => {
            const hasSession = current.some((s) => String(s._id) === String(msg.sessionId));
            if (!hasSession) {
              api.get(`/admin/support/conversations/${targetConvoId}`).then((response) => {
                setActiveSessions(response.data.data.sessions || []);
              }).catch(() => {});
            }
            return current;
          });
        }

        // Emit conversation:read to clear alarm/unread status immediately
        const socket = getSocket() || connectSocket();
        if (socket?.connected) {
          socket.emit('conversation:read', { conversationId: String(targetConvoId) });
        }
      }
      if (['investor', 'guest'].includes(msg.senderRole)) {
        triggerTabFlash('New support chat message');
      }
      loadConversations().catch(() => {});
    };
    const onNewSession = ({ session }) => {
      if (session) {
        setActiveSessions((current) => {
          if (current.some((s) => String(s._id) === String(session._id))) return current;
          return [session, ...current];
        });
      }
    };
    const onAlarmTrigger = ({ conversationId }) => {
      setAlarmIds((current) => new Set(current).add(conversationId));
      setAlarmDismissed(false);
    };
    const onAlarmClear = ({ conversationId }) => {
      setAlarmIds((current) => {
        const next = new Set(current);
        next.delete(conversationId);
        return next;
      });
    };
    const onRead = ({ readerRole, conversationId, readAt }) => {
      if (['investor', 'guest'].includes(readerRole) && conversationId === selectedIdRef.current) {
        setMessages((current) => current.map((msg) => {
          if (!['investor', 'guest'].includes(msg.senderRole) && !msg.readAt) {
            return { ...msg, readAt };
          }
          return msg;
        }));
      }
    };
    const onTypingStart = ({ senderRole, conversationId }) => {
      if (['investor', 'guest'].includes(senderRole) && conversationId === selectedIdRef.current) setIsTyping(true);
    };
    const onTypingStop = ({ senderRole, conversationId }) => {
      if (['investor', 'guest'].includes(senderRole) && conversationId === selectedIdRef.current) setIsTyping(false);
    };
    socket.on('message:new', onMessage);
    socket.on('session:new', onNewSession);
    socket.on('alarm:trigger', onAlarmTrigger);
    socket.on('alarm:clear', onAlarmClear);
    socket.on('conversation:read', onRead);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    return () => {
      socket.off('message:new', onMessage);
      socket.off('session:new', onNewSession);
      socket.off('alarm:trigger', onAlarmTrigger);
      socket.off('alarm:clear', onAlarmClear);
      socket.off('conversation:read', onRead);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [loadConversations, loadTickets]);

  // Handle auto scroll
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;

    const lastMsg = messages[messages.length - 1];
    const lastMsgId = lastMsg?._id;
    const sentByMe = lastMsg && (lastMsg.senderRole === 'admin' || lastMsg.senderRole === 'support_agent');

    const isNewConvo = lastSelectedIdRef.current !== selectedId;
    
    if (isNewConvo || sentByMe || isNearBottom) {
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 50);
      setIsNearBottom(true);
      setShowScrollPill(false);
    } else if (messages.length > 0 && lastMsgId && lastMessageIdRef.current !== lastMsgId) {
      setShowScrollPill(true);
    }

    lastMessageIdRef.current = lastMsgId;
    lastSelectedIdRef.current = selectedId;
  }, [messages, selectedId]);

  const openConversation = async (id) => {
    try {
      const response = await api.get(`/admin/support/conversations/${id}`);
      setSelectedId(id);
      setSelected(response.data.data.conversation);
      setMessages(response.data.data.messages || []);
      setActiveSessions(response.data.data.sessions || []);
      setPage(1);
      setHasMore(true);
      setIsTyping(false);
      setConversations((current) => current.map((item) => item._id === id ? { ...item, awaitingAgentSince: null, unreadByAdmin: false } : item));
      setAlarmIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      const socket = connectSocket();
      socket.emit('conversation:join', { conversationId: id });
      socket.emit('conversation:read', { conversationId: id });
    } catch { toast.error('Conversation could not be opened.'); }
  };

  const sendReply = async () => {
    const body = reply.trim();
    if ((!body && !pendingAttachment) || !selectedId || sending) return;
    setSending(true);
    const socket = connectSocket();
    if (socket?.connected && selectedId) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit('typing:stop', { conversationId: selectedId });
    }

    const payload = {
      conversationId: selectedId,
      body,
      attachmentUrl: pendingAttachment?.attachmentUrl || null,
      attachmentPublicId: pendingAttachment?.attachmentPublicId || null,
      attachmentFileName: pendingAttachment?.attachmentFileName || null,
      attachmentType: pendingAttachment?.attachmentType || null,
      messageId: pendingAttachment?.messageId || null,
    };

    if (socket.connected) {
      socket.emit('message:send', payload, (result) => {
        setSending(false);
        if (result?.ok) {
          setReply('');
          setPendingAttachment(null);
          if (inputRef.current) inputRef.current.style.height = 'auto';
        } else {
          toast.error(result?.message || 'Reply could not be sent.');
        }
      });
      return;
    }
    try {
      const response = await api.post('/support/conversations/message', payload);
      setMessages((current) => [...current, response.data.data.message]);
      setReply('');
      setPendingAttachment(null);
      if (inputRef.current) inputRef.current.style.height = 'auto';
    } catch { toast.error('Reply could not be sent.'); }
    finally { setSending(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, PNG, and PDF files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await api.post(`/admin/support/conversations/${selectedId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPendingAttachment(response.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload attachment.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || !selectedId) return;
    setLoadingMore(true);
    try {
      const response = await api.get(`/admin/support/conversations/${selectedId}?page=${page + 1}&limit=50`);
      const newMsgs = response.data.data.messages;
      if (newMsgs.length < 50) {
        setHasMore(false);
      }
      if (newMsgs.length > 0) {
        setMessages(current => {
          const filtered = newMsgs.filter(m => !current.some(existing => existing._id === m._id));
          return [...filtered, ...current];
        });
        setPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      toast.error('Could not load older messages.');
    } finally {
      setLoadingMore(false);
    }
  };

  const updateTicket = async (id, status) => {
    try {
      const response = await api.patch(`/admin/support/tickets/${id}`, { status });
      setTickets((current) => current.map((item) => item._id === id ? response.data.data.ticket : item));
    } catch { toast.error('Ticket could not be updated.'); }
  };

  const deleteSession = async (sessionId) => {
    setConfirmDeleteSession({ open: true, id: sessionId });
  };

  const executeDeleteSession = async (sessionId) => {
    try {
      await api.delete(`/admin/support/conversations/sessions/${sessionId}`);
      setActiveSessions((current) => current.filter((s) => s._id !== sessionId));
      setMessages((current) => current.filter((m) => m.sessionId !== sessionId));
      toast.success('Session deleted.');
    } catch { toast.error('Failed to delete session.'); }
  };

  const handleCloseSession = async (sessionId) => {
    setConfirmCloseSession({ open: true, id: sessionId });
  };

  const executeCloseSession = async (sessionId) => {
    try {
      await api.patch(`/admin/support/conversations/sessions/${sessionId}/close`);
      setActiveSessions((current) => current.map((s) => s._id === sessionId ? { ...s, closedAt: new Date(), closeReason: 'admin' } : s));
      if (selectedId) {
        const response = await api.get(`/admin/support/conversations/${selectedId}`);
        setMessages(response.data.data.messages || []);
      }
      toast.success('Session closed.');
    } catch {
      toast.error('Failed to close session.');
    }
  };

  const handleCreateSession = async (title) => {
    try {
      const response = await api.post(`/admin/support/conversations/${selectedId}/sessions`, { title });
      const newSession = response.data.data.session;
      setActiveSessions((current) => [newSession, ...current]);
      toast.success('New session created.');
    } catch {
      toast.error('Failed to create session.');
    }
  };

  const handleDeleteConversation = async () => {
    setConfirmDeleteConversationModal(true);
  };

  const executeDeleteConversation = async () => {
    try {
      await api.delete(`/admin/support/conversations/${selectedId}`);
      setConversations((current) => current.filter((c) => c._id !== selectedId));
      setSelectedId(null);
      setSelected(null);
      setMessages([]);
      setActiveSessions([]);
      toast.success('Conversation deleted.');
    } catch {
      toast.error('Failed to delete conversation.');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const sessionMap = activeSessions.reduce((map, s) => { map[s._id] = s; return map; }, {});

  const messagesBySession = [];
  let lastSessionId = null;
  for (const msg of messages) {
    const sid = msg.sessionId || '_unknown';
    if (sid !== lastSessionId) {
      messagesBySession.push({ type: 'divider', sessionId: sid, session: sessionMap[sid] || null, key: `div-${sid}-${msg._id}` });
      lastSessionId = sid;
    }
    messagesBySession.push({ type: 'message', message: msg, key: msg._id });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-2xl font-semibold">Support</h1><p className="mt-1 text-sm text-text-secondary">Live investor conversations and escalated tickets.</p></div>
        <div className="flex rounded-xl bg-white p-1 ring-1 ring-border-light" role="tablist">
          <button type="button" role="tab" aria-selected={view === 'conversations'} onClick={() => setView('conversations')} className={`rounded-lg px-3 py-2 text-sm font-medium ${view === 'conversations' ? 'bg-bg-dark text-white' : 'text-text-secondary'}`}><MessageCircle className="mr-1.5 inline" size={15} />Conversations</button>
          <button type="button" role="tab" aria-selected={view === 'tickets'} onClick={() => setView('tickets')} className={`rounded-lg px-3 py-2 text-sm font-medium ${view === 'tickets' ? 'bg-bg-dark text-white' : 'text-text-secondary'}`}><Ticket className="mr-1.5 inline" size={15} />Tickets</button>
        </div>
      </div>

      {alarmIds.size > 0 && !alarmDismissed && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl px-5 py-3 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800">
                SLA Alert — {alarmIds.size} conversation{alarmIds.size > 1 ? 's' : ''} waiting 30+ min
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Respond now to silence the alarm
              </p>
            </div>
          </div>
          <button
            onClick={() => setAlarmDismissed(true)}
            className="px-3 py-1.5 rounded-lg bg-red-200/60 text-red-700 text-xs font-semibold hover:bg-red-200 transition-all cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {view === 'conversations' ? (
        <div className="flex min-h-[620px] flex-col overflow-hidden rounded-xl bg-white ring-1 ring-border-light lg:flex-row">
          <aside className="max-h-72 w-full overflow-y-auto border-b border-border-light lg:max-h-none lg:w-80 lg:border-b-0 lg:border-r">
            <div className="border-b border-border-light px-4 py-3 text-xs font-semibold text-text-secondary">Urgent first · {conversations.length} conversations</div>
            {conversations.map((conversation) => {
              const user = conversation.user || conversation.userId;
              const ringing = Boolean(conversation.awaitingAgentSince);
              const overdue = conversation.escalationAvailable;
              return (
                <button type="button" key={conversation._id} onClick={() => openConversation(conversation._id)} className={`relative w-full border-b border-border-light px-4 py-3 text-left hover:bg-bg-light-alt focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${selectedId === conversation._id ? 'bg-bg-light-alt' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ringing ? 'animate-pulse bg-danger motion-reduce:animate-none' : conversation.unreadByAdmin ? 'bg-primary' : 'bg-slate-300'}`} />
                    <p className="truncate text-sm font-semibold">
                      {conversation.isGuest 
                        ? conversation.guestName 
                        : (user?.fullName || user?.username || 'Investor')}
                    </p>
                    {conversation.isGuest && (
                      <span className="rounded bg-slate-100 border border-slate-200 px-1 py-0.5 text-[9px] font-bold text-text-secondary">Guest</span>
                    )}
                    {overdue ? <span className="ml-auto rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">30m+</span> : null}
                  </div>
                  <p className="mt-1 truncate pl-[18px] text-xs text-text-secondary">{conversation.lastMessagePreview || 'No messages'}</p>
                  {ringing ? <span className="absolute inset-y-2 left-0 w-1 rounded-r bg-danger" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </aside>

          <section className="flex min-h-[460px] flex-1 flex-col relative">
            {selected ? <>
              <header className="border-b border-border-light px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">
                      {selected.isGuest 
                        ? `${selected.guestName} (Guest)` 
                        : ((selected.user || selected.userId)?.fullName || 'Investor')}
                    </h2>
                    {selected.isGuest ? (
                      <p className="text-xs text-text-secondary">
                        Email: {selected.guestEmail} {selected.guestPhone && `· Phone: ${selected.guestPhone}`}
                      </p>
                    ) : (
                      <p className="text-xs text-text-secondary">One conversation · {activeSessions.length} session{activeSessions.length !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPromptCreateSession(true)}
                      className="rounded-lg border border-border-light bg-white px-3 py-1.5 text-xs font-semibold text-text-main shadow-sm hover:bg-bg-light-alt transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} />
                      New Session
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConversation}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      Delete Conversation
                    </button>
                  </div>
                </div>
              </header>
              <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 space-y-3 overflow-y-auto bg-bg-light-alt px-5 py-4 relative">
                {hasMore && messages.length >= 50 && (
                  <div className="flex justify-center my-2 shrink-0">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={loadMore}
                      className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load older messages'}
                    </button>
                  </div>
                )}
                {messagesBySession.map((item) => {
                  if (item.type === 'divider') {
                    const sessionDate = item.session?.createdAt ? formatDate(item.session.createdAt) : '';
                    const isClosed = Boolean(item.session?.closedAt);
                    const closedAtStr = isClosed ? new Date(item.session.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    return (
                      <div key={item.key} className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-slate-200" />
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <span className="font-medium">{item.session?.title || 'Unknown session'}</span>
                          {sessionDate && <span>({sessionDate})</span>}
                           {isClosed && <span className="text-slate-400">— Closed {closedAtStr}</span>}
                          {!isClosed && (
                            <button
                              type="button"
                              onClick={() => handleCloseSession(item.sessionId)}
                              className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded ml-1"
                              title="Close session"
                            >
                              Close
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteSession(item.sessionId)}
                            className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer p-0.5 ml-1"
                            title="Delete session"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                    );
                  }
                  const msg = item.message;
                  const isAgent = ['admin', 'support_agent'].includes(msg?.senderRole);
                  const isInvestor = ['investor', 'guest'].includes(msg?.senderRole);
                  const senderName = isAgent ? 'Support' : (isInvestor ? 'Investor' : 'Unknown');
                  const msgIdx = messages.findIndex(m => m._id === msg._id);
                  const consecutive = msgIdx > 0 && messages[msgIdx - 1].senderRole === msg.senderRole && (new Date(msg.sentAt || msg.createdAt).getTime() - new Date(messages[msgIdx - 1].sentAt || messages[msgIdx - 1].createdAt).getTime() < 60000);
                  const isSystem = msg.body?.startsWith('[SYSTEM]');
                  const lastSentMsgId = [...messages].reverse().find(m => m.senderRole === 'admin' || m.senderRole === 'support_agent')?._id;
                  const isLastSent = msg._id === lastSentMsgId;

                  if (isSystem) {
                    return (
                      <div key={item.key} className="flex justify-center my-3 w-full animate-fade-in shrink-0">
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-medium shadow-sm border border-slate-200/50">
                          {msg.body.replace('[SYSTEM] ', '')}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={item.key} className={`flex flex-col ${consecutive ? 'mb-1.5' : 'mb-4'} ${isAgent ? 'items-end' : 'items-start'}`}>
                      {!consecutive && (
                        <span className="text-[10px] font-semibold mb-1 px-1 text-slate-500">
                          {senderName}
                        </span>
                      )}
                      <div className={`w-full flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                        <div
                          title={formatFullTimestamp(msg.sentAt || msg.createdAt)}
                          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm cursor-help ${isAgent ? 'rounded-br-sm bg-gradient-to-br from-[#001f3f] to-[#083358] text-white' : 'rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-200'}`}
                        >
                          {msg.body && <p className="whitespace-pre-wrap break-words w-fit max-w-full">{typeof msg.body === 'string' ? msg.body : String(msg.body ?? '')}</p>}
                          
                          {msg.attachmentUrl && msg.attachmentType === 'image' && (
                            <div className={`max-w-sm rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-zoom-in ${msg.body ? 'mt-2' : ''}`}>
                              <img
                                src={msg.attachmentUrl}
                                alt={msg.attachmentFileName || 'Attachment'}
                                onClick={() => setEnlargedImage(msg.attachmentUrl)}
                                className="max-h-48 w-full object-cover hover:opacity-95 transition-opacity"
                              />
                            </div>
                          )}

                          {msg.attachmentUrl && msg.attachmentType === 'document' && (
                            <a
                              href={msg.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all hover:bg-slate-50/50 ${msg.body ? 'mt-2' : ''} ${
                                isAgent
                                  ? 'bg-[#083358]/20 border-white/20 text-white hover:text-[#e2b007]'
                                  : 'bg-slate-50 border-slate-200 text-[#001f3f] hover:text-[#e2b007]'
                              }`}
                            >
                              <FileText size={16} />
                              <span className="truncate max-w-[200px]">{msg.attachmentFileName || 'Download Document'}</span>
                              <Download size={14} className="ml-auto" />
                            </a>
                          )}

                          {isAgent && isLastSent ? (
                            <time className="mt-1 block text-[10px] text-right font-medium flex items-center justify-end gap-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                              {msg.readAt ? '✓✓ Seen' : '✓ Sent'}
                            </time>
                          ) : (
                            (!consecutive || msgIdx === messages.length - 1) && (
                              <time className="mt-1 block text-[10px]" style={{ color: isAgent ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}>
                                {formatRelativeTime(msg.sentAt || msg.createdAt)}
                              </time>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex items-center gap-1.5 px-6 py-2 text-xs text-slate-400 animate-pulse shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-1 font-medium">Investor is typing...</span>
                  </div>
                )}
                <div ref={endRef} />
              </div>
              {showScrollPill && (
                <button
                  type="button"
                  onClick={() => {
                    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
                    setShowScrollPill(false);
                  }}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#083358] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg hover:bg-[#001f3f] transition-all flex items-center gap-1 cursor-pointer animate-bounce z-10"
                >
                  ↓ New message
                </button>
              )}
              <div className="flex flex-col gap-1.5 border-t border-border-light p-3 relative bg-white">
                {pendingAttachment && (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-600 mb-2 w-full animate-fade-in">
                    <div className="flex items-center gap-1.5 truncate">
                      {pendingAttachment.attachmentType === 'image' ? <ImageIcon size={14} /> : <FileText size={14} />}
                      <span className="truncate font-medium">{pendingAttachment.attachmentFileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingAttachment(null)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2 relative w-full">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || sending}
                    className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50 transition-all cursor-pointer shrink-0 mb-0.5"
                    title="Attach JPG, PNG, or PDF file"
                  >
                    {uploading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Paperclip size={18} />
                    )}
                  </button>

                  <textarea
                    ref={inputRef}
                    value={reply}
                    onChange={handleInputChange}
                    onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendReply(); } }}
                    rows={1}
                    maxLength={500}
                    aria-label="Reply"
                    placeholder="Reply to investor"
                    className="min-h-10 flex-1 resize-none rounded-xl border border-border-light px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/25 cursor-pointer max-h-24 overflow-y-auto"
                    style={{ height: 'auto' }}
                  />

                  {/* Canned response quick-reply picker */}
                  <div className="relative mb-0.5 shrink-0">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setReply((current) => (current ? current + ' ' + val : val));
                          e.target.value = ''; // reset selection
                          if (inputRef.current) {
                            setTimeout(() => {
                              inputRef.current.style.height = 'auto';
                              inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
                            }, 50);
                          }
                        }
                      }}
                      className="h-10 px-2.5 rounded-xl border border-border-light text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 outline-none cursor-pointer max-w-[125px] shrink-0"
                    >
                      <option value="">⚡ Quick Reply</option>
                      {CANNED_RESPONSES.map((res) => (
                        <option key={res.label} value={res.text}>
                          {res.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button type="button" onClick={sendReply} disabled={(!reply.trim() && !pendingAttachment) || sending || uploading} aria-label="Send reply" className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-bg-dark disabled:opacity-50 cursor-pointer shrink-0 mb-0.5"><Send size={17} /></button>
                </div>
                {reply.length > 400 && (
                  <span className="text-[10px] text-slate-400 self-end px-1 absolute bottom-0.5 right-14">
                    {reply.length}/500
                  </span>
                )}
              </div>
            </> : <div className="grid flex-1 place-items-center text-center"><div><MessageCircle className="mx-auto text-text-secondary" /><p className="mt-3 text-sm font-medium">Choose a conversation</p><p className="mt-1 text-xs text-text-secondary">Opening it clears that conversation's alarm for every agent.</p></div></div>}
          </section>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-border-light"><table className="w-full text-sm"><thead><tr className="border-b border-border-light text-left text-xs text-text-secondary"><th className="px-4 py-3">Investor</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-border-light">{tickets.map((ticket) => <tr key={ticket._id}><td className="px-4 py-3 font-medium">{ticket.userId?.fullName || ticket.userId?.username || 'Investor'}</td><td className="px-4 py-3">{ticket.subject}</td><td className="px-4 py-3 text-text-secondary">{new Date(ticket.createdAt).toLocaleDateString()}</td><td className="px-4 py-3"><select value={ticket.status} onChange={(event) => updateTicket(ticket._id, event.target.value)} className={`rounded-lg border-0 px-2 py-1 text-xs font-semibold ${STATUS[ticket.status]?.[1]}`}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></td></tr>)}</tbody></table></div>
      )}

      {/* Lightbox Overlay */}
      {enlargedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={enlargedImage}
              alt="Enlarged screenshot"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 font-bold text-sm bg-black/40 px-3 py-1.5 rounded-full cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDeleteSession.open}
        onClose={() => setConfirmDeleteSession({ open: false, id: null })}
        onConfirm={() => { executeDeleteSession(confirmDeleteSession.id); setConfirmDeleteSession({ open: false, id: null }); }}
        title="Delete Session"
        message="Delete this session and all its messages?"
        variant="danger"
      />

      <ConfirmModal
        isOpen={confirmCloseSession.open}
        onClose={() => setConfirmCloseSession({ open: false, id: null })}
        onConfirm={() => { executeCloseSession(confirmCloseSession.id); setConfirmCloseSession({ open: false, id: null }); }}
        title="Close Session"
        message="Are you sure you want to close this session?"
        variant="warning"
      />

      <ConfirmModal
        isOpen={confirmDeleteConversationModal}
        onClose={() => setConfirmDeleteConversationModal(false)}
        onConfirm={() => { executeDeleteConversation(); setConfirmDeleteConversationModal(false); }}
        title="Delete Conversation"
        message="Are you sure you want to delete this ENTIRE conversation, including all its sessions and messages? This action is irreversible."
        variant="danger"
      />

      <PromptModal
        isOpen={promptCreateSession}
        onClose={() => setPromptCreateSession(false)}
        onSubmit={(title) => { handleCreateSession(title); setPromptCreateSession(false); }}
        title="New Session"
        message="Enter a title for the new session (optional):"
        placeholder="Session title..."
      />
    </div>
  );
};

export default AdminSupportPage;

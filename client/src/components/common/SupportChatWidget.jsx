import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Headphones, Send, X, Plus, Trash2, ChevronDown, RefreshCw, Paperclip, FileText, Image as ImageIcon, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { connectSocket, getSocket } from '../../services/socketService';
import { formatRelativeTime, formatFullTimestamp } from '../../utils/date';
import { triggerTabFlash } from '../../utils/browser';

const POLL_MS = 10000;

const SupportChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [connectionState, setConnectionState] = useState('connecting');
  const [sending, setSending] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollPill, setShowScrollPill] = useState(false);
  const [agentsOnline, setAgentsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Attachments State
  const [uploading, setUploading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);

  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);
  const openRef = useRef(false);
  const typingTimeoutRef = useRef(null);

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
    setBody(el.value);
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;

    // Typing start emit
    const socket = getSocket();
    if (socket?.connected && conversation?._id) {
      socket.emit('typing:start', { conversationId: conversation._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { conversationId: conversation._id });
      }, 3000);
    }
  };

  const activeSessionIdRef = useRef(activeSessionId);
  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);

  const loadConversation = useCallback(async (markRead = false) => {
    const response = await api.get(`/support/conversations/me${markRead ? '?opened=true' : ''}`);
    const data = response.data.data;
    setConversation(data.conversation);
    setSessions(data.sessions || []);
    setActiveSessionId(data.activeSessionId);
    setMessages(data.messages || []);
  }, []);

  const loadSession = useCallback(async (sessionId) => {
    const response = await api.get(`/support/conversations/sessions/${sessionId}/messages`);
    setActiveSessionId(sessionId);
    setMessages(response.data.data.messages || []);
    setShowSessions(false);
  }, []);

  useEffect(() => {
    loadConversation(false).catch(() => {});
    const socket = connectSocket();
    const onConnect = () => setConnectionState('connected');
    const onDisconnect = () => setConnectionState('offline');
    const onReconnectAttempt = () => setConnectionState('reconnecting');
    const onConnectError = () => setConnectionState('offline');

    const onMessage = (data) => {
      const msg = data?.message || data;
      if (!msg || !msg._id) return;
      const nextConversation = data?.conversation;
      const sessionId = data?.sessionId || msg?.sessionId;
      const currentActiveId = activeSessionIdRef.current || activeSessionId;
      const isMatchingSession = !sessionId || !currentActiveId || String(sessionId) === String(currentActiveId);
      if (openRef.current && isMatchingSession) {
        setMessages((current) => current.some((item) => item._id === msg._id) ? current : [...current, msg]);
        // Emit read receipt back in real-time
        if (socket?.connected && (nextConversation?._id || msg.conversationId)) {
          socket.emit('conversation:read', { conversationId: nextConversation?._id || msg.conversationId });
        }
      }
      if (nextConversation) setConversation(nextConversation);
      if (msg.senderRole !== 'investor' && !openRef.current) {
        setConversation((current) => current ? { ...current, unreadByUser: true } : current);
      }
      if (msg.senderRole !== 'investor') {
        triggerTabFlash('New message from Support');
      }
    };

    const onRead = ({ readerRole, readAt }) => {
      const targetRole = readerRole === 'investor' ? ['admin', 'support_agent'] : ['investor'];
      setMessages((current) => current.map((msg) => {
        if (targetRole.includes(msg.senderRole) && !msg.readAt) {
          return { ...msg, readAt };
        }
        return msg;
      }));
    };

    const onTypingStart = ({ senderRole }) => {
      if (senderRole !== 'investor') setIsTyping(true);
    };

    const onTypingStop = ({ senderRole }) => {
      if (senderRole !== 'investor') setIsTyping(false);
    };

    const onAgentsStatus = ({ online }) => {
      setAgentsOnline(online);
    };

    const onNewSession = ({ session }) => {
      if (session) {
        setSessions((current) => {
          if (current.some((s) => String(s._id) === String(session._id))) return current;
          return [session, ...current];
        });
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('connect_error', onConnectError);
    socket.on('message:new', onMessage);
    socket.on('session:new', onNewSession);
    socket.on('conversation:read', onRead);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('agents:status', onAgentsStatus);

    if (socket.connected) {
      setConnectionState('connected');
    } else {
      setConnectionState('connecting');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('connect_error', onConnectError);
      socket.off('message:new', onMessage);
      socket.off('session:new', onNewSession);
      socket.off('conversation:read', onRead);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('agents:status', onAgentsStatus);
    };
  }, [loadConversation, activeSessionId]);

  // Read message emitter when widget opens or session changes
  useEffect(() => {
    const socket = getSocket();
    if (socket?.connected && conversation?._id && open) {
      socket.emit('conversation:read', { conversationId: conversation._id });
    }
  }, [conversation?._id, activeSessionId, open]);

  // Reset pagination on session switch
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [activeSessionId]);

  useEffect(() => {
    if (connectionState === 'connected') return undefined;
    const poll = window.setInterval(() => loadConversation(openRef.current).catch(() => {}), POLL_MS);
    return () => window.clearInterval(poll);
  }, [connectionState, loadConversation]);

  useEffect(() => {
    if (open) {
      setLoadError(false);
      loadConversation(true).catch(() => {
        setLoadError(true);
        toast.error('Could not load support chat.');
      });
    }
  }, [open, loadConversation]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const lastMsg = messages[messages.length - 1];
    const sentByMe = lastMsg && lastMsg.senderRole === 'investor';

    if (isNearBottom || sentByMe) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      setShowScrollPill(false);
    } else {
      setShowScrollPill(true);
    }
  }, [messages]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
    setIsNearBottom(true);
    setShowScrollPill(false);
  }, [activeSessionId, open]);

  const createNewSession = async () => {
    try {
      const response = await api.post('/support/conversations/sessions', {});
      const newSession = response.data.data.session;
      setSessions((current) => [newSession, ...current]);
      setActiveSessionId(newSession._id);
      setMessages([]);
      setShowSessions(false);
    } catch {
      toast.error('Could not create session.');
    }
  };

  const handleDeleteConversation = async () => {
    if (!window.confirm('Are you sure you want to delete your entire chat history? This action is irreversible.')) return;
    try {
      await api.delete('/support/conversations');
      setConversation(null);
      setSessions([]);
      setMessages([]);
      setActiveSessionId(null);
      toast.success('Chat history cleared.');
      await createNewSession();
    } catch {
      toast.error('Failed to delete chat history.');
    }
  };

  const closeSession = async (sessionId) => {
    try {
      const response = await api.patch(`/support/conversations/sessions/${sessionId}/close`, { reason: 'user_close' });
      const closedSession = response.data.data.session;
      setSessions((current) => current.map((s) => s._id === sessionId ? closedSession : s));
      toast.success('Session closed.');
    } catch {
      toast.error('Could not close session.');
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Delete this session and all its messages?')) return;
    try {
      await api.delete(`/support/conversations/sessions/${sessionId}`);
      setSessions((current) => current.filter((s) => s._id !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s._id !== sessionId);
        if (remaining.length > 0) {
          loadSession(remaining[0]._id);
        } else {
          createNewSession();
        }
      }
    } catch {
      toast.error('Could not delete session.');
    }
  };

  const send = async () => {
    const trimmed = body.trim();
    if ((!trimmed && !pendingAttachment) || sending) return;
    setSending(true);

    const socket = getSocket();
    if (socket?.connected && conversation?._id) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit('typing:stop', { conversationId: conversation._id });
    }

    const payload = {
      body: trimmed,
      sessionId: activeSessionId,
      attachmentUrl: pendingAttachment?.attachmentUrl || null,
      attachmentPublicId: pendingAttachment?.attachmentPublicId || null,
      attachmentFileName: pendingAttachment?.attachmentFileName || null,
      attachmentType: pendingAttachment?.attachmentType || null,
      messageId: pendingAttachment?.messageId || null,
    };

    if (socket.connected) {
      socket.emit('message:send', payload, (result) => {
        setSending(false);
        if (!result?.ok) return toast.error(result?.message || 'Message could not be sent.');
        setBody('');
        setPendingAttachment(null);
        if (inputRef.current) inputRef.current.style.height = 'auto';
      });
      return;
    }
    try {
      const response = await api.post('/support/conversations/message', payload);
      const result = response.data.data;
      setMessages((current) => [...current, result.message]);
      setConversation(result.conversation);
      setBody('');
      setPendingAttachment(null);
      if (inputRef.current) inputRef.current.style.height = 'auto';
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Message could not be sent.');
    } finally { setSending(false); }
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
      const response = await api.post('/support/conversations/upload', formData, {
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
    if (loadingMore || !hasMore || !activeSessionId) return;
    setLoadingMore(true);
    try {
      const response = await api.get(`/support/conversations/sessions/${activeSessionId}/messages?page=${page + 1}&limit=50`);
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

  const escalate = async () => {
    if (!conversation?._id || escalating) return;
    setEscalating(true);
    try {
      await api.post('/support/tickets/escalate', {
        conversationId: conversation._id,
        subject: 'Live chat response overdue',
      });
      toast.success('Support ticket created.');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Ticket could not be created.');
    } finally { setEscalating(false); }
  };

  const activeSessionTitle = sessions.find((s) => s._id === activeSessionId)?.title || 'New conversation';

  const handleRetry = async () => {
    setLoadError(false);
    try {
      await loadConversation(true);
    } catch {
      setLoadError(true);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      {open ? (
        <>
          <section aria-label="Talk to Agent" className="flex h-[min(640px,calc(100vh-2.5rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-xl relative">
          <header className="flex items-center justify-between bg-bg-dark px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-bg-dark"><Headphones size={18} /></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold">Talk to Agent</h2>
                  <span
                    title={
                      connectionState === 'connected'
                        ? agentsOnline ? 'Support Online' : 'Support Away'
                        : 'Offline'
                    }
                    className={`w-2 h-2 rounded-full inline-block ${
                      connectionState === 'connected'
                        ? agentsOnline ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400'
                        : connectionState === 'offline' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowSessions(!showSessions)}
                    className="text-xs text-white/60 hover:text-white/80 truncate max-w-[180px] cursor-pointer"
                  >
                    {activeSessionTitle}
                  </button>
                  <ChevronDown size={12} className={`text-white/40 transition-transform ${showSessions ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDeleteConversation}
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-red-400 transition-colors cursor-pointer"
                title="Delete chat history"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={createNewSession}
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="New session"
              >
                <Plus size={16} />
              </button>
              <button type="button" aria-label="Close support chat" onClick={() => setOpen(false)} className="rounded-lg p-2 text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"><X size={18} /></button>
            </div>
          </header>

          {/* Session list dropdown */}
          {showSessions && (
            <div className="border-b border-border-light bg-bg-light-alt max-h-40 overflow-y-auto">
              {sessions.map((session) => {
                const isClosed = Boolean(session.closedAt);
                return (
                  <div
                    key={session._id}
                    className={`flex items-center gap-2 px-4 py-2 border-b border-border-light last:border-0 cursor-pointer hover:bg-bg-light-alt ${session._id === activeSessionId ? 'bg-blue-50' : ''}`}
                    onClick={() => !isClosed && loadSession(session._id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isClosed ? 'text-slate-400 line-through' : 'text-text-light-bg'}`}>{session.title}</p>
                      {isClosed && <p className="text-[10px] text-slate-400">Closed</p>}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteSession(session._id); }}
                      className="text-text-secondary hover:text-red-500 transition-colors cursor-pointer p-1"
                      aria-label="Delete session"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {conversation?.escalationAvailable ? (
            <div className="m-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-200" role="status">
              <div className="flex gap-2"><AlertCircle className="mt-0.5 shrink-0" size={17} /><p>Our team hasn't replied yet — create a support ticket and we'll follow up.</p></div>
              <button type="button" disabled={escalating} onClick={escalate} className="mt-3 rounded-lg bg-bg-dark px-3 py-2 text-xs font-semibold text-white hover:bg-surface-dark disabled:opacity-50 cursor-pointer">{escalating ? 'Creating...' : 'Create support ticket'}</button>
            </div>
          ) : null}

          <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 space-y-3 overflow-y-auto bg-bg-light-alt px-4 py-4" aria-live="polite">
            {loadError ? (
              <div className="mx-auto mt-12 max-w-[28ch] text-center">
                <AlertCircle className="mx-auto text-red-400" size={32} />
                <p className="mt-3 text-sm font-medium text-slate-700">Unable to load chat</p>
                <p className="mt-1 text-xs text-slate-500">Check your connection and try again.</p>
                <button type="button" onClick={handleRetry} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-bg-dark px-3 py-2 text-xs font-semibold text-white hover:bg-surface-dark cursor-pointer">
                  <RefreshCw size={13} /> Retry
                </button>
              </div>
            ) : messages.length === 0 ? <div className="mx-auto mt-12 max-w-[28ch] text-center"><Headphones className="mx-auto text-text-secondary" /><p className="mt-3 text-sm font-medium">How can we help?</p><p className="mt-1 text-xs text-text-secondary">Send a message and it will stay in this session.</p></div> : null}
             {hasMore && messages.length >= 50 && (
               <div className="flex justify-center my-2 shrink-0">
                 <button
                   type="button"
                   disabled={loadingMore}
                   onClick={loadMore}
                   className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded-md font-semibold transition-all cursor-pointer disabled:opacity-50"
                 >
                   {loadingMore ? 'Loading...' : 'Load older messages'}
                 </button>
               </div>
             )}

             {messages.map((message, idx) => {
              const mine = message.senderRole === 'investor';
              const isAgent = ['admin', 'support_agent'].includes(message.senderRole);
              const senderLabel = mine ? 'You' : (isAgent ? 'Support' : 'Unknown');
              const consecutive = idx > 0 && messages[idx - 1].senderRole === message.senderRole && (new Date(message.sentAt || message.createdAt).getTime() - new Date(messages[idx - 1].sentAt || messages[idx - 1].createdAt).getTime() < 60000);
              const isSystem = message.body?.startsWith('[SYSTEM]');
              const lastSentMsgId = [...messages].reverse().find(m => m.senderRole === 'investor')?._id;
              const isLastSent = message._id === lastSentMsgId;

              if (isSystem) {
                return (
                  <div key={message._id} className="flex justify-center my-2.5 w-full animate-fade-in shrink-0">
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-full font-medium shadow-sm border border-slate-200/50">
                      {message.body.replace('[SYSTEM] ', '')}
                    </span>
                  </div>
                );
              }

              return (
                <div key={message._id} className={`flex flex-col ${consecutive ? 'mb-1.5' : 'mb-4'} ${mine ? 'items-end' : 'items-start'}`}>
                  {!consecutive && (
                    <span className={`text-[10px] font-semibold mb-1 px-1 ${mine ? 'text-right text-slate-500' : 'text-left text-slate-500'}`}>
                      {senderLabel}
                    </span>
                  )}
                  <div className={`w-full flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      title={formatFullTimestamp(message.sentAt || message.createdAt)}
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm cursor-help ${mine ? 'rounded-br-sm bg-gradient-to-br from-[#001f3f] to-[#083358] text-white' : 'rounded-bl-sm bg-white text-text-light-bg ring-1 ring-slate-200'}`}
                    >
                      {message.body && <p className="whitespace-pre-wrap break-words w-fit max-w-full">{typeof message.body === 'string' ? message.body : String(message.body ?? '')}</p>}
                      
                      {message.attachmentUrl && message.attachmentType === 'image' && (
                        <div className={`max-w-xs rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-zoom-in ${message.body ? 'mt-2' : ''}`}>
                          <img
                            src={message.attachmentUrl}
                            alt={message.attachmentFileName || 'Attachment'}
                            onClick={() => setEnlargedImage(message.attachmentUrl)}
                            className="max-h-36 w-full object-cover hover:opacity-95 transition-opacity"
                          />
                        </div>
                      )}

                      {message.attachmentUrl && message.attachmentType === 'document' && (
                        <a
                          href={message.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all hover:bg-slate-50/50 ${message.body ? 'mt-2' : ''} ${
                            mine
                              ? 'bg-[#083358]/20 border-white/20 text-white hover:text-[#e2b007]'
                              : 'bg-slate-50 border-slate-200 text-[#001f3f] hover:text-[#e2b007]'
                          }`}
                        >
                          <FileText size={14} />
                          <span className="truncate max-w-[140px]">{message.attachmentFileName || 'Download Document'}</span>
                          <Download size={12} className="ml-auto" />
                        </a>
                      )}

                      {mine && isLastSent ? (
                        <span className="text-[9px] text-white/75 mt-1 flex items-center justify-end gap-0.5 font-medium">
                          {message.readAt ? '✓✓ Seen' : '✓ Sent'}
                        </span>
                      ) : (
                        (!consecutive || idx === messages.length - 1) && (
                          <time className="mt-1 block text-[10px]" style={{ color: mine ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}>
                            {formatRelativeTime(message.sentAt || message.createdAt)}
                          </time>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-slate-400 animate-pulse shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-1 font-medium">Support is typing...</span>
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
              className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#083358] text-white px-4 py-1.5 rounded-full text-[11px] font-semibold shadow-lg hover:bg-[#001f3f] transition-all flex items-center gap-1 cursor-pointer animate-bounce z-10"
            >
              ↓ New message
            </button>
          )}

          <div className="flex flex-col border-t border-border-light bg-white p-3 relative">
            {pendingAttachment && (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-[11px] text-slate-600 mb-2 w-full animate-fade-in">
                <div className="flex items-center gap-1 truncate">
                  {pendingAttachment.attachmentType === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                  <span className="truncate font-medium">{pendingAttachment.attachmentFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingAttachment(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 w-full">
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
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Paperclip size={16} />
                )}
              </button>

              <textarea
                ref={inputRef}
                value={body}
                onChange={handleInputChange}
                onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }}
                rows={1}
                maxLength={500}
                placeholder="Type your message"
                aria-label="Message"
                className="min-h-10 flex-1 resize-none rounded-xl border border-border-light px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/25 cursor-pointer max-h-24 overflow-y-auto"
                style={{ height: 'auto' }}
              />
              <button type="button" aria-label="Send message" disabled={(!body.trim() && !pendingAttachment) || sending || uploading} onClick={send} className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-bg-dark hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 cursor-pointer shrink-0 mb-0.5"><Send size={17} /></button>
            </div>
            {body.length > 400 && (
              <span className="text-[10px] text-slate-400 self-end px-1 absolute bottom-0.5 right-14">
                {body.length}/500
              </span>
            )}
          </div>
          </section>

          {/* Lightbox Overlay */}
          {enlargedImage && (
            <div
              className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
              onClick={() => setEnlargedImage(null)}
            >
              <div className="relative max-w-full max-h-full">
                <img
                  src={enlargedImage}
                  alt="Enlarged screenshot"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
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
        </>
      ) : (
        <button type="button" onClick={() => setOpen(true)} aria-label="Talk to Agent" className="relative grid h-14 w-14 place-items-center rounded-full bg-primary text-bg-dark shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/30 motion-reduce:transform-none cursor-pointer">
          <Headphones size={23} />
          {conversation?.unreadByUser ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">1</span> : null}
        </button>
      )}
    </div>
  );
};

export default SupportChatWidget;

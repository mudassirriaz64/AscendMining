import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageCircle, Send, Check, ChevronLeft, Calendar, LogOut, Paperclip, FileText, Image as ImageIcon, Download, Loader2, X, AlertCircle, Plus, Trash2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/common/Header';
import PageSkeleton from '../../components/common/PageSkeleton';
import {
  fetchMyConversation,
  fetchSessionMessages,
  createSession,
  deleteSession,
  sendMessageREST,
  escalateConversation,
  appendMessage,
  setActiveSession,
  markMessagesRead,
  prependMessages,
} from '../../store/slices/supportChatSlice';
import api from '../../services/api';
import { connectSocket, getSocket } from '../../services/socketService';
import { formatRelativeTime, formatFullTimestamp } from '../../utils/date';
import { triggerTabFlash } from '../../utils/browser';

const SupportChatPage = () => {
  const dispatch = useDispatch();
  const {
    conversation,
    sessions,
    activeSessionId,
    messages,
    escalationAvailable,
    loading,
  } = useSelector((s) => s.supportChat);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connectionState, setConnectionState] = useState('connecting');
  const [escalating, setEscalating] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
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
    setInput(el.value);
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;

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

  useEffect(() => {
    dispatch(fetchMyConversation());
  }, [dispatch]);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => setConnectionState('connected');
    const onDisconnect = () => setConnectionState('offline');
    const onReconnectAttempt = () => setConnectionState('reconnecting');
    const onConnectError = () => setConnectionState('offline');

    const onMessage = (data) => {
      const msg = data?.message || data;
      if (!msg || !msg._id) return;
      const sessionId = data?.sessionId || msg?.sessionId;
      if (sessionId && activeSessionId && String(sessionId) !== String(activeSessionId)) return;
      dispatch(appendMessage(data));
      if (msg.senderRole !== 'investor') {
        triggerTabFlash('New message from Support');
        // Real-time mark read if tab/widget is actively open
        if (socket?.connected && (conversation?._id || msg.conversationId)) {
          socket.emit('conversation:read', { conversationId: conversation?._id || msg.conversationId });
        }
      }
    };

    const onRead = (data) => {
      dispatch(markMessagesRead(data));
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

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('connect_error', onConnectError);
    socket.on('message:new', onMessage);
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
      socket.off('conversation:read', onRead);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('agents:status', onAgentsStatus);
    };
  }, [dispatch, activeSessionId, conversation?._id]);

  // Read message emitter when conversation opens/switches
  useEffect(() => {
    const socket = getSocket();
    if (socket?.connected && conversation?._id) {
      socket.emit('conversation:read', { conversationId: conversation._id });
    }
  }, [conversation?._id, activeSessionId]);

  // Reset pagination on session switch
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [activeSessionId]);

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
  }, [activeSessionId]);

  const switchSession = useCallback((sessionId) => {
    dispatch(setActiveSession(sessionId));
    dispatch(fetchSessionMessages({ sessionId }));
    setShowSidebar(false);
  }, [dispatch]);

  const handleNewSession = useCallback(async () => {
    try {
      const session = await dispatch(createSession()).unwrap();
      dispatch(setActiveSession(session._id));
      toast.success('New session started.');
    } catch (err) {
      toast.error(err || 'Failed to create session.');
    }
  }, [dispatch]);

  const handleDeleteSession = useCallback(async (sessionId) => {
    if (!window.confirm('Delete this session and all its messages?')) return;
    try {
      await dispatch(deleteSession({ sessionId })).unwrap();
      toast.success('Session deleted.');
    } catch (err) {
      toast.error(err || 'Failed to delete session.');
    }
  }, [dispatch]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
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

    if (socket?.connected) {
      socket.emit('message:send', payload, (result) => {
        setSending(false);
        if (!result?.ok) return toast.error(result?.message || 'Message could not be sent.');
        setInput('');
        setPendingAttachment(null);
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
        }
      });
      return;
    }

    try {
      await dispatch(sendMessageREST(payload)).unwrap();
      setInput('');
      setPendingAttachment(null);
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    } catch (err) {
      toast.error(err || 'Failed to send message.');
    } finally {
      setSending(false);
    }
    inputRef.current?.focus();
  }, [input, pendingAttachment, sending, dispatch, activeSessionId, conversation?._id]);

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
        dispatch(prependMessages({ messages: newMsgs }));
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

  const renderConnectionBadge = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        );
      case 'reconnecting':
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Reconnecting...
          </span>
        );
      case 'offline':
        return (
          <span className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Offline
          </span>
        );
      case 'connecting':
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Connecting...
          </span>
        );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEscalate = useCallback(async () => {
    if (!conversation?._id || escalating) return;
    setEscalating(true);
    try {
      await dispatch(escalateConversation({
        conversationId: conversation._id,
        subject: 'Live chat response overdue',
      })).unwrap();
      toast.success('Support ticket created.');
    } catch (err) {
      toast.error(err || 'Failed to create ticket.');
    } finally {
      setEscalating(false);
    }
  }, [conversation, escalating, dispatch]);

  const formatTime = (date) =>
    date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

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

  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = formatDate(msg.sentAt || msg.createdAt);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  if (loading && !conversation) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans">
      <Header />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#001f3f] flex items-center gap-2">
              <MessageCircle size={26} className="text-[#083358]" />
              Support Chat
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {agentsOnline ? 'Support agents are online. We reply within 30 minutes.' : 'Support is away. We typically reply within 30 minutes.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {renderConnectionBadge()}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col overflow-hidden relative" style={{ height: '68vh' }}>
          <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-[#001f3f] to-[#083358] flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight size={18} className={`transition-transform ${showSidebar ? 'rotate-90' : ''}`} />
            </button>
            <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center text-[#001f3f] font-bold text-sm">
              S
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">AscendX Support</p>
              <p className="text-white/60 text-xs">
                Session {sessions.findIndex((s) => s._id === activeSessionId) + 1} of {sessions.length}
              </p>
            </div>
            <button
              type="button"
              onClick={handleNewSession}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} /> New Session
            </button>
          </div>

          {/* Session Sidebar */}
          {showSidebar && (
            <div className="border-b border-slate-100 bg-slate-50 max-h-48 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className={`flex items-center gap-3 px-5 py-2.5 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-100 transition-colors ${session._id === activeSessionId ? 'bg-blue-50' : ''}`}
                  onClick={() => switchSession(session._id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{session.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(session.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(session._id); }}
                    className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer p-1"
                    aria-label="Delete session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {escalationAvailable && (
            <div className="mx-4 mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-200" role="status">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 shrink-0" size={17} />
                <p>Our team hasn't replied yet — create a support ticket and we'll follow up.</p>
              </div>
              <button
                type="button"
                disabled={escalating}
                onClick={handleEscalate}
                className="mt-3 rounded-lg bg-[#001f3f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#083358] disabled:opacity-50 cursor-pointer"
              >
                {escalating ? 'Creating...' : 'Create support ticket'}
              </button>
            </div>
          )}

          <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 relative">
            {hasMore && messages.length >= 50 && (
              <div className="flex justify-center my-2">
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

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <MessageCircle size={28} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No messages yet</p>
                <p className="text-slate-400 text-sm mt-1">Start the conversation below.</p>
              </div>
            )}

            {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs text-slate-400 font-medium px-2">{dateLabel}</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {msgs.map((msg, idx) => {
                  const isMe = msg.senderRole === 'investor';
                  const isAgent = ['admin', 'support_agent'].includes(msg.senderRole);
                  const senderLabel = isMe ? 'You' : (isAgent ? 'Support' : 'Unknown');
                  const consecutive = idx > 0 && msgs[idx - 1].senderRole === msg.senderRole && (new Date(msg.sentAt || msg.createdAt).getTime() - new Date(msgs[idx - 1].sentAt || msgs[idx - 1].createdAt).getTime() < 60000);
                  const isSystem = msg.body?.startsWith('[SYSTEM]');
                  const lastSentMsgId = [...messages].reverse().find(m => m.senderRole === 'investor')?._id;
                  const isLastSent = msg._id === lastSentMsgId;

                  if (isSystem) {
                    return (
                      <div key={msg._id} className="flex justify-center my-3 w-full animate-fade-in">
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-medium shadow-sm border border-slate-200/50">
                          {msg.body.replace('[SYSTEM] ', '')}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg._id} className={`flex flex-col ${consecutive ? 'mb-1.5' : 'mb-4'} ${isMe ? 'items-end' : 'items-start'}`}>
                      {!consecutive && (
                        <span className={`text-[10px] font-semibold mb-1 px-1 ${isMe ? 'text-right text-slate-500' : 'text-left text-slate-500'}`}>
                          {senderLabel}
                        </span>
                      )}
                      <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          consecutive ? (
                            <div className="w-7 mr-2 flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#001f3f] to-[#083358] flex items-center justify-center text-white text-xs font-bold mr-2 mt-auto mb-0.5 flex-shrink-0">
                              S
                            </div>
                          )
                        )}
                        <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div
                            title={formatFullTimestamp(msg.sentAt || msg.createdAt)}
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words w-fit max-w-full cursor-help ${
                              isMe
                                ? 'bg-gradient-to-br from-[#001f3f] to-[#083358] text-white rounded-br-sm'
                                : 'bg-white text-slate-800 rounded-bl-sm ring-1 ring-slate-200'
                            }`}
                          >
                            {msg.body && <p className="whitespace-pre-wrap">{typeof msg.body === 'string' ? msg.body : String(msg.body ?? '')}</p>}
                            
                            {msg.attachmentUrl && msg.attachmentType === 'image' && (
                              <div className={`max-w-sm rounded-lg overflow-hidden border border-slate-200/50 shadow-sm cursor-zoom-in ${msg.body ? 'mt-2' : ''}`}>
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
                                  isMe
                                    ? 'bg-[#083358]/20 border-white/20 text-white hover:text-[#e2b007]'
                                    : 'bg-slate-50 border-slate-200 text-[#001f3f] hover:text-[#e2b007]'
                                }`}
                              >
                                <FileText size={16} />
                                <span className="truncate max-w-[200px]">{msg.attachmentFileName || 'Download Document'}</span>
                                <Download size={14} className="ml-auto" />
                              </a>
                            )}
                          </div>
                          {isMe && isLastSent ? (
                            <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-0.5 font-medium" title={formatFullTimestamp(msg.sentAt || msg.createdAt)}>
                              {msg.readAt ? '✓✓ Seen' : '✓ Sent'}
                            </span>
                          ) : (
                            (!consecutive || idx === msgs.length - 1) && (
                              <span className="text-[10px] text-slate-400 mt-1 px-1" title={formatFullTimestamp(msg.sentAt || msg.createdAt)}>
                                {formatRelativeTime(msg.sentAt || msg.createdAt)}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-1.5 px-6 py-2 text-xs text-slate-400 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-1 font-medium">Support is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
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

          <div className="border-t border-slate-100 p-4 bg-white flex flex-col relative">
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
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message...  (Enter to send)"
                rows={1}
                maxLength={500}
                className="flex-1 resize-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#083358] focus:ring-2 focus:ring-[#083358]/15 transition-all placeholder-slate-400 max-h-32 overflow-y-auto animate-fade-in"
                style={{ minHeight: '40px', height: 'auto' }}
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !pendingAttachment) || sending || uploading}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#001f3f] to-[#083358] text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0 mb-1"
              >
                <Send size={16} />
              </button>
            </div>
            {input.length > 400 && (
              <span className="text-[10px] text-slate-400 self-end px-1 absolute bottom-1.5 right-16">
                {input.length}/500
              </span>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default SupportChatPage;

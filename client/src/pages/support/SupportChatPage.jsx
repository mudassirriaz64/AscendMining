import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Send, MessageCircle, Plus, X, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/common/Header';
import PageSkeleton from '../../components/common/PageSkeleton';
import {
  fetchActiveSession,
  fetchMySessions,
  fetchSessionMessages,
  startNewSession,
  closeSession,
  sendMessageREST,
  appendSessionMessage,
  setActiveSocketSession,
  markSessionClosed,
} from '../../store/slices/supportChatSlice';
import { connectSocket, getSocket } from '../../services/socketService';

const STATUS_BADGE = {
  open: { label: 'Open', color: 'bg-emerald-100 text-emerald-700', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-slate-100 text-slate-500', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-500', icon: X },
};

const SupportChatPage = () => {
  const dispatch = useDispatch();
  const {
    sessions,
    activeSession,
    activeSessionId,
    sessionMessages,
    loading,
  } = useSelector((s) => s.supportChat);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Load sessions on mount ────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchMySessions());
    dispatch(fetchActiveSession());
  }, [dispatch]);

  // ── Connect socket ────────────────────────────────────────────────────────
  useEffect(() => {
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };
    const token = getCookie('accessToken');
    if (!token) return;

    const socket = connectSocket(token);

    socket.on('connect', () => setSocketReady(true));
    socket.on('disconnect', () => setSocketReady(false));

    socket.on('active_session', ({ session }) => {
      dispatch(setActiveSocketSession({ session }));
    });

    socket.on('new_message', ({ message, sessionId }) => {
      if (sessionId) {
        dispatch(appendSessionMessage({ message }));
      }
    });

    socket.on('session_started', ({ session }) => {
      dispatch(setActiveSocketSession({ session }));
    });

    socket.on('session_closed', ({ sessionId }) => {
      dispatch(markSessionClosed({ sessionId }));
    });

    socket.on('error', ({ message }) => {
      toast.error(message || 'Socket error.');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('active_session');
      socket.off('new_message');
      socket.off('session_started');
      socket.off('session_closed');
      socket.off('error');
    };
  }, [dispatch]);

  // ── Auto scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages]);

  // ── Select a session ──────────────────────────────────────────────────────
  const handleSelectSession = (sessionId) => {
    dispatch(fetchSessionMessages(sessionId));
  };

  // ── Start new session ─────────────────────────────────────────────────────
  const handleNewSession = async () => {
    try {
      await dispatch(startNewSession()).unwrap();
      toast.success('New chat started!');
    } catch (err) {
      toast.error(err || 'Failed to start new chat.');
    }
  };

  // ── Close session ─────────────────────────────────────────────────────────
  const handleCloseSession = async () => {
    if (!activeSessionId) return;
    try {
      await dispatch(closeSession(activeSessionId)).unwrap();
      toast.success('Chat session closed.');
    } catch (err) {
      toast.error(err || 'Failed to close session.');
    }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);

    const socket = getSocket();
    if (socket?.connected && activeSessionId) {
      socket.emit('send_message', { body: trimmed, sessionId: activeSessionId });
      setInput('');
      setSending(false);
    } else {
      try {
        await dispatch(sendMessageREST({ body: trimmed, sessionId: activeSessionId })).unwrap();
        setInput('');
      } catch (err) {
        toast.error(err || 'Failed to send message.');
      } finally {
        setSending(false);
      }
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const formatSessionDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Group messages by date
  const groupedMessages = sessionMessages.reduce((groups, msg) => {
    const dateKey = formatDate(msg.sentAt || msg.createdAt);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  if (loading && sessions.length === 0) return <PageSkeleton />;

  const isActiveSessionOpen = activeSession?.isActive && activeSession?.status === 'open';

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans">
      <Header />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#001f3f] flex items-center gap-2">
              <MessageCircle size={26} className="text-[#083358]" />
              Support Chat
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Our support team typically responds within 30 minutes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${socketReady ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
            />
            <span className="text-xs text-slate-500 font-medium">
              {socketReady ? 'Live' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex overflow-hidden" style={{ height: '68vh' }}>

          {/* ── Left sidebar: Session list ──────────────────────────────── */}
          <div className="w-72 flex-shrink-0 border-r border-slate-100 flex flex-col">
            {/* Header + New Chat button */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#001f3f]">Chats</p>
                <p className="text-xs text-slate-400">{sessions.length} conversation{sessions.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={handleNewSession}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#001f3f] to-[#083358] text-white flex items-center justify-center hover:opacity-90 transition-all cursor-pointer"
                title="New Chat"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle size={20} className="text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400">No conversations yet.</p>
                  <p className="text-xs text-slate-300 mt-1">Start a new chat below.</p>
                </div>
              ) : (
                sessions.map((session) => {
                  const badge = STATUS_BADGE[session.status] || STATUS_BADGE.open;
                  const isActive = session._id === activeSessionId;
                  return (
                    <button
                      key={session._id}
                      onClick={() => handleSelectSession(session._id)}
                      className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 ${
                        isActive ? 'bg-blue-50/60 border-l-[3px] border-l-[#083358]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatSessionDate(session.startedAt)}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.color}`}>
                          {session.status === 'open' ? 'Open' : session.status === 'resolved' ? 'Resolved' : 'Closed'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate leading-relaxed">
                        {session.lastMessagePreview || 'No messages yet'}
                      </p>
                      <p className="text-[10px] text-slate-300 mt-1">
                        {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right panel: Chat ───────────────────────────────────────── */}
          <div className="flex-1 flex flex-col">
            {!activeSessionId ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-3 text-slate-400">
                <MessageCircle size={40} className="opacity-20" />
                <p className="text-sm font-medium">Select a conversation or start a new chat</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-[#001f3f] to-[#083358] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center text-[#001f3f] font-bold text-sm">
                      S
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">AscendX Support</p>
                      <p className="text-white/60 text-xs">
                        {isActiveSessionOpen ? 'Active Session' : `Session ${activeSession?.status || 'closed'}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActiveSessionOpen && (
                      <button
                        onClick={handleCloseSession}
                        className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-xs font-medium hover:bg-white/20 transition-all cursor-pointer"
                      >
                        Close Chat
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {sessionMessages.length === 0 && (
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

                      {msgs.map((msg) => {
                        const isMe = msg.senderRole === 'investor';
                        return (
                          <div
                            key={msg._id}
                            className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isMe && (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#001f3f] to-[#083358] flex items-center justify-center text-white text-xs font-bold mr-2 mt-auto mb-0.5 flex-shrink-0">
                                S
                              </div>
                            )}
                            <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                                  isMe
                                    ? 'bg-gradient-to-br from-[#001f3f] to-[#083358] text-white rounded-br-sm'
                                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                                }`}
                              >
                                {msg.body}
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1 px-1">
                                {formatTime(msg.sentAt || msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-slate-100 px-4 py-3 flex items-end gap-3 bg-slate-50/50">
                  {!isActiveSessionOpen ? (
                    <div className="flex-1 text-center text-sm text-slate-400 py-2">
                      This chat session is closed. <button onClick={handleNewSession} className="text-[#083358] font-semibold hover:underline cursor-pointer">Start a new chat</button>
                    </div>
                  ) : (
                    <>
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message...  (Enter to send)"
                        rows={1}
                        className="flex-1 resize-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#083358] focus:ring-2 focus:ring-[#083358]/15 transition-all placeholder-slate-400 max-h-32 overflow-y-auto"
                        style={{ minHeight: '42px' }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#001f3f] to-[#083358] text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                      >
                        <Send size={16} />
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportChatPage;

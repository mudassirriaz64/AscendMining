import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { MessageCircle, Send, Plus, X, MinusCircle } from 'lucide-react';
import {
  fetchActiveSession,
  fetchMySessions,
  fetchSessionMessages,
  startNewSession,
  sendMessageREST,
} from '../../store/slices/supportChatSlice';
import store from '../../store/store';
import { connectSocket, getSocket } from '../../services/socketService';

/**
 * Floating support chat widget — appears on all investor pages.
 * Positioned bottom-right, expands into a chat popup.
 */
const SupportChatWidget = () => {
  const { user } = useSelector((s) => s.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const activeSessionIdRef = useRef(null);

  // Keep ref in sync with state (via effect, not during render)
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // ── Load session messages via REST ──────────────────────────────────────
  const loadSessionMessages = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      const res = await store.dispatch(fetchSessionMessages(sessionId)).unwrap();
      setSessionMessages(res.messages || []);
      setActiveSession(res.session);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load sessions list ──────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    try {
      const res = await store.dispatch(fetchMySessions()).unwrap();
      setSessions(res.sessions || []);
    } catch { /* silent */ }
  }, []);

  // ── Connect socket on widget mount ──────────────────────────────────────
  useEffect(() => {
    if (!user || user.role === 'admin' || user.role === 'support_agent') return;

    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };
    const token = getCookie('accessToken');
    if (!token) return;

    const socket = connectSocket(token);

    const onConnect = () => setSocketReady(true);
    const onDisconnect = () => setSocketReady(false);

    const onActiveSession = ({ session }) => {
      setActiveSession(session);
      setActiveSessionId(session?._id || null);
      if (session?._id) {
        loadSessionMessages(session._id);
      }
    };

    const onNewMessage = ({ message, sessionId }) => {
      if (sessionId && sessionId === activeSessionIdRef.current) {
        setSessionMessages((prev) => [...prev, message]);
      }
    };

    const onSessionStarted = ({ session }) => {
      setActiveSession(session);
      setActiveSessionId(session._id);
      setSessionMessages([]);
      setSessions((prev) => {
        const exists = prev.find((s) => s._id === session._id);
        return exists ? prev : [session, ...prev];
      });
    };

    const onSessionClosed = ({ sessionId }) => {
      setSessions((prev) =>
        prev.map((s) => (s._id === sessionId ? { ...s, isActive: false, status: 'resolved' } : s))
      );
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('active_session', onActiveSession);
    socket.on('new_message', onNewMessage);
    socket.on('session_started', onSessionStarted);
    socket.on('session_closed', onSessionClosed);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('active_session', onActiveSession);
      socket.off('new_message', onNewMessage);
      socket.off('session_started', onSessionStarted);
      socket.off('session_closed', onSessionClosed);
    };
  }, [user, loadSessionMessages]);

  // ── Open widget ─────────────────────────────────────────────────────────
  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    setShowSidebar(false);
    await loadSessions();
    try {
      const res = await store.dispatch(fetchActiveSession()).unwrap();
      if (res.session) {
        setActiveSession(res.session);
        setActiveSessionId(res.session._id);
        setSessionMessages(res.messages || []);
      }
    } catch { /* silent */ }
  }, [loadSessions]);

  // ── Select a session from sidebar ───────────────────────────────────────
  const handleSelectSession = useCallback(async (sessionId) => {
    setShowSidebar(false);
    await loadSessionMessages(sessionId);
  }, [loadSessionMessages]);

  // ── Start new session ───────────────────────────────────────────────────
  const handleNewSession = useCallback(async () => {
    try {
      const res = await store.dispatch(startNewSession()).unwrap();
      setActiveSession(res.session);
      setActiveSessionId(res.session._id);
      setSessionMessages([]);
      setSessions((prev) => [res.session, ...prev]);
      setShowSidebar(false);
    } catch { /* silent */ }
  }, []);

  // ── Send message ────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);

    const socket = getSocket();
    const sid = activeSessionIdRef.current;
    if (socket?.connected && sid) {
      socket.emit('send_message', { body: trimmed, sessionId: sid });
      setInput('');
      setSending(false);
    } else {
      try {
        const res = await store.dispatch(sendMessageREST({ body: trimmed, sessionId: sid })).unwrap();
        setSessionMessages((prev) => [...prev, res.message]);
        setInput('');
      } catch { /* silent */ }
      setSending(false);
    }
    inputRef.current?.focus();
  }, [input, sending]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ── Auto scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages]);

  // ── Not an investor? Don't render ───────────────────────────────────────
  if (!user || user.role === 'admin' || user.role === 'support_agent') return null;

  const formatTime = (date) =>
    date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const formatSessionDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isActiveOpen = activeSession?.isActive && activeSession?.status === 'open';

  return (
    <>
      {/* ── FAB Button ──────────────────────────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#001f3f] to-[#083358] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center cursor-pointer group"
          title="Support Chat"
        >
          <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
          <span
            className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
              socketReady ? 'bg-emerald-400' : 'bg-slate-300'
            }`}
          />
        </button>
      )}

      {/* ── Chat Popup ──────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#001f3f] to-[#083358] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-[#001f3f] font-bold text-xs">
                S
              </div>
              <div>
                <p className="text-white font-semibold text-sm">AscendX Support</p>
                <p className="text-white/50 text-[10px]">
                  {socketReady ? 'Online' : 'Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Chat History"
              >
                {showSidebar ? <MinusCircle size={16} /> : <Plus size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Minimize"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Sidebar: Session list */}
          {showSidebar && (
            <div className="border-b border-slate-100 max-h-[200px] overflow-y-auto">
              <div className="px-3 py-2 flex items-center justify-between border-b border-slate-50">
                <span className="text-xs font-semibold text-slate-500">Past Chats</span>
                <button
                  onClick={handleNewSession}
                  className="text-[10px] text-[#083358] font-bold hover:underline cursor-pointer"
                >
                  + New Chat
                </button>
              </div>
              {sessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No past conversations</div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session._id}
                    onClick={() => handleSelectSession(session._id)}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 ${
                      session._id === activeSessionId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{formatSessionDate(session.startedAt)}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                        session.status === 'open' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {session.status === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {session.lastMessagePreview || 'No messages'}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {sessionMessages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                  <MessageCircle size={18} className="text-slate-300" />
                </div>
                <p className="text-xs text-slate-400">How can we help?</p>
                <p className="text-[10px] text-slate-300 mt-0.5">Send a message to start chatting</p>
              </div>
            )}

            {sessionMessages.map((msg) => {
              const isMe = msg.senderRole === 'investor';
              return (
                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#001f3f] to-[#083358] flex items-center justify-center text-white text-[9px] font-bold mr-1.5 mt-auto mb-0.5 flex-shrink-0">
                      S
                    </div>
                  )}
                  <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-3 py-2 rounded-xl text-[13px] leading-relaxed break-words ${
                        isMe
                          ? 'bg-gradient-to-br from-[#001f3f] to-[#083358] text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      {msg.body}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-0.5">
                      {formatTime(msg.sentAt || msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 px-3 py-2.5 flex items-end gap-2 bg-slate-50/50">
            {!isActiveOpen ? (
              <div className="flex-1 text-center text-xs text-slate-400 py-1.5">
                Chat closed.{' '}
                <button onClick={handleNewSession} className="text-[#083358] font-semibold hover:underline cursor-pointer">
                  Start new chat
                </button>
              </div>
            ) : (
              <>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-[#083358] focus:ring-1 focus:ring-[#083358]/15 transition-all placeholder-slate-400 max-h-20 overflow-y-auto"
                  style={{ minHeight: '36px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#001f3f] to-[#083358] text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SupportChatWidget;

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Headphones, Send, X, Plus, Trash2, ChevronDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { connectSocket } from '../../services/socketService';

const POLL_MS = 10000;

const SupportChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const endRef = useRef(null);
  const openRef = useRef(false);

  useEffect(() => { openRef.current = open; }, [open]);

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
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onMessage = ({ message, conversation: nextConversation, sessionId }) => {
      if (openRef.current && sessionId && sessionId === activeSessionId) {
        setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
      }
      if (nextConversation) setConversation(nextConversation);
      if (message.senderRole !== 'investor' && !openRef.current) {
        setConversation((current) => current ? { ...current, unreadByUser: true } : current);
      }
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:new', onMessage);
    if (socket.connected) setConnected(true);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:new', onMessage);
    };
  }, [loadConversation, activeSessionId]);

  useEffect(() => {
    if (connected) return undefined;
    const poll = window.setInterval(() => loadConversation(openRef.current).catch(() => {}), POLL_MS);
    return () => window.clearInterval(poll);
  }, [connected, loadConversation]);

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
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewSession = async () => {
    try {
      const response = await api.post('/support/conversations/sessions');
      const newSession = response.data.data.session;
      setSessions((current) => [newSession, ...current]);
      setActiveSessionId(newSession._id);
      setMessages([]);
      setShowSessions(false);
    } catch {
      toast.error('Could not create session.');
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
    if (!trimmed || sending) return;
    setSending(true);
    const socket = connectSocket();
    if (socket.connected) {
      socket.emit('message:send', { body: trimmed, sessionId: activeSessionId }, (result) => {
        setSending(false);
        if (!result?.ok) return toast.error(result?.message || 'Message could not be sent.');
        setBody('');
      });
      return;
    }
    try {
      const response = await api.post('/support/conversations/message', { body: trimmed, sessionId: activeSessionId });
      const result = response.data.data;
      setMessages((current) => [...current, result.message]);
      setConversation(result.conversation);
      setBody('');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Message could not be sent.');
    } finally { setSending(false); }
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
        <section aria-label="Talk to Agent" className="flex h-[min(640px,calc(100vh-2.5rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <header className="flex items-center justify-between bg-bg-dark px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-bg-dark"><Headphones size={18} /></span>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold">Talk to Agent</h2>
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

          <div className="flex-1 space-y-3 overflow-y-auto bg-bg-light-alt px-4 py-4" aria-live="polite">
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
            {messages.map((message) => {
              const mine = message.senderRole === 'investor';
              return (
                <div key={message._id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  <span className={`text-[10px] font-semibold mb-1 px-1 ${mine ? 'text-right text-slate-500' : 'text-left text-slate-500'}`}>
                    {mine ? 'You' : 'Support'}
                  </span>
                  <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${mine ? 'rounded-br-sm bg-gradient-to-br from-[#001f3f] to-[#083358] text-white' : 'rounded-bl-sm bg-white text-text-light-bg ring-1 ring-slate-200'}`}>
                      <p className="whitespace-pre-wrap break-words">{typeof message.body === 'string' ? message.body : String(message.body ?? '')}</p>
                      <time className="mt-1 block text-[10px] text-white/60">{new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="flex items-end gap-2 border-t border-border-light bg-white p-3">
            <textarea value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} rows={1} placeholder="Type your message" aria-label="Message" className="min-h-10 flex-1 resize-none rounded-xl border border-border-light px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/25 cursor-pointer" />
            <button type="button" aria-label="Send message" disabled={!body.trim() || sending} onClick={send} className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-bg-dark hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 cursor-pointer"><Send size={17} /></button>
          </div>
        </section>
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

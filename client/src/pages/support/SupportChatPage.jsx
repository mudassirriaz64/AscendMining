import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Send, MessageCircle, AlertCircle, Plus, Trash2, ChevronRight } from 'lucide-react';
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
} from '../../store/slices/supportChatSlice';
import { connectSocket, getSocket } from '../../services/socketService';

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
  const [socketReady, setSocketReady] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchMyConversation());
  }, [dispatch]);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => setSocketReady(true);
    const onDisconnect = () => setSocketReady(false);

    const onMessage = (data) => {
      if (data.sessionId && data.sessionId !== activeSessionId) return;
      dispatch(appendMessage(data));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:new', onMessage);
    if (socket.connected) setSocketReady(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:new', onMessage);
    };
  }, [dispatch, activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    if (!trimmed || sending) return;
    setSending(true);

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('message:send', { body: trimmed, sessionId: activeSessionId }, (result) => {
        setSending(false);
        if (!result?.ok) return toast.error(result?.message || 'Message could not be sent.');
        setInput('');
      });
      return;
    }

    try {
      await dispatch(sendMessageREST({ body: trimmed, sessionId: activeSessionId })).unwrap();
      setInput('');
    } catch (err) {
      toast.error(err || 'Failed to send message.');
    } finally {
      setSending(false);
    }
    inputRef.current?.focus();
  }, [input, sending, dispatch, activeSessionId]);

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
              Our support team typically responds within 30 minutes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${socketReady ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-xs text-slate-500 font-medium">
              {socketReady ? 'Live' : 'Connecting...'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col overflow-hidden" style={{ height: '68vh' }}>
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

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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

                {msgs.map((msg) => {
                  const isMe = msg.senderRole === 'investor';
                  return (
                    <div key={msg._id} className={`flex flex-col mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className={`text-[10px] font-semibold mb-1 px-1 ${isMe ? 'text-right text-slate-500' : 'text-left text-slate-500'}`}>
                        {isMe ? 'You' : 'Support'}
                      </span>
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#001f3f] to-[#083358] flex items-center justify-center text-white text-xs font-bold mr-2 mt-auto mb-0.5 flex-shrink-0">
                            S
                          </div>
                        )}
                        <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                              isMe
                                ? 'bg-gradient-to-br from-[#001f3f] to-[#083358] text-white rounded-br-sm'
                                : 'bg-white text-slate-800 rounded-bl-sm ring-1 ring-slate-200'
                            }`}
                          >
                            {typeof msg.body === 'string' ? msg.body : String(msg.body ?? '')}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {formatTime(msg.sentAt || msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-100 px-4 py-3 flex items-end gap-3 bg-slate-50/50">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportChatPage;

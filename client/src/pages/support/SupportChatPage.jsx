import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Send, MessageCircle, Ticket, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/common/Header';
import PageSkeleton from '../../components/common/PageSkeleton';
import {
  fetchConversation,
  sendMessageREST,
  appendMessage,
} from '../../store/slices/supportChatSlice';
import { connectSocket, disconnectSocket, getSocket } from '../../services/socketService';

const SupportChatPage = () => {
  const dispatch = useDispatch();
  const { conversation, messages, loading } = useSelector((s) => s.supportChat);
  const { user } = useSelector((s) => s.auth);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Load conversation on mount ────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchConversation());
  }, [dispatch]);

  // ── Connect socket ────────────────────────────────────────────────────────
  useEffect(() => {
    // Read token from cookie
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };
    const token = getCookie('accessToken');
    if (!token) return;

    const socket = connectSocket(token);

    socket.on('connect', () => setSocketReady(true));
    socket.on('disconnect', () => setSocketReady(false));

    socket.on('new_message', ({ message }) => {
      // Only push if it's not our own message (avoid duplicates from REST + socket)
      dispatch(appendMessage(message));
    });

    socket.on('error', ({ message }) => {
      toast.error(message || 'Socket error.');
    });

    return () => {
      socket.off('new_message');
      socket.off('error');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [dispatch]);

  // ── Auto scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('send_message', { body: trimmed });
      setInput('');
      setSending(false);
    } else {
      // REST fallback
      try {
        await dispatch(sendMessageREST(trimmed)).unwrap();
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

  // Group messages by date
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

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
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
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${socketReady ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
            />
            <span className="text-xs text-slate-500 font-medium">
              {socketReady ? 'Live' : 'Connecting…'}
            </span>
          </div>
        </div>

        {/* Chat Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col" style={{ height: '65vh' }}>
          {/* Chat Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-[#001f3f] to-[#083358] rounded-t-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center text-[#001f3f] font-bold text-sm">
              S
            </div>
            <div>
              <p className="text-white font-semibold text-sm">AscendX Support</p>
              <p className="text-white/60 text-xs">Support Team • {socketReady ? 'Online' : 'Connecting'}</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
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
                {/* Date divider */}
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

          {/* Input Area */}
          <div className="border-t border-slate-100 px-4 py-3 flex items-end gap-3 bg-slate-50/50 rounded-b-2xl">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…  (Enter to send)"
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

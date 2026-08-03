import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import { MessageCircle, Trash2, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHero from '../../components/landing/PageHero';
import FAQAccordion from '../../components/landing/FAQAccordion';
import GlowButton from '../../components/landing/GlowButton';
import { TextField } from '../../components/landing/FormInputs';

const SupportPage = () => {
  const { user } = useSelector((state) => state.auth);

  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  const [preChatForm, setPreChatForm] = useState({ name: '', email: '', phone: '' });
  const [guestSession, setGuestSession] = useState(() => {
    const storedToken = sessionStorage.getItem('guestToken');
    const storedConvo = sessionStorage.getItem('guestConvo');
    if (storedToken && storedConvo) {
      try {
        const conversation = JSON.parse(storedConvo);
        sessionStorage.setItem('accessToken', storedToken);
        return { conversation, token: storedToken };
      } catch {
        sessionStorage.removeItem('guestToken');
        sessionStorage.removeItem('guestConvo');
      }
    }
    return null;
  });
  const [loadingChat, setLoadingChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await api.get('/faqs');
        setFaqs((response.data.data || []).slice(0, 5));
      } catch {
        console.warn('Failed to load FAQs.');
      } finally {
        setLoadingFaqs(false);
      }
    };
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (!guestSession) return undefined;

    const loadConversationData = async () => {
      try {
        const response = await api.get('/support/conversations/sessions');
        const data = response.data.data;
        if (data) {
          setSessions(data.sessions || []);
          setActiveSessionId(data.activeSessionId);
          setMessages(data.messages || []);
        }
      } catch {
        console.warn('Failed to load guest conversation data.');
      }
    };
    loadConversationData();

    const serverUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(`${serverUrl}/support`, {
      auth: { token: guestSession.token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('conversation:join', { conversationId: guestSession.conversation._id });
    });

    socket.on('message:new', (data) => {
      const msg = data?.message || data;
      if (msg) {
        setMessages((current) => (current.some((m) => m._id === msg._id) ? current : [...current, msg]));
      }
    });

    socket.on('session:new', ({ session }) => {
      if (session) {
        setSessions((current) => (current.some((s) => s._id === session._id) ? current : [session, ...current]));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [guestSession]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handlePreChatSubmit = async (e) => {
    e.preventDefault();
    if (!preChatForm.name || !preChatForm.email) {
      return toast.error('Name and Email are required.');
    }
    setLoadingChat(true);
    try {
      let guestId = '';
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        guestId = crypto.randomUUID();
      } else {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      }

      const response = await api.post('/support/conversations/guest-conversations', {
        guestId,
        name: preChatForm.name,
        email: preChatForm.email,
        phone: preChatForm.phone,
      });

      const { conversation, token } = response.data.data;
      sessionStorage.setItem('guestToken', token);
      sessionStorage.setItem('guestConvo', JSON.stringify(conversation));
      sessionStorage.setItem('accessToken', token);

      setGuestSession({ conversation, token });
      toast.success('Support session started.');
    } catch {
      toast.error('Could not initiate guest chat.');
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const body = replyText.trim();
    if (!body || !guestSession || sending) return;

    setSending(true);
    try {
      await api.post('/support/conversations/message', {
        body,
        sessionId: activeSessionId,
      });
      setReplyText('');
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  const handleClearHistory = () => {
    setConfirmClearHistory(true);
  };

  const executeClearHistory = () => {
    if (socketRef.current) socketRef.current.disconnect();
    sessionStorage.removeItem('guestToken');
    sessionStorage.removeItem('guestConvo');
    sessionStorage.removeItem('accessToken');
    setGuestSession(null);
    setMessages([]);
    setSessions([]);
    setActiveSessionId(null);
    toast.success('Session ended.');
  };

  const updateField = (key) => (e) => setPreChatForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="relative py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <PageHero
          eyebrow="24/7 Help Desk"
          title="Customer Support"
          subtitle="Get help from our hardware deployment engineers. Resolve ticket queries or start a live anonymous support chat instantly."
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* FAQ Column */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-heading font-semibold text-page-text flex items-center gap-2 border-b border-page-border pb-2">
              <MessageCircle className="text-gold" size={20} /> Self-Serve FAQs
            </h2>
            {loadingFaqs ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : faqs.length === 0 ? (
              <p className="text-xs text-page-text-soft">No self-serve FAQs configured yet.</p>
            ) : (
              <FAQAccordion
                items={faqs.map((faq) => ({ id: faq._id, question: faq.question, answer: faq.answer }))}
                expandedId={expandedFaqId}
                onToggle={setExpandedFaqId}
              />
            )}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-semibold text-page-text">Looking for general inquiries?</h4>
              <p className="text-xs text-page-text-soft leading-relaxed">
                If you have non-technical questions regarding business partnership opportunities, checkout our{' '}
                <Link to="/contact" className="text-gold hover:underline">
                  Contact Page
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Chat Column */}
          <div className="lg:col-span-3">
            {user ? (
              <div className="glass-card rounded-3xl p-10 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto text-gold">
                  <MessageCircle size={32} />
                </div>
                <h3 className="text-lg font-heading font-semibold text-page-text">You Are Logged In</h3>
                <p className="text-sm text-page-text-soft leading-relaxed max-w-sm mx-auto">
                  Registered investors get direct dedicated support with priority queue routing. Visit your dashboard to manage your conversations.
                </p>
                <div className="flex justify-center">
                  <GlowButton to="/support/chat">Go to Live Chat</GlowButton>
                </div>
              </div>
            ) : !guestSession ? (
              <div className="glass-card rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-heading font-semibold text-page-text">Start Guest Support Chat</h3>
                    <p className="text-xs text-page-text-soft">Fill in your details to connect with a support agent.</p>
                  </div>
                </div>

                <form onSubmit={handlePreChatSubmit} className="space-y-4">
                  <TextField
                    id="guest_name"
                    label="Full Name"
                    value={preChatForm.name}
                    onChange={updateField('name')}
                    placeholder="John Doe"
                    required
                    autoComplete="name"
                  />
                  <TextField
                    id="guest_email"
                    label="Email Address"
                    type="email"
                    value={preChatForm.email}
                    onChange={updateField('email')}
                    placeholder="john@example.com"
                    required
                    autoComplete="email"
                  />
                  <TextField
                    id="guest_phone"
                    label="Phone Number (Optional)"
                    type="tel"
                    value={preChatForm.phone}
                    onChange={updateField('phone')}
                    placeholder="+1 (555) 019-2834"
                    autoComplete="tel"
                  />
                  <GlowButton type="submit" disabled={loadingChat} className="w-full">
                    {loadingChat ? 'Connecting...' : (
                      <>
                        <MessageCircle size={14} /> Start Chat
                      </>
                    )}
                  </GlowButton>
                </form>
              </div>
            ) : (
              <div className="glass-card rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col h-[560px] overflow-hidden">
                <header className="bg-bg-void-soft/80 border-b border-border-glass px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Live Support Chat</h3>
                    <p className="text-[10px] text-slate-400">
                      Anonymous session · {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                    title="End Session"
                  >
                    <Trash2 size={16} />
                  </button>
                </header>

                <div ref={chatContainerRef} className="flex-grow p-6 overflow-y-auto bg-bg-void/40 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 max-w-[220px] mx-auto space-y-2">
                      <MessageCircle size={32} className="text-slate-600" />
                      <p className="text-xs">No messages yet. Send a message to start the conversation.</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const mine = ['investor', 'guest'].includes(message.senderRole);
                      const isSystem = message.body?.startsWith('[SYSTEM]');
                      if (isSystem) {
                        return (
                          <div key={message._id} className="flex justify-center my-2 w-full">
                            <span className="text-[10px] text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-full border border-border-glass">
                              {message.body.replace('[SYSTEM] ', '')}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={message._id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] font-semibold mb-1 text-slate-500 px-1">
                            {mine ? 'You' : 'Support'}
                          </span>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              mine
                                ? 'bg-gradient-to-br from-gold to-gold-soft text-[#101828] rounded-tr-none shadow-[0_4px_20px_rgba(255,184,0,0.2)]'
                                : 'bg-white/[0.06] border border-border-glass text-slate-200 rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-border-glass p-4 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-grow bg-white/[0.04] border border-border-glass rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    aria-label="Send message"
                    className="bg-gradient-to-r from-gold to-gold-soft text-[#101828] px-4 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none cursor-pointer hover:shadow-[0_0_20px_rgba(255,184,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 flex items-center justify-center shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmClearHistory}
        onClose={() => setConfirmClearHistory(false)}
        onConfirm={() => {
          executeClearHistory();
          setConfirmClearHistory(false);
        }}
        title="End Session"
        message="Are you sure you want to end your session and clear chat history?"
        variant="danger"
      />
    </div>
  );
};

export default SupportPage;

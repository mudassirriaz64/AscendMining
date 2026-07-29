import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HelpCircle, ChevronDown, MessageCircle, Send, Plus, Trash2, AlertCircle, Phone, Mail } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SupportPage = () => {
  const { user } = useSelector((state) => state.auth);

  // FAQ state
  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  // Guest Chat state
  const [preChatForm, setPreChatForm] = useState({ name: '', email: '', phone: '' });
  const [guestSession, setGuestSession] = useState(null); // { conversation, token }
  const [loadingChat, setLoadingChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize FAQ & check existing guest session
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await api.get('/faqs');
        setFaqs((response.data.data || []).slice(0, 5)); // show top 5 FAQs
      } catch {
        console.warn('Failed to load FAQs.');
      } finally {
        setLoadingFaqs(false);
      }
    };
    fetchFaqs();

    const storedToken = sessionStorage.getItem('guestToken');
    const storedConvo = sessionStorage.getItem('guestConvo');
    if (storedToken && storedConvo) {
      try {
        const conversation = JSON.parse(storedConvo);
        setGuestSession({ conversation, token: storedToken });
        // Temporarily assign token for interceptor
        sessionStorage.setItem('accessToken', storedToken);
      } catch (e) {
        sessionStorage.removeItem('guestToken');
        sessionStorage.removeItem('guestConvo');
      }
    }
  }, []);

  // Fetch guest conversation messages when guestSession changes
  useEffect(() => {
    if (!guestSession) return;

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

    // Setup Socket
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
        setMessages((current) => current.some((m) => m._id === msg._id) ? current : [...current, msg]);
      }
    });

    socket.on('session:new', ({ session }) => {
      if (session) {
        setSessions((current) => {
          if (current.some((s) => s._id === session._id)) return current;
          return [session, ...current];
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [guestSession]);

  // Scroll to bottom on new messages
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
      // Generate guestId UUID
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

  const handleClearHistory = () => {
    if (!window.confirm('Are you sure you want to end your session and clear chat history?')) return;
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

  return (
    <div className="bg-bg-light-alt py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold tracking-widest text-secondary uppercase">24/7 Help Desk</span>
          <h1 className="text-4xl font-heading font-semibold text-text-light-bg">Customer Support</h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Get help from our hardware deployment engineers. Resolve ticket queries or start a live anonymous support chat instantly.
          </p>
        </div>

        {/* Content split */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* FAQ Column */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-heading font-semibold text-text-light-bg flex items-center gap-2 border-b border-border-light pb-2">
              <HelpCircle className="text-secondary" size={20} /> Self-Serve FAQs
            </h2>
            {loadingFaqs ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : faqs.length === 0 ? (
              <p className="text-xs text-text-secondary">No self-serve FAQs configured yet.</p>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq._id;
                  return (
                    <div key={faq._id} className="bg-white border border-border-light rounded-xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setExpandedFaqId(isExpanded ? null : faq._id)}
                        className="w-full px-5 py-3 text-left flex justify-between items-center font-heading font-medium text-xs text-text-light-bg hover:bg-slate-50 transition-colors focus:outline-none"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown size={14} className={`text-text-secondary transition-transform ${isExpanded ? 'rotate-180 text-secondary' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="px-5 py-3 text-xs text-text-secondary leading-relaxed border-t border-border-light bg-[#fafbfc]">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="p-5 rounded-2xl bg-white border border-border-light space-y-4">
              <h4 className="text-xs font-semibold text-text-light-bg">Looking for general inquiries?</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                If you have non-technical questions regarding business partnership opportunities, checkout our <Link to="/contact" className="text-secondary hover:underline">Contact Page</Link>.
              </p>
            </div>
          </div>

          {/* Chat Column */}
          <div className="lg:col-span-3">
            {user ? (
              /* If logged in, prompt user to go to dashboard support */
              <div className="bg-white border border-[#E4E7EC] rounded-2xl p-8 text-center shadow-sm space-y-6">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#2F8FEA]">
                  <MessageCircle size={32} />
                </div>
                <h3 className="text-lg font-heading font-semibold text-text-light-bg">You Are Logged In</h3>
                <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
                  Registered investors get direct dedicated support with priority queue routing. Visit your dashboard to manage your conversations.
                </p>
                <div className="flex justify-center">
                  <Link
                    to="/support/chat"
                    className="bg-primary hover:bg-primary-hover text-text-light-bg px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md active:scale-95"
                  >
                    Go to Live Chat
                  </Link>
                </div>
              </div>
            ) : !guestSession ? (
              /* If not logged in and no guest chat started: Pre-chat form */
              <div className="bg-white border border-[#E4E7EC] rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <MessageCircle className="text-secondary" size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-heading font-semibold text-text-light-bg">Start Guest Support Chat</h3>
                    <p className="text-xs text-text-secondary">Fill in your details to connect with a support agent.</p>
                  </div>
                </div>

                <form onSubmit={handlePreChatSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="guest_name" className="block text-xs font-semibold text-text-secondary mb-1">Full Name*</label>
                    <input
                      type="text"
                      id="guest_name"
                      required
                      value={preChatForm.name}
                      onChange={(e) => setPreChatForm({ ...preChatForm, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full bg-[#fafbfc] border border-border-light rounded-lg px-3 py-2 text-sm text-text-light-bg focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="guest_email" className="block text-xs font-semibold text-text-secondary mb-1">Email Address*</label>
                    <input
                      type="email"
                      id="guest_email"
                      required
                      value={preChatForm.email}
                      onChange={(e) => setPreChatForm({ ...preChatForm, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full bg-[#fafbfc] border border-border-light rounded-lg px-3 py-2 text-sm text-text-light-bg focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="guest_phone" className="block text-xs font-semibold text-text-secondary mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      id="guest_phone"
                      value={preChatForm.phone}
                      onChange={(e) => setPreChatForm({ ...preChatForm, phone: e.target.value })}
                      placeholder="+1 (555) 019-2834"
                      className="w-full bg-[#fafbfc] border border-border-light rounded-lg px-3 py-2 text-sm text-text-light-bg focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loadingChat}
                    className="w-full bg-primary hover:bg-primary-hover text-text-light-bg py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {loadingChat ? 'Connecting...' : <><MessageCircle size={14} /> Start Chat</>}
                  </button>
                </form>
              </div>
            ) : (
              /* Active Guest Chat Panel */
              <div className="bg-white border border-border-light rounded-2xl shadow-lg flex flex-col h-[520px] overflow-hidden">
                {/* Chat Header */}
                <header className="bg-bg-dark text-white px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Live Support Chat</h3>
                    <p className="text-[10px] text-text-dark-bg/60">Anonymous session · {sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-text-dark-bg/60 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    title="End Session"
                  >
                    <Trash2 size={16} />
                  </button>
                </header>

                {/* Messages Body */}
                <div ref={chatContainerRef} className="flex-grow p-6 overflow-y-auto bg-bg-light-alt space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 max-w-[200px] mx-auto space-y-2">
                      <MessageCircle size={32} className="text-slate-300" />
                      <p className="text-xs">No messages yet. Send a message to start the conversation.</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const mine = message.senderRole === 'investor';
                      const isSystem = message.body?.startsWith('[SYSTEM]');
                      if (isSystem) {
                        return (
                          <div key={message._id} className="flex justify-center my-2 w-full">
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
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
                          <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${mine ? 'bg-gradient-to-br from-[#001f3f] to-[#083358] text-white rounded-tr-none' : 'bg-white text-text-light-bg border border-slate-200 rounded-tl-none shadow-sm'}`}>
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendMessage} className="border-t border-border-light p-4 bg-white flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-grow bg-bg-light-alt border border-border-light rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-secondary transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    className="bg-primary hover:bg-primary-hover text-text-light-bg px-4 py-2 rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;

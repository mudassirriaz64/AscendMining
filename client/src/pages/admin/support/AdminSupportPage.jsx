import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Ticket, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { connectSocket } from '../../../services/socketService';

const STATUS = {
  open: ['Open', 'bg-amber-50 text-amber-800'],
  in_progress: ['In progress', 'bg-blue-50 text-blue-800'],
  resolved: ['Resolved', 'bg-emerald-50 text-emerald-800'],
  closed: ['Closed', 'bg-slate-100 text-slate-700'],
};

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
  const endRef = useRef(null);
  const selectedIdRef = useRef(null);

  const loadConversations = useCallback(async () => {
    const response = await api.get('/admin/support/conversations');
    setConversations(response.data.data.conversations || []);
  }, []);

  const loadTickets = useCallback(async () => {
    const response = await api.get('/admin/support/tickets');
    setTickets(response.data.data.tickets || []);
  }, []);

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    Promise.all([loadConversations(), loadTickets()]).catch(() => toast.error('Support queue could not be loaded.'));
    const socket = connectSocket();
    const onMessage = ({ message, conversation, sessionId }) => {
      if (conversation?._id === selectedIdRef.current) {
        setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
      }
      loadConversations().catch(() => {});
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
    socket.on('message:new', onMessage);
    socket.on('alarm:trigger', onAlarmTrigger);
    socket.on('alarm:clear', onAlarmClear);
    return () => {
      socket.off('message:new', onMessage);
      socket.off('alarm:trigger', onAlarmTrigger);
      socket.off('alarm:clear', onAlarmClear);
    };
  }, [loadConversations, loadTickets]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const openConversation = async (id) => {
    try {
      const response = await api.get(`/admin/support/conversations/${id}`);
      setSelectedId(id);
      setSelected(response.data.data.conversation);
      setMessages(response.data.data.messages || []);
      setActiveSessions(response.data.data.sessions || []);
      setConversations((current) => current.map((item) => item._id === id ? { ...item, awaitingAgentSince: null, unreadByAdmin: false } : item));
      setAlarmIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      connectSocket().emit('conversation:join', { conversationId: id });
    } catch { toast.error('Conversation could not be opened.'); }
  };

  const sendReply = async () => {
    const body = reply.trim();
    if (!body || !selectedId || sending) return;
    setSending(true);
    const socket = connectSocket();
    if (socket.connected) {
      socket.emit('message:send', { conversationId: selectedId, body }, (result) => {
        setSending(false);
        if (result?.ok) setReply('');
        else toast.error(result?.message || 'Reply could not be sent.');
      });
      return;
    }
    try {
      const response = await api.post('/support/conversations/message', { conversationId: selectedId, body });
      setMessages((current) => [...current, response.data.data.message]);
      setReply('');
    } catch { toast.error('Reply could not be sent.'); }
    finally { setSending(false); }
  };

  const updateTicket = async (id, status) => {
    try {
      const response = await api.patch(`/admin/support/tickets/${id}`, { status });
      setTickets((current) => current.map((item) => item._id === id ? response.data.data.ticket : item));
    } catch { toast.error('Ticket could not be updated.'); }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Delete this session and all its messages?')) return;
    try {
      await api.delete(`/admin/support/conversations/sessions/${sessionId}`);
      setActiveSessions((current) => current.filter((s) => s._id !== sessionId));
      setMessages((current) => current.filter((m) => m.sessionId !== sessionId));
      toast.success('Session deleted.');
    } catch { toast.error('Failed to delete session.'); }
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
                  <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ringing ? 'animate-pulse bg-danger motion-reduce:animate-none' : conversation.unreadByAdmin ? 'bg-primary' : 'bg-slate-300'}`} /><p className="truncate text-sm font-semibold">{user?.fullName || user?.username || 'Investor'}</p>{overdue ? <span className="ml-auto rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">30m+</span> : null}</div>
                  <p className="mt-1 truncate pl-[18px] text-xs text-text-secondary">{conversation.lastMessagePreview || 'No messages'}</p>
                  {ringing ? <span className="absolute inset-y-2 left-0 w-1 rounded-r bg-danger" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </aside>

          <section className="flex min-h-[460px] flex-1 flex-col">
            {selected ? <>
              <header className="border-b border-border-light px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">{(selected.user || selected.userId)?.fullName || 'Investor'}</h2>
                    <p className="text-xs text-text-secondary">One conversation · {activeSessions.length} session{activeSessions.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-bg-light-alt px-5 py-4">
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
                          <button
                            type="button"
                            onClick={() => deleteSession(item.sessionId)}
                            className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer p-0.5"
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
                  const agent = msg.senderRole !== 'investor';
                  const senderName = agent ? 'Support' : 'Investor';
                  return (
                    <div key={item.key} className={`flex flex-col ${agent ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-semibold mb-1 px-1 text-slate-500">
                        {senderName}
                      </span>
                      <div className={`flex ${agent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${agent ? 'rounded-br-sm bg-gradient-to-br from-[#001f3f] to-[#083358] text-white' : 'rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-200'}`}>
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                          <time className="mt-1 block text-[10px] text-white/60">{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="flex items-end gap-2 border-t border-border-light p-3"><textarea value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendReply(); } }} rows={1} aria-label="Reply" placeholder="Reply to investor" className="min-h-10 flex-1 resize-none rounded-xl border border-border-light px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/25 cursor-pointer" /><button type="button" onClick={sendReply} disabled={!reply.trim() || sending} aria-label="Send reply" className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-bg-dark disabled:opacity-50 cursor-pointer"><Send size={17} /></button></div>
            </> : <div className="grid flex-1 place-items-center text-center"><div><MessageCircle className="mx-auto text-text-secondary" /><p className="mt-3 text-sm font-medium">Choose a conversation</p><p className="mt-1 text-xs text-text-secondary">Opening it clears that conversation's alarm for every agent.</p></div></div>}
          </section>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-border-light"><table className="w-full text-sm"><thead><tr className="border-b border-border-light text-left text-xs text-text-secondary"><th className="px-4 py-3">Investor</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-border-light">{tickets.map((ticket) => <tr key={ticket._id}><td className="px-4 py-3 font-medium">{ticket.userId?.fullName || ticket.userId?.username || 'Investor'}</td><td className="px-4 py-3">{ticket.subject}</td><td className="px-4 py-3 text-text-secondary">{new Date(ticket.createdAt).toLocaleDateString()}</td><td className="px-4 py-3"><select value={ticket.status} onChange={(event) => updateTicket(ticket._id, event.target.value)} className={`rounded-lg border-0 px-2 py-1 text-xs font-semibold ${STATUS[ticket.status]?.[1]}`}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></td></tr>)}</tbody></table></div>
      )}
    </div>
  );
};

export default AdminSupportPage;

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Send, User, MessageSquare, Loader2, Paperclip, Navigation, MapPin, AlertCircle, Wifi, WifiOff, Pencil, Trash2, X, Check } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import { api } from '../api/client';
import { decodeJwtPayload } from '../lib/appUtils';
import type { ChatContact, ChatMessage } from '../types';

export default function Messages() {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [searchResults, setSearchResults] = useState<ChatContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<ChatContact | null>(null);

  const token = localStorage.getItem('token');
  const jwtPayload = decodeJwtPayload(token);
  const currentUserEmail = jwtPayload?.sub || jwtPayload?.email || '';
  const requestedChatId = searchParams.get('userId');
  const requestedChatName = searchParams.get('name') || 'Користувач';

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Load contacts
  useEffect(() => {
    if (!token) return;
    setLoadingContacts(true);
    api.get('/api/chat/contacts')
      .then(res => setContacts(Array.isArray(res.data) ? res.data : []))
      .catch(() => { })
      .finally(() => setLoadingContacts(false));
  }, [token]);

  // Load current user
  const [me, setMe] = useState<ChatContact | null>(null);
  useEffect(() => {
    if (!token) return;
    api.get('/api/users/me').then(res => setMe(res.data)).catch(() => { });
  }, [token]);

  // Connect WebSocket for live updates (optional - messages work without it)
  useEffect(() => {
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 10000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      onConnect: () => {
        setIsWsConnected(true);
        client.subscribe('/user/queue/messages', (frame: { body: string }) => {
          const msg = JSON.parse(frame.body) as ChatMessage;
          const activeId = activeChatRef.current?.id;
          if (activeId) {
            const fromActive = String(msg.sender?.id) === String(activeId);
            const toActive = String(msg.recipient?.id) === String(activeId);
            if (!fromActive && !toActive) return;
          }
          setMessages(prev =>
            prev.some(m => m.id === msg.id) ? prev.map(m => m.id === msg.id ? msg : m) : [...prev, msg]
          );
        });
      },
      onDisconnect: () => setIsWsConnected(false),
      onStompError: () => setIsWsConnected(false),
      onWebSocketError: () => setIsWsConnected(false),
    });

    client.activate();
    stompClient.current = client;
    return () => { client.deactivate(); };
  }, [token]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = useCallback(async (userId: string) => {
    if (!token) return;
    setLoadingHistory(true);
    setError('');
    try {
      const res = await api.get(`/api/chat/history/${userId}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Не вдалося завантажити історію');
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  const openChat = useCallback(async (user: ChatContact) => {
    if (me && user.id === me.id) return;
    setActiveChat(user);
    setSearchResults([]);
    setSearchQuery('');
    setMessages([]);
    if (!contacts.some(c => c.id === user.id)) {
      setContacts(prev => [user, ...prev]);
    }
    await fetchHistory(user.id);
  }, [me, contacts, fetchHistory]);

  // Auto-open from URL
  useEffect(() => {
    if (!requestedChatId || !me) return;
    const preselected = contacts.find(c => c.id === requestedChatId) || {
      id: requestedChatId,
      displayName: requestedChatName,
      email: '',
    };
    if (activeChatRef.current?.id !== requestedChatId) {
      void openChat(preselected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedChatId, me]);

  // Search
  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const results = Array.isArray(res.data) ? res.data : [];
        setSearchResults(results.filter((u: ChatContact) => u.email !== currentUserEmail));
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, token, currentUserEmail]);

  // Send or edit message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setError('');

    try {
      if (editingMessageId) {
        const res = await api.put(`/api/chat/messages/${editingMessageId}`, { content });
        setMessages(prev => prev.map(m => m.id === res.data.id ? res.data : m));
        setEditingMessageId(null);
      } else {
        const res = await api.post('/api/chat/send', {
          recipientId: activeChat.id,
          content,
        });
        setMessages(prev => prev.some(m => m.id === res.data.id) ? prev.map(m => m.id === res.data.id ? res.data : m) : [...prev, res.data]);
      }
    } catch {
      setError('Не вдалося зберегти повідомлення. Спробуйте ще раз.');
      setNewMessage(content); // restore
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (id: number) => {
    try {
      const res = await api.delete(`/api/chat/messages/${id}`);
      setMessages(prev => prev.map(m => m.id === id ? res.data : m));
    } catch {
      setError('Не вдалося видалити повідомлення.');
    }
  };

  const startEditing = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setNewMessage(msg.content);
  };

  const sendLocation = () => {
    if (!activeChat) return;
    navigator.geolocation.getCurrentPosition(async position => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await api.post('/api/chat/send', {
          recipientId: activeChat.id,
          content: `Локація: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          latitude,
          longitude,
          fileType: 'LOCATION',
        });
        setMessages(prev => prev.some(m => m.id === res.data.id) ? prev.map(m => m.id === res.data.id ? res.data : m) : [...prev, res.data]);
      } catch {
        setError('Не вдалося надіслати локацію');
      }
    }, () => setError('Не вдалося отримати геолокацію'));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const upload = await api.post('/api/files/upload', formData);
      const fileUrl = upload.data.url;
      const fileType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      const res = await api.post('/api/chat/send', {
        recipientId: activeChat.id,
        content: fileType === 'IMAGE' ? 'Фото' : `Файл: ${file.name}`,
        fileUrl,
        fileType,
      });
      setMessages(prev => prev.some(m => m.id === res.data.id) ? prev.map(m => m.id === res.data.id ? res.data : m) : [...prev, res.data]);
    } catch {
      setError('Не вдалося завантажити файл');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!token) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center bg-bg-cream p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
          <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-dark mb-2">Увійдіть до чату</h1>
          <p className="text-text-muted">Щоб писати повідомлення, потрібно авторизуватися.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col lg:flex-row bg-bg-cream">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col max-h-[42vh] lg:max-h-none">
        <div className="p-5 md:p-6 border-b border-gray-100 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold font-serif text-text-dark">Чати</h2>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isWsConnected ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {isWsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {/* {isWsConnected ? 'Live' : 'REST'} */}
            </div>
            {loadingContacts && <Loader2 className="w-5 h-5 text-text-muted animate-spin" />}
          </div>
          <form onSubmit={e => e.preventDefault()} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Пошук (ім'я або email)..."
              className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all"
            />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="p-4 space-y-2">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-2">Результати пошуку</h3>
              {searchResults.map((user: ChatContact) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => void openChat(user)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors text-left ${activeChat?.id === user.id ? 'bg-orange-50' : 'hover:bg-orange-50/60'}`}
                >
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                    {user.displayName?.charAt(0) || <User className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-text-dark truncate">{user.displayName || 'Користувач'}</div>
                    <div className="text-xs text-text-muted truncate">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-2">Останні діалоги</h3>
              {contacts.length === 0 && !loadingContacts ? (
                <div className="px-2 py-8 text-center text-sm text-text-muted">
                  Поки що немає контактів. Знайдіть користувача через пошук.
                </div>
              ) : (
                contacts.map((contact: ChatContact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => void openChat(contact)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors text-left ${activeChat?.id === contact.id ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="w-10 h-10 bg-orange-100 text-primary rounded-full flex items-center justify-center font-bold">
                      {contact.displayName?.charAt(0) || <User className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-text-dark truncate">{contact.displayName}</div>
                      <div className="text-xs text-text-muted">Натисніть щоб відкрити чат</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col bg-bg-cream min-h-[58vh] lg:min-h-0">
        {activeChat ? (
          <>
            <div className="p-4 md:p-6 bg-white border-b border-gray-100 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 text-primary rounded-full flex items-center justify-center font-bold text-lg">
                {activeChat.displayName?.charAt(0) || <User className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-text-dark truncate">{activeChat.displayName}</h2>
                <span className="text-xs text-text-muted font-medium">Учасник PawBack</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {loadingHistory && messages.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-text-muted">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Завантаження...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-text-muted text-sm">
                  Почніть розмову — надішліть перше повідомлення!
                </div>
              ) : (
                messages.map((msg: ChatMessage, index: number) => {
                  const isMe = !!currentUserEmail && msg.sender?.email === currentUserEmail;
                  return (
                    <div key={msg.id || `${msg.timestamp}-${index}`} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                      {msg.isDeleted ? (
                        <div className="max-w-[80%] rounded-2xl p-4 bg-gray-50 text-gray-400 border border-gray-100 shadow-sm italic text-sm">
                          Повідомлення видалено
                        </div>
                      ) : (
                        <div className="flex items-end gap-2 max-w-[90%] md:max-w-[80%]">
                          {isMe && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pb-1 shrink-0">
                              {(!msg.fileType || msg.fileType !== 'FILE') && msg.fileType !== 'LOCATION' && msg.fileType !== 'IMAGE' && (
                                <button onClick={() => startEditing(msg)} className="p-1.5 text-gray-400 hover:text-primary rounded-full hover:bg-orange-50 transition-colors" title="Редагувати">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => deleteMessage(msg.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors" title="Видалити">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <div className={`rounded-2xl p-4 ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white text-text-dark border border-gray-100 rounded-bl-none shadow-sm'}`}>
                            {msg.fileType === 'IMAGE' && (
                              <div className="mb-2 rounded-lg overflow-hidden">
                                <img
                                  src={msg.fileUrl}
                                  alt="Фото"
                                  className="max-w-full h-auto cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(msg.fileUrl, '_blank')}
                                />
                              </div>
                            )}
                            {msg.fileType === 'FILE' && (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 mb-2 p-2 bg-black/5 rounded-lg hover:bg-black/10 transition-colors">
                                <Paperclip className="w-4 h-4" />
                                <span className="text-sm truncate max-w-[200px]">{msg.content}</span>
                              </a>
                            )}
                            {msg.fileType === 'LOCATION' && (
                              <div className="mb-2 p-2 bg-black/5 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <MapPin className="w-4 h-4 text-red-500" />
                                  <span className="text-xs font-bold uppercase">Локація</span>
                                </div>
                                <a
                                  href={`https://www.google.com/maps?q=${msg.latitude},${msg.longitude}`}
                                  target="_blank" rel="noreferrer"
                                  className="text-sm underline"
                                >
                                  Переглянути на карті
                                </a>
                              </div>
                            )}
                            {(!msg.fileType || msg.fileType !== 'FILE') && (
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="text-[10px] text-text-muted mt-1 px-1 font-medium flex gap-1">
                        {new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.timestamp))}
                        {msg.isEdited && !msg.isDeleted && <span>· відредаговано</span>}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 md:p-6 bg-white border-t border-gray-100">
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                  <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
                </div>
              )}
              {editingMessageId && (
                <div className="flex items-center justify-between mb-2 p-2 bg-orange-50 text-orange-800 rounded-lg text-sm border border-orange-100">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    <span className="font-medium">Редагування повідомлення...</span>
                  </div>
                  <button onClick={() => { setEditingMessageId(null); setNewMessage(''); }} className="p-1 hover:bg-orange-100 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !!editingMessageId}
                  className="p-2.5 bg-gray-50 text-text-muted rounded-xl hover:bg-orange-50 hover:text-primary transition-all disabled:opacity-50"
                  title="Додати файл або фото"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={sendLocation}
                  disabled={!!editingMessageId}
                  className="p-2.5 bg-gray-50 text-text-muted rounded-xl hover:bg-orange-50 hover:text-primary transition-all disabled:opacity-50"
                  title="Надіслати локацію"
                >
                  <Navigation className="w-5 h-5" />
                </button>
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              </div>
              <form onSubmit={sendMessage} className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { void sendMessage(e); } }}
                  placeholder="Напишіть повідомлення..."
                  disabled={sending}
                  className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-gray-100 rounded-full pl-6 pr-16 py-4 focus:outline-none transition-all shadow-sm disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-full hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  aria-label="Надіслати"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingMessageId ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4 translate-x-[1px] -translate-y-[1px]" />)}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted space-y-4 px-6 py-12 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
              <MessageSquare className="w-10 h-10 text-gray-300" />
            </div>
            <p className="font-medium text-lg">Виберіть чат або знайдіть користувача</p>
            <p className="text-sm max-w-md">Введіть ім'я або email у пошук, щоб розпочати розмову.</p>
          </div>
        )}
      </main>
    </div>
  );
}









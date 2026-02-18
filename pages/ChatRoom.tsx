
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useApp } from '../App';
import { useConfirm } from '../ConfirmProvider';
import { 
  Send, ChevronLeft, ChevronRight, User, 
  Loader2, Smile, Trash2, MapPin, ExternalLink, X
} from 'lucide-react';
import { Message, Conversation, Profile } from '../types';

const ChatRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const { user, lang, refreshUnread } = useApp();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherPerson, setOtherPerson] = useState<Profile | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const EMOJIS = [
    '🌙', '✨', '🏮', '🤲', '🕌', '⭐', '😊', '😍', '😂', '👍', 
    '❤️', '📍', '✅', '🙌', '🎉', '💡', '🥘', '☕', '🥛', '🗓️',
    '📿', '📖', '😇', '🙏', '🤝', '📞', '🏠', '🛠️', '🔧', '⚡'
  ];

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    if (!id || !user) return;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        // 1. جلب المحادثة مع بيانات البروفايلات
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select(`*, donor_profile:profiles!donor_id(*), requester_profile:profiles!requester_id(*)`)
          .eq('id', id)
          .maybeSingle();

        if (convError) throw convError;

        if (convData) {
          setConversation(convData);
          const other = user.id === convData.donor_id ? convData.requester_profile : convData.donor_profile;
          setOtherPerson(other);
          
          // تحديث حالة القراءة محلياً
          const readStatus = JSON.parse(localStorage.getItem(`read_status_${user.id}`) || '{}');
          readStatus[id] = new Date().toISOString();
          localStorage.setItem(`read_status_${user.id}`, JSON.stringify(readStatus));
          refreshUnread();
        } else {
          console.warn("Conversation not found for ID:", id);
        }

        // 2. جلب الرسائل
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;
        if (msgData) {
          setMessages(msgData);
          setTimeout(() => scrollToBottom('auto'), 100);
        }
      } catch (e: any) {
        console.error("Chat loading error:", e.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // الاستماع للتغييرات الفورية
    const channel = supabase.channel(`chat_room_${id}`)
      .on('postgres_changes', { event: 'INSERT', table: 'messages', filter: `conversation_id=eq.${id}` }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => (prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage]));
        setTimeout(() => scrollToBottom('smooth'), 50);
      })
      .on('postgres_changes', { event: 'DELETE', table: 'messages' }, (p) => {
        setMessages(prev => prev.filter(m => m.id !== p.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, user?.id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || !user || !id) return;

    const tempId = 'temp-' + Date.now();
    const tempMsg: Message = { id: tempId, conversation_id: id, sender_id: user.id, text, created_at: new Date().toISOString() };

    setMessages(prev => [...prev, tempMsg]);
    setInputText('');
    setShowEmojis(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: id, sender_id: user.id, text })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      }

      // تحديث وقت المحادثة في الخلفية
      supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', id)
        .then();
    } catch (err: any) {
      console.error("Send error:", err.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      if (err.code === '42501') {
        alert(lang === 'ar' ? "فشل الإرسال: مشكلة في صلاحيات RLS" : "Send failed: RLS Policy issue");
      }
    }
  };

  const handleLocationShare = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const mapsUrl = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      setDetecting(false);
      setInputText(mapsUrl);
      // We trigger send directly here after a short delay or just let the user see it
      // handleSendMessage() could be called directly but user might want to add text
    }, () => setDetecting(false));
  };

  const deleteMsg = async (msgId: string) => {
    const ok = await confirm({ message: lang === 'ar' ? 'حذف الرسالة؟' : 'Delete message?', variant: 'danger' });
    if (ok) {
      const { error } = await supabase.from('messages').delete().eq('id', msgId);
      if (!error) setMessages(prev => prev.filter(m => m.id !== msgId));
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      <p className="font-black text-blue-900">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto h-[calc(100dvh-80px)] md:h-[calc(100vh-120px)] flex flex-col bg-white relative overflow-hidden md:rounded-[3rem] md:shadow-2xl border border-slate-100">
      
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 flex items-center justify-between shadow-xl shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => navigate('/messages')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            {lang === 'ar' ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
          </button>
          
          <div 
            onClick={() => otherPerson && navigate(`/profile/${otherPerson.id}`)}
            className="flex items-center gap-3 cursor-pointer p-1.5 rounded-2xl transition-all flex-1 min-w-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-700 overflow-hidden border-2 border-blue-600 shrink-0">
              {otherPerson?.avatar_url ? (
                <img src={otherPerson.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm truncate">{otherPerson?.full_name || (lang === 'ar' ? 'مستخدم' : 'User')}</h3>
              <div className="flex items-center gap-1 opacity-70">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className="text-[10px] font-bold uppercase">{lang === 'ar' ? 'عرض الملف' : 'Profile'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar bg-slate-50/50"
        style={{ backgroundImage: 'radial-gradient(#cbd5e1 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}
      >
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          const isLocation = msg.text?.includes('google.com/maps');

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
              <div className={`max-w-[85%] px-4 py-3 shadow-sm relative ${
                isMine ? 'bg-blue-600 text-white rounded-[1.5rem] rounded-tr-none' : 'bg-white text-slate-800 rounded-[1.5rem] rounded-tl-none border border-slate-100'
              }`}>
                {isLocation ? (
                  <a href={msg.text} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 font-black text-xs ${isMine ? 'text-white' : 'text-blue-600'}`}>
                    <MapPin className="w-4 h-4" /> {lang === 'ar' ? 'مشاركة الموقع' : 'Location Share'}
                  </a>
                ) : <p className="text-sm font-bold whitespace-pre-wrap">{msg.text}</p>}
                
                <div className="flex items-center justify-between gap-4 mt-1">
                  <span className="text-[9px] opacity-50">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMine && !msg.id.startsWith('temp-') && (
                    <button onClick={() => deleteMsg(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-200 hover:text-white transition-opacity">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emoji Picker - Added missing component */}
      {showEmojis && (
        <div className="absolute bottom-24 right-4 left-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 z-[100] animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اختر سمايل</span>
            <button onClick={() => setShowEmojis(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-48 overflow-y-auto no-scrollbar">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  setInputText(prev => prev + emoji);
                  textareaRef.current?.focus();
                }}
                className="text-2xl p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 relative z-[50]">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-grow flex items-end bg-slate-100 rounded-[1.8rem] px-3 py-1 border border-slate-200">
            <button 
              type="button" 
              onClick={() => setShowEmojis(!showEmojis)} 
              className={`p-2 transition-colors ${showEmojis ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}
            >
              <Smile className="w-6 h-6" />
            </button>
            <button type="button" onClick={handleLocationShare} disabled={detecting} className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-50">
              {detecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <MapPin className="w-6 h-6" />}
            </button>
            <textarea 
              ref={textareaRef}
              rows={1}
              value={inputText} 
              onChange={e => { 
                setInputText(e.target.value); 
                e.target.style.height = 'auto'; 
                e.target.style.height = e.target.scrollHeight + 'px'; 
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder={lang === 'ar' ? "اكتب رسالة..." : "Message..."} 
              className="flex-grow bg-transparent border-none py-3 px-2 text-sm font-black outline-none resize-none max-h-32"
            />
          </div>
          <button onClick={() => handleSendMessage()} disabled={!inputText.trim()} className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-50 shrink-0">
            <Send className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;

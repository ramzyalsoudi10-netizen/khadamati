
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useApp } from '../App';
import { useConfirm } from '../ConfirmProvider';
import { 
  MessageSquare, 
  User, 
  Trash2, 
  Loader2,
  CheckSquare,
  X
} from 'lucide-react';
import { Conversation } from '../types';

const ChatList: React.FC = () => {
  const { user, lang, refreshUnread } = useApp();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    fetchConversations();
    const sub = supabase.channel('chats_realtime')
      .on('postgres_changes', { event: '*', table: 'conversations' }, () => fetchConversations())
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, () => fetchConversations())
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [user?.id]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`*, donor_profile:profiles!donor_id(*), requester_profile:profiles!requester_id(*)`)
        .or(`donor_id.eq.${user.id},requester_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      refreshUnread();
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const isUnread = (conv: Conversation) => {
    if (!user) return false;
    let readStatus = {};
    try {
      readStatus = JSON.parse(localStorage.getItem(`read_status_${user.id}`) || '{}');
    } catch (e) { readStatus = {}; }
    const lastRead = (readStatus as any)[conv.id] || '1970-01-01T00:00:00Z';
    return new Date(conv.last_message_at) > new Date(lastRead);
  };

  const deleteConv = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({ message: lang === 'ar' ? 'حذف المحادثة نهائياً؟ سيتم مسح جميع الرسائل.' : 'Delete conversation permanently?', variant: 'danger' });
    if (ok) {
      await supabase.from('messages').delete().eq('conversation_id', id);
      await supabase.from('conversations').delete().eq('id', id);
      setConversations(prev => prev.filter(c => c.id !== id));
      refreshUnread();
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 mb-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              {lang === 'ar' ? 'المحادثات' : 'Chats'}
              {conversations.some(isUnread) && <span className="w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></span>}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              {lang === 'ar' ? 'تواصل مباشرة مع مقدمي الخدمات' : 'Connect directly with service providers'}
            </p>
          </div>
          <button 
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`p-3 rounded-2xl transition-all shadow-sm flex items-center gap-2 ${isSelectionMode ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-400 border border-slate-100'}`}
            title={lang === 'ar' ? 'تفعيل وضع الحذف' : 'Enable delete mode'}
          >
            {isSelectionMode ? (
              <>
                <X className="w-5 h-5" />
                <span className="text-xs font-black hidden sm:inline">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-5 h-5" />
                <span className="text-xs font-black hidden sm:inline">{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-16 text-center border-2 border-dashed border-slate-100 flex flex-col items-center shadow-sm">
          <MessageSquare className="w-16 h-16 text-slate-200 mb-6" />
          <h3 className="font-black text-slate-400 text-xl">{lang === 'ar' ? 'لا توجد محادثات نشطة' : 'No active chats'}</h3>
        </div>
      ) : (
        <div className="grid gap-3">
          {conversations.map((conv) => {
            const other = user.id === conv.donor_id ? conv.requester_profile : conv.donor_profile;
            const hasNewMessage = isUnread(conv);

            return (
              <div 
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className={`group flex items-center gap-4 p-5 bg-white rounded-[2rem] border transition-all cursor-pointer relative active:scale-[0.98]
                  ${hasNewMessage ? 'border-blue-300 bg-blue-50/30 shadow-md ring-1 ring-blue-100' : 'border-slate-50 hover:border-blue-100 shadow-sm'}`}
              >
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-[1.4rem] bg-blue-600 overflow-hidden border-2 border-white shadow-md flex items-center justify-center text-white">
                    {other?.avatar_url ? <img src={other.avatar_url} className="w-full h-full object-cover" /> : <User className="w-8 h-8" />}
                  </div>
                  {hasNewMessage && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-4 border-white rounded-full animate-bounce shadow-lg"></span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-base font-black truncate ${hasNewMessage ? 'text-blue-950' : 'text-slate-800'}`}>
                      {other?.full_name || 'مستخدم'}
                    </h4>
                    <span className="text-[10px] font-black text-slate-300">
                      {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold truncate pr-4 ${hasNewMessage ? 'text-blue-600' : 'text-slate-400'}`}>
                      {hasNewMessage ? (lang === 'ar' ? 'اضغط لقراءة الرسالة الجديدة ✨' : 'Click to read new message ✨') : (lang === 'ar' ? 'متابعة الدردشة...' : 'Continue chat...')}
                    </p>
                    
                    {/* زر الحذف - تم تعديله ليكون مرئياً في الهاتف عند تفعيل وضع التحديد */}
                    <button 
                      onClick={(e) => deleteConv(conv.id, e)}
                      className={`p-3 text-red-600 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90
                        ${isSelectionMode ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-50 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:scale-100 lg:group-hover:pointer-events-auto'}`}
                      title={lang === 'ar' ? 'حذف هذه المحادثة' : 'Delete this chat'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;

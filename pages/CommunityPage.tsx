
import React, { useState, useEffect } from 'react';
// Fixing react-router-dom import
import { useNavigate } from 'react-router-dom';
import { supabase, BUCKETS } from '../supabase';
import { useApp } from '../App';
import { Search, User, Loader2, MapPin, Heart, ShieldCheck, ChevronRight } from 'lucide-react';
import { Profile } from '../types';

const CommunityPage: React.FC = () => {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, 300); // تقليل التأخير لسرعة الاستجابة
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const fetchData = async () => {
    const cleanQuery = searchQuery.replace(/[@\s]/g, '').trim();
    if (cleanQuery.length > 0) {
      await fetchUsers(cleanQuery);
    } else {
      await fetchTopUsers();
    }
  };

  const fetchUsers = async (query: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(30);
        
      if (error) throw error;
      setUsers(data || []);
    } catch (err) { 
      console.error("Search Error:", err); 
    }
    finally { setLoading(false); }
  };

  const fetchTopUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('meals_given', { ascending: false })
        .limit(15);
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) { 
      console.error("Fetch Top Users Error:", err); 
    }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 animate-in fade-in duration-700">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-black text-emerald-950 tracking-tighter">{t('community')}</h2>
          {searchQuery && !loading && <span className="text-emerald-500 font-bold text-sm">{users.length} {lang === 'ar' ? 'نتائج' : 'results'}</span>}
        </div>
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-300" />
          <input 
            type="text" 
            placeholder={t('searchUser')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-6 pl-16 bg-white border border-emerald-50 rounded-[2rem] shadow-sm outline-none focus:ring-4 focus:ring-amber-400/20 font-bold transition-all"
          />
          {loading && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 animate-spin text-emerald-900" />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.length > 0 ? users.map(u => {
          return (
            <div 
              key={u.id} 
              onClick={() => navigate(`/profile/${u.id}`)}
              className="bg-white p-6 rounded-[2.5rem] border border-emerald-50 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center gap-5"
            >
              <div className="w-20 h-20 rounded-[1.5rem] bg-amber-400 flex items-center justify-center text-emerald-900 overflow-hidden shrink-0 shadow-lg border-4 border-white">
                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <User className="w-10 h-10" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-emerald-950 truncate">{u.full_name}</h4>
                  {u.is_verified && <ShieldCheck className="w-4 h-4 text-amber-500" />}
                </div>
                <p className="text-emerald-500 font-bold text-sm">@{u.username || 'user'}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Heart className="w-3 h-3 fill-emerald-400" /> {u.meals_given}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">
                    <MapPin className="w-3 h-3" /> {u.country || '-'}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-6 h-6 text-emerald-200 group-hover:text-amber-500 transition-all ${lang === 'ar' ? 'rotate-180' : ''}`} />
            </div>
          );
        }) : !loading && (
          <div className="col-span-full py-20 text-center bg-white/50 rounded-[3rem] border border-dashed border-emerald-100">
            <User className="w-12 h-12 text-emerald-100 mx-auto mb-4" />
            <p className="text-emerald-500 font-bold text-lg">{lang === 'ar' ? 'لم يتم العثور على مستخدمين بهذا الاسم' : 'No users found with this name'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useApp } from '../App';
import { 
  User, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  Star,
  Copy,
  Check,
  ShieldCheck,
  Phone,
  AtSign,
  MapPin,
  Award,
  Info
} from 'lucide-react';
import { Profile } from '../types';

const ProfileViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser, lang } = useApp();
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hoverStar, setHoverStar] = useState(0);
  const [alreadyRated, setAlreadyRated] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProfile();
      checkIfAlreadyRated();
    }
  }, [id, authUser?.id]);

  const checkIfAlreadyRated = async () => {
    if (!authUser || !id) return;
    try {
      // التحقق أولاً من التخزين المحلي لمنع الطلبات غير الضرورية
      const localRated = JSON.parse(localStorage.getItem(`rated_v4_${authUser.id}`) || '[]');
      if (localRated.includes(id)) {
        setAlreadyRated(true);
        return;
      }

      // محاولة فحص جدول المراجعات إذا كان متاحاً
      const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('profile_id', id)
        .eq('user_id', authUser.id)
        .maybeSingle();
      
      if (data && !error) setAlreadyRated(true);
    } catch (err) {
      console.warn("Reviews table check skipped - might not exist yet.");
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setTargetProfile(data);
    } catch (err) {
      console.error("Fetch Profile Error:", err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (stars: number) => {
    if (!authUser) {
      alert("يرجى تسجيل الدخول أولاً");
      navigate('/auth');
      return;
    }
    if (authUser.id === id) {
      alert("لا يمكنك تقييم نفسك");
      return;
    }
    if (alreadyRated) return;

    setRatingLoading(true);
    try {
      // 1. محاولة الحفظ في جدول المراجعات (اختياري، لن يوقف العملية إذا فشل)
      try {
        await supabase
          .from('reviews')
          .insert({ profile_id: id, user_id: authUser.id, rating: stars });
      } catch (e) {
        console.warn("Table 'reviews' missing. Proceeding with atomic profile update only.");
      }

      // 2. تحديث جدول البروفايل باستخدام reviews_count حصراً (لتجنب PGRST204)
      const currentRating = targetProfile?.rating || 0;
      const currentCount = targetProfile?.reviews_count || 0;
      
      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + stars) / newCount;
      const fixedRating = Number(newRating.toFixed(2));

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          rating: fixedRating,
          reviews_count: newCount 
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      // حفظ الحالة محلياً
      const localRated = JSON.parse(localStorage.getItem(`rated_v4_${authUser.id}`) || '[]');
      localRated.push(id);
      localStorage.setItem(`rated_v4_${authUser.id}`, JSON.stringify(localRated));

      setAlreadyRated(true);
      await fetchProfile(); // تحديث الواجهة ببيانات القاعدة
      alert("شكراً لك! تم تسجيل تقييمك بنجاح.");
    } catch (err: any) {
      console.error("Critical Rating Error:", err);
      alert("حدث خطأ أثناء الحفظ. تأكد من إعدادات قاعدة البيانات.");
    } finally {
      setRatingLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleMessage = async () => {
    if (!authUser) { navigate('/auth'); return; }
    if (!id) return;
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(donor_id.eq.${authUser.id},requester_id.eq.${id}),and(donor_id.eq.${id},requester_id.eq.${authUser.id})`)
      .maybeSingle();

    if (existing) {
      navigate(`/chat/${existing.id}`);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ donor_id: authUser.id, requester_id: id, last_message_at: new Date().toISOString() })
        .select()
        .single();
      if (newConv) navigate(`/chat/${newConv.id}`);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-blue-900" />
      <p className="text-blue-900 font-black">جاري التحميل...</p>
    </div>
  );

  if (!targetProfile) return null;

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 animate-in fade-in slide-in-from-bottom duration-700">
      <div className="flex items-center justify-between mb-8 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 font-black bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
          {lang === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />} 
          رجوع
        </button>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-50 overflow-hidden">
        <div className="h-44 bg-gradient-to-l from-blue-700 to-blue-500 relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="absolute -bottom-16 left-0 right-0 flex justify-center md:justify-start md:px-12">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-[3.5rem] bg-white border-[10px] border-white shadow-2xl overflow-hidden flex items-center justify-center relative group">
              {targetProfile.avatar_url ? (
                <img src={targetProfile.avatar_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
              ) : (
                <User className="w-20 h-20 text-blue-100" />
              )}
            </div>
          </div>
        </div>

        <div className="pt-20 px-6 md:px-12 pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="text-center md:text-right space-y-2">
               <div className="flex items-center justify-center md:justify-start gap-3">
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{targetProfile.full_name}</h1>
                  {targetProfile.is_verified && <ShieldCheck className="w-8 h-8 text-blue-600 fill-blue-50" />}
               </div>
               <div className="flex items-center justify-center md:justify-start gap-2 text-blue-600 font-black">
                  <AtSign className="w-4 h-4" />
                  <span>{targetProfile.username || 'user'}</span>
               </div>
            </div>

            <div className="flex justify-center md:justify-end gap-3">
              {authUser?.id !== id && (
                <button 
                  onClick={handleMessage}
                  className="px-10 py-4 bg-blue-600 text-white rounded-3xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3"
                >
                  <MessageSquare className="w-6 h-6" />
                  مراسلة
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center gap-2">
                  <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 mb-2">
                    <Star className="w-8 h-8 fill-current" />
                  </div>
                  <span className="text-4xl font-black text-slate-900">{(targetProfile.rating || 0).toFixed(1)}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">متوسط التقييم</span>
                </div>
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center gap-2">
                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 mb-2">
                    <Award className="w-8 h-8" />
                  </div>
                  <span className="text-4xl font-black text-slate-900">{targetProfile.reviews_count || 0}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي التقييمات</span>
                </div>
              </div>

              {authUser?.id !== id && (
                <div className="bg-gradient-to-br from-amber-50 to-white p-10 rounded-[3rem] border border-amber-100 shadow-sm text-center md:text-right">
                  <h3 className="text-xl font-black text-amber-900 mb-2 flex items-center justify-center md:justify-start gap-3">
                    <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                    قيم تجربتك مع هذا الفني
                  </h3>
                  {alreadyRated ? (
                    <div className="p-6 bg-green-50 rounded-2xl border border-green-100 text-green-700 font-black text-sm flex items-center justify-center gap-3">
                      <ShieldCheck className="w-6 h-6" />
                      شكراً لك! لقد قمت بتقييم هذا العضو مسبقاً.
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-amber-700 font-bold mb-8">رأيك يساعد الآخرين في الوصول لأفضل الفنيين.</p>
                      <div className="flex items-center justify-center md:justify-start gap-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            disabled={ratingLoading}
                            onMouseEnter={() => setHoverStar(star)}
                            onMouseLeave={() => setHoverStar(0)}
                            onClick={() => handleRating(star)}
                            className={`p-1 transition-all hover:scale-125 disabled:opacity-50 ${(hoverStar || 0) >= star ? 'text-amber-400 scale-110' : 'text-slate-200'}`}
                          >
                            <Star className={`w-12 h-12 ${(hoverStar || 0) >= star ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {ratingLoading && <p className="text-xs font-black text-amber-600 mt-4 animate-pulse">جاري تحديث البيانات...</p>}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-slate-900 px-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" /> معلومات التواصل
              </h3>
              
              <ContactCard 
                icon={<Phone className="w-5 h-5" />} 
                label="رقم الهاتف" 
                value={targetProfile.phone || 'غير متاح'} 
                onCopy={() => handleCopy(targetProfile.phone || '', 'phone')}
                isCopied={copiedField === 'phone'}
              />
              
              <ContactCard 
                icon={<MapPin className="w-5 h-5" />} 
                label="المحافظة" 
                value={targetProfile.city || 'الأردن'} 
                onCopy={() => handleCopy(targetProfile.city || '', 'city')}
                isCopied={copiedField === 'city'}
              />

              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 mt-6 text-right">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">تاريخ الانضمام</p>
                <p className="font-bold text-blue-900 text-sm">{targetProfile.created_at ? new Date(targetProfile.created_at).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long' }) : 'قريباً'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactCard = ({ icon, label, value, onCopy, isCopied }: any) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between group hover:shadow-lg hover:border-blue-100 transition-all">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
        {icon}
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="font-black text-slate-900">{value}</p>
      </div>
    </div>
    <button onClick={onCopy} className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
      {isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
    </button>
  </div>
);

export default ProfileViewPage;

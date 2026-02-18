
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useApp } from '../App';
import { useConfirm } from '../ConfirmProvider';
import { 
  MapPin, Phone, MessageCircle, Loader2, 
  Search, User, Star, Trash2, X, Briefcase, Home, SlidersHorizontal, Copy, Check, Wrench, ShieldCheck, Award
} from 'lucide-react';
import { IftarRequest } from '../types';

const DonorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, lang } = useApp();
  const { confirm } = useConfirm();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<IftarRequest[]>([]);
  const [myServices, setMyServices] = useState<IftarRequest[]>([]);
  const [selectedService, setSelectedService] = useState<IftarRequest | null>(null);
  const [showMyServicesModal, setShowMyServicesModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [processingChat, setProcessingChat] = useState(false);
  
  const [filterType, setFilterType] = useState(searchParams.get('type') || "");
  const [filterCity, setFilterCity] = useState(searchParams.get('city') || "");
  const [filterArea, setFilterArea] = useState(searchParams.get('area') || "");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = ["أعمال سباكة", "أعمال كهرباء", "دهان وديكور", "تنظيف منازل", "صيانة مكيفات", "نجارة والمنيوم", "صيانة عامة", "تركيب أثاث", "نقل عفش", "حدادة وألمنيوم"];
  const provinces = ["عمان", "إربد", "الزرقاء", "البلقاء", "مادبا", "الكرك", "معان", "العقبة", "جرش", "عجلون", "المفرق", "الطفيلة"];

  const jordanRegions: Record<string, string[]> = {
    "عمان": ["قصبة عمان", "لواء ماركا", "لواء القويسمة", "لواء الجامعي", "لواء وادي السير", "لواء ناعور", "لواء سحاب", "لواء الجيزة", "لواء الموقر", "تلاع العلي", "خلدا", "عبدون", "الصويفية", "الشميساني", "جبل الحسين", "شفا بدران", "أبو نصير"],
    "إربد": ["قصبة إربد", "لواء بني كنانة", "لواء الرمثا", "لواء الكورة", "لواء بني عبيد", "لواء المزار الشمالي", "لواء الطيبة", "لواء الوسطية", "لواء الأغوار الشمالية"],
    "الزرقاء": ["قصبة الزرقاء", "لواء الرصيفة", "لواء الهاشمية", "المنطقة الحرة", "بيرين", "الظليل"],
    "البلقاء": ["قصبة السلط", "لواء ماحص وفحيص", "لواء عين الباشا", "لواء الشونة الجنوبية", "لواء دير علا", "زي", "علان"],
    "مادبا": ["قصبة مادبا", "لواء ذيبان", "ماعين", "الفيصلية"],
    "الكرك": ["قصبة الكرك", "لواء المزار الجنوبي", "لواء القصر", "لواء الأغوار الجنوبية", "لواء عي", "لواء فقوع", "لواء القطرانة"],
    "معان": ["قصبة معان", "لواء البتراء", "لواء الشوبك", "لواء الحسينية", "إذرح"],
    "العقبة": ["قصبة العقبة", "لواء القويرة", "وادي رم", "الديسة"],
    "جرش": ["قصبة جرش", "المصطبة", "برما", "الكتة", "سوف"],
    "عجلون": ["قصبة عجلون", "لواء كفرنجة", "صخرة", "عبين وعبلين"],
    "المفرق": ["قصبة المفرق", "لواء الرويشد", "لواء البادية الشمالية", "لواء البادية الغربية", "بلعما"],
    "الطفيلة": ["قصبة الطفيلة", "لواء بصيرا", "لواء الحسا", "العين البيضاء"]
  };

  useEffect(() => {
    fetchServices();
  }, [filterType, filterCity, filterArea, searchTerm, user?.id]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*, profiles:profiles!requester_id(*)')
        .eq('status', 'open');
      if (error) throw error;
      
      let allServices = data || [];
      if (user) setMyServices(allServices.filter(s => s.requester_id === user.id));

      let filtered = allServices;
      if (filterType) filtered = filtered.filter(r => r.note?.includes(`[Service: ${filterType}]`));
      if (filterCity) filtered = filtered.filter(r => r.note?.includes(`[Province: ${filterCity}]`));
      if (filterArea) filtered = filtered.filter(r => r.note?.includes(`[Area: ${filterArea}]`));
      
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(r => 
          r.profiles?.full_name?.toLowerCase().includes(lowerSearch) || 
          r.profiles?.username?.toLowerCase().includes(lowerSearch)
        );
      }

      filtered.sort((a, b) => (b.profiles?.rating || 0) - (a.profiles?.rating || 0));
      setServices(filtered);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleStartChat = async (request: IftarRequest) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (request.requester_id === user.id) {
      alert(lang === 'ar' ? "لا يمكنك مراسلة نفسك" : "You cannot message yourself");
      return;
    }

    setProcessingChat(true);
    try {
      // البحث عن محادثة سابقة لنفس الخدمة
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('request_id', request.id)
        .eq('donor_id', user.id)
        .maybeSingle();

      if (existing) {
        navigate(`/chat/${existing.id}`);
      } else {
        // إنشاء محادثة جديدة
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            request_id: request.id,
            donor_id: user.id,
            requester_id: request.requester_id,
            last_message_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        if (newConv) navigate(`/chat/${newConv.id}`);
      }
    } catch (err: any) {
      console.error("Chat creation error:", err);
      alert(lang === 'ar' ? "فشل بدء المحادثة، جرب لاحقاً" : "Failed to start chat, try again later");
    } finally {
      setProcessingChat(false);
      setSelectedService(null);
    }
  };

  const deleteService = async (serviceId: string) => {
    const ok = await confirm({ title: "حذف الخدمة", message: "هل أنت متأكد من حذف هذا الإعلان؟", variant: 'danger' });
    if (ok) {
      try {
        await supabase.from('requests').delete().eq('id', serviceId);
        fetchServices();
      } catch (err: any) { alert(err.message); }
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const parseInfo = (note?: string) => {
    if (!note) return { service: "فني متخصص", city: "الأردن", area: "", phone: "", bio: "فني محترف جاهز للعمل" };
    const service = note.match(/\[Service: (.*?)\]/)?.[1] || "فني متخصص";
    const city = note.match(/\[Province: (.*?)\]/)?.[1] || "الأردن";
    const area = note.match(/\[Area: (.*?)\]/)?.[1] || "";
    const phone = note.match(/\[Phone: (.*?)\]/)?.[1] || "";
    let bio = note.replace(/\[Service:.*?\]|\[Province:.*?\]|\[Area:.*?\]|\[Phone:.*?\]/gi, '').trim();
    return { service, city, area, phone, bio: bio || "فني محترف وموثوق، جاهز لتقديم الخدمة." };
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">سوق الخدمات</h2>
          <p className="text-slate-500 font-bold text-xs mt-1">اكتشف أفضل الفنيين الموثوقين في منطقتك</p>
        </div>
        {myServices.length > 0 && (
          <button onClick={() => setShowMyServicesModal(true)} className="p-4 bg-blue-900 text-white rounded-2xl shadow-xl active:scale-95 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            <span className="font-black text-xs">إعلاناتي ({myServices.length})</span>
          </button>
        )}
      </div>

      <div className="mb-6 bg-white p-5 rounded-[2.2rem] shadow-xl border border-slate-100 flex flex-col gap-4">
        <div className="relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
          <input 
            type="text" 
            placeholder="ابحث عن فني أو تخصص..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pr-12 pl-6 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
           <div className="relative">
              <SlidersHorizontal className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full h-12 pr-11 pl-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs outline-none appearance-none cursor-pointer">
                <option value="">كل التخصصات</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>
           <div className="relative">
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
              <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setFilterArea(""); }} className="w-full h-12 pr-11 pl-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs outline-none appearance-none cursor-pointer">
                <option value="">كل المحافظات</option>
                {provinces.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>
           <div className="relative">
              <Home className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
              <select value={filterArea} onChange={e => setFilterArea(e.target.value)} disabled={!filterCity} className="w-full h-12 pr-10 pl-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs outline-none appearance-none cursor-pointer disabled:opacity-50">
                <option value="">كل المناطق</option>
                {filterCity && jordanRegions[filterCity]?.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-900" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 font-black text-slate-400">لا توجد خدمات مطابقة لبحثك حالياً</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map(item => {
            const info = parseInfo(item.note);
            const ratingValue = item.profiles?.rating || 0;
            const reviewCount = item.profiles?.reviews_count || 0;

            return (
              <div key={item.id} onClick={() => setSelectedService(item)} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm cursor-pointer hover:shadow-2xl hover:-translate-y-1.5 transition-all flex flex-col gap-5 group relative overflow-hidden">
                <div className="absolute top-4 left-4 flex items-center gap-1 bg-amber-400 text-white px-3 py-1.5 rounded-full shadow-lg z-10 border-2 border-white">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[11px] font-black">{ratingValue.toFixed(1)}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 overflow-hidden shrink-0 border-2 border-white shadow-md">
                    {item.profiles?.avatar_url ? <img src={item.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white"><User className="w-7 h-7" /></div>}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-1">
                      <h4 className="font-black text-slate-900 text-sm truncate">{item.profiles?.full_name}</h4>
                      {item.profiles?.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                    <p className="text-[10px] font-black text-blue-500">@{item.profiles?.username || 'user'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100 group-hover:bg-blue-600 group-hover:border-blue-700 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:bg-white group-hover:text-blue-600 transition-all group-hover:rotate-6">
                     <Wrench className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter mb-0.5 group-hover:text-blue-100 transition-colors">التخصص الفني</span>
                    <span className="text-xs font-black text-slate-900 group-hover:text-white transition-colors">{info.service}</span>
                  </div>
                </div>
                
                <div className="bg-slate-50/80 p-4 rounded-[1.8rem] border border-slate-100 min-h-[80px]">
                   <p className="text-[11px] font-bold text-slate-600 leading-relaxed line-clamp-3">
                     {info.bio}
                   </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                   <div className="flex items-center gap-1.5 text-[10px] text-slate-900 font-black truncate">
                     <MapPin className="w-3.5 h-3.5 text-orange-500" /> 
                     {info.city} {info.area && `• ${info.area}`}
                   </div>
                   <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                      <Award className="w-3 h-3 text-blue-600" />
                      <span className="text-[10px] font-black text-slate-500">{reviewCount} تقييم</span>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedService && (() => {
        const info = parseInfo(selectedService.note);
        const ratingValue = selectedService.profiles?.rating || 0;
        const reviewCount = selectedService.profiles?.reviews_count || 0;

        return (
          <div className="fixed inset-0 z-[1100] bg-slate-950/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-t-[3rem] md:rounded-[4rem] shadow-2xl p-8 md:p-14 space-y-8 animate-in slide-in-from-bottom relative">
                 <button onClick={() => setSelectedService(null)} className="absolute top-8 left-8 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><X className="w-5 h-5" /></button>
                 
                 <div className="flex flex-col items-center gap-4 text-center pt-4">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-blue-600 overflow-hidden shadow-2xl border-[6px] border-slate-50">
                       {selectedService.profiles?.avatar_url ? <img src={selectedService.profiles.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-white" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <h3 className="text-2xl font-black text-slate-950">{selectedService.profiles?.full_name}</h3>
                        <button onClick={() => handleCopy(selectedService.profiles?.full_name || '', 'name')} className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600">
                           {copiedField === 'name' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 mb-2">
                         <div className="px-6 py-2 bg-gradient-to-l from-blue-700 to-blue-600 text-white rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 border-b-4 border-blue-900">
                           <Wrench className="w-4 h-4" />
                           {info.service}
                         </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-2">
                        <div className="flex items-center gap-1.5 bg-amber-400 text-white px-5 py-2 rounded-full font-black text-sm shadow-md">
                          <Star className="w-4 h-4 fill-current" />
                          {ratingValue.toFixed(1)}
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold">بناءً على {reviewCount} تقييم حقيقي</span>
                      </div>
                    </div>
                 </div>

                 <div className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-3">
                     <div className="p-3 bg-orange-50 rounded-2xl text-orange-500">
                        <Phone className="w-5 h-5" />
                     </div>
                     <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رقم التواصل</p>
                       <p className="text-lg font-black text-slate-900">{info.phone}</p>
                     </div>
                   </div>
                   <button onClick={() => handleCopy(info.phone, 'phone')} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600">
                      {copiedField === 'phone' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                   </button>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <a href={`tel:${info.phone}`} className="flex flex-col items-center justify-center gap-2 h-20 bg-orange-600 text-white rounded-[2rem] shadow-xl active:scale-95 transition-all"><Phone className="w-6 h-6" /><span className="text-xs font-black">اتصال مباشر</span></a>
                    <button 
                      onClick={() => handleStartChat(selectedService)} 
                      disabled={processingChat}
                      className="flex flex-col items-center justify-center gap-2 h-20 bg-blue-900 text-white rounded-[2rem] shadow-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                      {processingChat ? <Loader2 className="w-6 h-6 animate-spin" /> : <MessageCircle className="w-6 h-6" />}
                      <span className="text-xs font-black">بدء دردشة</span>
                    </button>
                 </div>
                 
                 <button onClick={() => { setSelectedService(null); navigate(`/profile/${selectedService.requester_id}`); }} className="w-full py-4 bg-slate-50 text-slate-700 rounded-2xl font-black text-xs hover:bg-slate-100 flex items-center justify-center gap-2">
                    <User className="w-4 h-4" /> عرض ملف الفني بالكامل
                 </button>
            </div>
          </div>
        );
      })()}

      {showMyServicesModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
             <div className="p-6 bg-slate-900 text-white flex items-center justify-between"><h3 className="font-black text-right">إعلاناتي المنشورة</h3><button onClick={() => setShowMyServicesModal(false)}><X className="w-6 h-6" /></button></div>
             <div className="p-6 space-y-3">
                {myServices.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <button onClick={() => deleteService(item.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                     <div className="flex flex-col text-right">
                        <span className="font-black text-slate-900 text-sm">{parseInfo(item.note).service}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{parseInfo(item.note).city}</span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;

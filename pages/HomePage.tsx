
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { supabase } from '../supabase';
import { 
  Star, MapPin, Wrench, Search, 
  ShieldCheck, Hammer, Users, Navigation, Loader2, Sparkles, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { Profile } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [topTechnicians, setTopTechnicians] = useState<Profile[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(true);

  // قائمة كافة المحافظات الأردنية الـ 12
  const cities = ["عمان", "إربد", "الزرقاء", "البلقاء", "مادبا", "الكرك", "معان", "العقبة", "جرش", "عجلون", "المفرق", "الطفيلة"];
  const servicesList = ["أعمال سباكة", "أعمال كهرباء", "دهان وديكور", "تنظيف منازل", "صيانة مكيفات"];

  useEffect(() => {
    fetchTopTechs();
  }, []);

  const fetchTopTechs = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'requester')
        .order('rating', { ascending: false })
        .limit(3);
      if (data) setTopTechnicians(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTechs(false);
    }
  };

  const handleSearch = () => {
    let url = "/donor";
    const params = new URLSearchParams();
    if (selectedService) params.append('type', selectedService);
    if (selectedCity) params.append('city', selectedCity);
    if (params.toString()) url += `?${params.toString()}`;
    navigate(url);
  };

  return (
    <div className="animate-in fade-in duration-700 pb-20 overflow-x-hidden bg-[#f8fafc]">
      
      {/* Modern Professional Banner */}
      <section className="relative min-h-[500px] md:min-h-[600px] flex items-center pt-10 pb-20 px-4 md:px-12 rounded-b-[4rem] md:rounded-b-[6rem] overflow-hidden shadow-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>

        <div className="container mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="max-w-4xl space-y-8 animate-in slide-in-from-top duration-1000">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white font-black text-xs md:text-sm tracking-widest uppercase">
              <Sparkles className="w-4 h-4 text-orange-400" />
              المنصة الأولى للصيانة في الأردن
            </div>
            
            <h1 className="text-4xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">
              منزلك يستحق <span className="text-orange-400">الأفضل</span> <br />
              اطلب خدمتك الآن
            </h1>
            
            <p className="text-blue-100 font-bold text-lg md:text-2xl opacity-80 max-w-2xl mx-auto">
              نحن نصلك بأمهر الفنيين الموثوقين في منطقتك، بجودة مضمونة وسعر عادل.
            </p>

            {/* Glass Search Box */}
            <div className="bg-white/10 backdrop-blur-2xl p-4 md:p-6 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-white/20 flex flex-col md:flex-row items-center gap-4 w-full max-w-3xl mx-auto">
              <div className="flex-1 w-full relative">
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
                <select 
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full h-14 bg-white/90 border-none rounded-2xl px-12 font-black text-sm outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/20 transition-all text-slate-900"
                >
                  <option value="">كل المحافظات بالأردن...</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex-1 w-full relative">
                <Wrench className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
                <select 
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full h-14 bg-white/90 border-none rounded-2xl px-12 font-black text-sm outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/20 transition-all text-slate-900"
                >
                  <option value="">نوع الخدمة...</option>
                  {servicesList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <button 
                onClick={handleSearch}
                className="w-full md:w-auto px-12 h-14 bg-orange-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-500/30 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                بحث
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-white/70 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> فنيين موثوقين
              </div>
              <div className="flex items-center gap-2 text-white/70 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> ضمان الجودة
              </div>
              <div className="flex items-center gap-2 text-white/70 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> دعم فني 24/7
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4 md:px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <CategoryCard 
            img="https://cityupload.io/2026/02/Whisk-a41a522842f5da2b70b47f631020429fdr.png" 
            title="أعمال سباكة" 
            desc="إصلاح وتركيب" 
            onClick={() => navigate('/donor?type=أعمال سباكة')}
          />
          <CategoryCard 
            img="https://cityupload.io/2026/02/Whisk-851fcbff3bc8b33bbe2451633d47ec39dr.png" 
            title="أعمال كهرباء" 
            desc="تمديدات وصيانة" 
            onClick={() => navigate('/donor?type=أعمال كهرباء')}
          />
          <CategoryCard 
            img="https://cityupload.io/2026/02/Whisk-10be7da7f4503e699984fefa4146665fdr.png" 
            title="دهان وديكور" 
            desc="لمسة إبداعية" 
            onClick={() => navigate('/donor?type=دهان وديكور')}
          />
          <CategoryCard 
            img="https://cityupload.io/2026/02/Whisk-f7f25e42e9b97848f57492c7fb40621bdr.png" 
            title="تنظيف منازل" 
            desc="جودة واتقان" 
            onClick={() => navigate('/donor?type=تنظيف منازل')}
          />
        </div>
      </section>

      {/* Best Technicians of the Week Section */}
      <section className="container mx-auto px-6 py-20 mt-12 bg-white/40 rounded-[3rem] md:rounded-[5rem] border border-white/50">
        <div className="flex flex-col items-center mb-16 space-y-4">
           <div className="bg-blue-100 text-blue-600 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">النخبة المختارة</div>
           <h2 className="text-3xl md:text-5xl font-black text-slate-900 text-center tracking-tighter">أفضل الفنيين هذا الأسبوع</h2>
           <div className="w-20 h-1.5 bg-orange-500 rounded-full"></div>
        </div>
        
        {loadingTechs ? (
          <div className="flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-blue-900" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {topTechnicians.length > 0 ? topTechnicians.map((tech) => (
              <TechCard 
                key={tech.id}
                img={tech.avatar_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop"} 
                name={tech.full_name} 
                username={tech.username}
                rating={tech.rating?.toFixed(1) || "5.0"} 
                count={`${tech.city || 'الأردن'}`}
                onClick={() => navigate(`/profile/${tech.id}`)}
              />
            )) : (
              <p className="col-span-full text-center font-bold text-slate-400 py-10">كن أول فني متميز يسجل معنا!</p>
            )}
          </div>
        )}
      </section>

      {/* Modern Ramadan Free Banner */}
      <section className="container mx-auto px-4 md:px-6 my-16">
        <div className="relative group overflow-hidden rounded-[3rem] md:rounded-[4.5rem] bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 shadow-2xl p-8 md:p-16 border-[6px] border-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
            <div className="text-center lg:text-right space-y-6 flex-1">
              <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-2xl font-black text-xs md:text-sm animate-pulse">
                <Sparkles className="w-4 h-4" />
                مبادرة رمضان الخير
              </div>
              <h3 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                الموقع مجاني بالكامل <br className="hidden md:block" /> وبدون إعلانات!
              </h3>
              <p className="text-blue-100 font-bold text-base md:text-xl max-w-2xl">
                بمناسبة شهر رمضان المبارك، نعلن أن استخدام منصة "خدماتي" مجاني تماماً لكافة الفنيين والعملاء، دون أي رسوم أو إعلانات مزعجة. هدفنا هو التيسير عليكم في هذا الشهر الفضيل.
              </p>
              
              <div className="pt-4 flex flex-col md:flex-row items-center gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => navigate('/donor')}
                  className="w-full md:w-auto px-12 py-5 bg-white text-blue-900 rounded-[2rem] font-black text-xl shadow-xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                >
                  ابدأ الاستخدام الآن
                  <ArrowLeft className={`w-5 h-5 transition-transform group-hover/btn:-translate-x-2`} />
                </button>
                <div className="flex items-center gap-2 text-white/70 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-orange-400" />
                  دعم الحرفيين والعملاء مجاناً
                </div>
              </div>
            </div>

            <div className="flex-1 w-full max-w-md hidden lg:block">
               <div className="bg-white/10 backdrop-blur-md p-8 rounded-[3rem] border border-white/20 rotate-3 shadow-2xl">
                  <div className="space-y-4 text-center">
                     <div className="text-6xl font-black text-white mb-2">0</div>
                     <div className="text-blue-100 font-black text-xl uppercase tracking-widest">رسوم اشتراك</div>
                     <div className="h-px bg-white/20 w-1/2 mx-auto my-4"></div>
                     <div className="text-blue-100 font-bold">تجربة خالية من الإعلانات 100%</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Basic Footer Links */}
      <footer className="container mx-auto px-6 pt-16 border-t border-slate-200 mt-12 text-center pb-10">
        <div className="flex items-center justify-center gap-8 mb-8 flex-wrap">
           <button onClick={() => navigate('/info/about')} className="text-slate-500 font-black hover:text-blue-600 transition-colors">من نحن</button>
           <button onClick={() => navigate('/info/privacy')} className="text-slate-500 font-black hover:text-blue-600 transition-colors">سياسة الخصوصية</button>
           <button onClick={() => navigate('/info/faqs')} className="text-slate-500 font-black hover:text-blue-600 transition-colors">الأسئلة الشائعة</button>
        </div>
        <div className="flex items-center justify-center gap-3 mb-6">
           <div className="bg-blue-600 p-2 rounded-xl">
              <Wrench className="w-6 h-6 text-white" />
           </div>
           <span className="text-2xl font-black text-slate-900 tracking-tighter">خدماتي</span>
        </div>
        <p className="text-slate-400 font-bold text-[10px] md:text-xs">© 2026 جميع الحقوق محفوظة لخدماتي - منصة الصيانة الأولى في الأردن</p>
      </footer>
    </div>
  );
};

const CategoryCard = ({ img, title, desc, onClick }: any) => (
  <div onClick={onClick} className="bg-white p-3 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all group border border-slate-100 cursor-pointer text-center space-y-4">
    <div className="aspect-square w-full overflow-hidden rounded-[2rem] bg-slate-50">
      <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={title} />
    </div>
    <div>
      <h3 className="font-black text-slate-900 text-sm md:text-base">{title}</h3>
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{desc}</p>
    </div>
  </div>
);

const TechCard = ({ img, name, username, rating, count, onClick }: any) => (
  <div onClick={onClick} className="bg-white p-8 rounded-[3.5rem] shadow-sm hover:shadow-2xl transition-all cursor-pointer border border-slate-50 flex flex-col items-center gap-6 relative group overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[4rem] -z-10 transition-all group-hover:scale-150"></div>
    <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl rotate-3 group-hover:rotate-0 transition-all">
      <img src={img} className="w-full h-full object-cover" alt={name} />
    </div>
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center gap-1.5 bg-amber-400 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">
        <Star className="w-3.5 h-3.5 fill-current" />
        {rating}
      </div>
      <h4 className="font-black text-slate-900 text-xl tracking-tighter">{name}</h4>
      <p className="text-blue-600 font-black text-xs opacity-70">@{username}</p>
      <div className="flex items-center justify-center gap-1 text-slate-400 font-bold text-[10px] mt-2">
        <MapPin className="w-3 h-3" /> {count}
      </div>
    </div>
  </div>
);

export default HomePage;

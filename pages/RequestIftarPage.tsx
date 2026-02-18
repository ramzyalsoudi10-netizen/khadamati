
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useApp } from '../App';
import { 
  Plus, CheckCircle2, Loader2, Phone, MapPin, Wrench, Info, Home, ChevronDown
} from 'lucide-react';

const RequestIftarPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useApp();
  
  // نستخدم القيم الافتراضية من البروفايل فور التحميل
  const [serviceType, setServiceType] = useState("");
  const [province, setProvince] = useState(profile?.city || "");
  const [area, setArea] = useState("");
  const [contactPhone, setContactPhone] = useState(profile?.phone || "");
  const [professionalBio, setProfessionalBio] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const MAX_BIO_LENGTH = 120;

  const services = ["أعمال سباكة", "أعمال كهرباء", "دهان وديكور", "تنظيف منازل", "صيانة مكيفات", "نجارة والمنيوم", "صيانة عامة", "تركيب أثاث", "نقل عفش", "حدادة وألمنيوم"];
  
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

  const provinces = Object.keys(jordanRegions);

  // تحديث القيم إذا تأخر تحميل البروفايل
  useEffect(() => {
    if (profile) {
      if (!province) setProvince(profile.city || "");
      if (!contactPhone) setContactPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    setArea(""); // ريست للمنطقة عند تغيير المحافظة
  }, [province]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType || !province || !area || !contactPhone || !professionalBio) {
      alert("يرجى إكمال جميع الحقول المطلوبة بدقة");
      return;
    }
    setLoading(true);
    try {
      const noteData = `[Service: ${serviceType}] [Province: ${province}] [Area: ${area}] [Phone: ${contactPhone}] ${professionalBio}`.trim();
      
      const { error } = await supabase.from('requests').insert({
        requester_id: user.id,
        num_people: 1, 
        note: noteData,
        latitude: 0,
        longitude: 0,
        status: 'open'
      });
      if (error) throw error;
      setIsSubmitted(true);
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-6 py-20 flex flex-col items-center animate-in zoom-in duration-500">
        <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-sm w-full text-center border border-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">تم النشر بنجاح</h2>
          <p className="text-slate-500 font-bold text-sm mb-8">إعلانك متاح الآن في {province} - {area}.</p>
          <button onClick={() => navigate('/donor')} className="w-full py-4 bg-[#1e40af] text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">مشاهدة في سوق الخدمات</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-6 animate-in fade-in slide-in-from-bottom-8 pb-24">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-slate-900 text-white flex items-center gap-5">
            <div className="w-14 h-14 bg-[#1e40af] rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">إضافة خدمة للسوق</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">حدد تخصصك وموقعك بدقة للوصول للعملاء</p>
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 mr-1 uppercase">التخصص الفني</label>
                <div className="relative">
                  <Wrench className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                  <select value={serviceType} onChange={e => setServiceType(e.target.value)} required className="w-full h-12 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-blue-500/10 appearance-none">
                    <option value="">اختر التخصص</option>
                    {services.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 mr-1 uppercase">المحافظة</label>
                <div className="relative">
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                  <select value={province} onChange={e => setProvince(e.target.value)} required className="w-full h-12 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-blue-500/10 appearance-none">
                    <option value="">اختر المحافظة</option>
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 mr-1 uppercase">المنطقة / اللواء</label>
              <div className="relative">
                <Home className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                <select 
                  value={area} 
                  onChange={e => setArea(e.target.value)} 
                  required 
                  disabled={!province}
                  className="w-full h-12 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-blue-500/10 appearance-none disabled:opacity-50"
                >
                  <option value="">اختر المنطقة</option>
                  {province && jordanRegions[province]?.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 mr-1 uppercase">رقم الهاتف للتواصل</label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required placeholder="07XXXXXXXX" className="w-full h-12 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-blue-500/10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                 <label className="text-[11px] font-black text-slate-500 mr-1 uppercase">نبذة عن خبراتك (مختصرة)</label>
                 <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${professionalBio.length >= MAX_BIO_LENGTH ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                   {professionalBio.length} / {MAX_BIO_LENGTH}
                 </span>
              </div>
              <textarea rows={3} maxLength={MAX_BIO_LENGTH} value={professionalBio} onChange={e => setProfessionalBio(e.target.value)} required className="w-full pr-4 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-blue-500/10 resize-none transition-all" placeholder="صف خبرتك بشكل مختصر لجذب العملاء..." />
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-[#ff7332] text-white rounded-2xl font-black text-md shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "نشر إعلان الخدمة"}
            </button>
        </form>
      </div>
    </div>
  );
};

export default RequestIftarPage;

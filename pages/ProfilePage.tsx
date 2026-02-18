
import React, { useState, useEffect } from 'react';
import { supabase, BUCKETS } from '../supabase';
import { useApp } from '../App';
import { User, Phone, Save, Camera, ShieldCheck, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

const ProfilePage: React.FC = () => {
  const { profile, t, refreshProfile } = useApp();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone: '',
    city: '',
    role: 'donor' as UserRole
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cities = ["عمان", "إربد", "الزرقاء", "البلقاء", "مادبا", "الكرك", "معان", "العقبة", "جرش", "عجلون", "المفرق", "الطفيلة"];

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        phone: profile.phone || '',
        city: profile.city || '',
        role: profile.role || 'donor'
      });
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setLoading(true);
    setError(null);

    try {
      const cleanUsername = formData.username.replace(/[@\s]/g, '').toLowerCase();

      // فحص تكرار الهوية
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .or(`username.eq.${cleanUsername},full_name.eq."${formData.full_name}"`)
        .neq('id', profile.id)
        .maybeSingle();

      if (existing) {
        if (existing.username === cleanUsername) throw new Error("اسم المستخدم هذا محجوز مسبقاً");
        if (existing.full_name === formData.full_name) throw new Error("هذا الاسم الكامل مسجل بالفعل لشخص آخر");
      }

      const { error: updateError } = await supabase.from('profiles').upsert({
        id: profile.id,
        full_name: formData.full_name,
        username: cleanUsername,
        phone: formData.phone,
        city: formData.city,
        role: formData.role,
        updated_at: new Date().toISOString()
      });
      
      if (updateError) throw updateError;
      
      await refreshProfile();
      alert('تم تحديث بياناتك بنجاح');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !profile?.id) return;
    setUploading(true);
    const file = e.target.files[0];
    const filePath = `${profile.id}/${Date.now()}.${file.name.split('.').pop()}`;
    try {
      await supabase.storage.from(BUCKETS.AVATARS).upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from(BUCKETS.AVATARS).getPublicUrl(filePath);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      await refreshProfile();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="bg-blue-600 p-10 rounded-[3rem] shadow-xl text-white relative flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-[2rem] bg-white overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center">
            {uploading ? <Loader2 className="animate-spin text-blue-600" /> : (profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User className="w-16 h-16 text-blue-200" />)}
          </div>
          <label className="absolute -bottom-2 -right-2 p-3 bg-orange-500 text-white rounded-2xl shadow-lg cursor-pointer hover:scale-110 transition-all">
            <Camera className="w-5 h-5" />
            <input type="file" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        <div className="text-center md:text-right">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <h2 className="text-3xl font-black">{profile?.full_name || 'مستخدم جديد'}</h2>
            {profile?.is_verified && <ShieldCheck className="w-6 h-6 text-orange-400" />}
          </div>
          <p className="text-blue-100 font-bold opacity-80">@{profile?.username || 'user'}</p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <form onSubmit={handleUpdate} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 font-bold border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">الاسم الكامل (يجب أن يكون فريداً)</label>
              <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="الاسم الحقيقي الثلاثي" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">اسم المستخدم المميز</label>
              <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="أدخل معرف فريد" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">رقم الهاتف</label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">المحافظة</label>
              <div className="relative">
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none appearance-none">
                  <option value="">اختر المحافظة...</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700">نوع الحساب</label>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setFormData({...formData, role: 'donor'})} className={`p-4 rounded-2xl font-black transition-all ${formData.role === 'donor' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>أنا عميل</button>
              <button type="button" onClick={() => setFormData({...formData, role: 'requester'})} className={`p-4 rounded-2xl font-black transition-all ${formData.role === 'requester' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>أنا فني صيانة</button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-3">
            {loading ? <Loader2 className="animate-spin" /> : <Save className="w-6 h-6" />}
            {t('saveProfile')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

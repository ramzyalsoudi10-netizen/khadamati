
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useApp } from '../App';
import { ShieldCheck, Users, Activity, Flag, Trash2 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { lang } = useApp();
  const [stats, setStats] = useState({ users: 0, requests: 0, delivered: 0 });
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: requests } = await supabase.from('requests').select('*', { count: 'exact', head: true });
      const { count: delivered } = await supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'delivered');
      
      setStats({ users: users || 0, requests: requests || 0, delivered: delivered || 0 });
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-emerald-900 rounded-2xl flex items-center justify-center text-amber-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-emerald-950">{lang === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}</h2>
          <p className="text-emerald-600">{lang === 'ar' ? 'مراقبة وإدارة مجتمع فطورك علينا' : 'Monitor and manage IftarShare community'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-50 flex items-center gap-6">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-900 shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-950">{stats.users}</div>
            <div className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">{lang === 'ar' ? 'مستخدم' : 'Users'}</div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-50 flex items-center gap-6">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 shrink-0">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-950">{stats.requests}</div>
            <div className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">{lang === 'ar' ? 'طلبات' : 'Requests'}</div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-50 flex items-center gap-6">
          <div className="w-14 h-14 bg-emerald-900 rounded-2xl flex items-center justify-center text-white shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-950">{stats.delivered}</div>
            <div className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">{lang === 'ar' ? 'تم التوصيل' : 'Delivered'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 overflow-hidden">
        <div className="p-6 border-b border-emerald-50 flex items-center justify-between">
          <h3 className="font-bold text-emerald-950 flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            {lang === 'ar' ? 'البلاغات الأخيرة' : 'Recent Reports'}
          </h3>
        </div>
        <div className="p-10 text-center opacity-30">
          {lang === 'ar' ? 'لا يوجد بلاغات نشطة حالياً' : 'No active reports at the moment'}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

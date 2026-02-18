
import React, { useState, useEffect, useRef } from 'react';
// Fixing react-router-dom import
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useApp } from '../App';
import { 
  MapPin, Loader2, Map as MapIcon,
  User, Building2, MessageCircle, X, Navigation, Copy, Check, List, Smartphone, Phone
} from 'lucide-react';
import { IftarRequest } from '../types';

declare const L: any;

const RequestsMap: React.FC = () => {
  const { t, lang, user: authUser } = useApp();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<IftarRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<IftarRequest | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersLayer = useRef<any>(null);

  useEffect(() => {
    fetchRequests();
    const sub = supabase.channel('map_requests').on('postgres_changes', { event: '*', table: 'requests' }, () => fetchRequests()).subscribe();
    return () => { 
      sub.unsubscribe();
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const now = new Date();
      const twelveHoursAgo = new Date(now.getTime() - (12 * 60 * 60 * 1000)).toISOString();
      const { data, error } = await supabase.from('requests')
        .select('*, profiles:profiles!requester_id(*)')
        .eq('status', 'open')
        .gt('created_at', twelveHoursAgo);
      if (error) throw error;
      setRequests(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // تهيئة الخريطة مرة واحدة فقط
  useEffect(() => {
    if (loading || !mapRef.current || typeof L === 'undefined' || leafletMap.current) return;

    const map = L.map(mapRef.current, { zoomControl: false }).setView([31.95, 35.91], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    leafletMap.current = map;
    markersLayer.current = L.layerGroup().addTo(map);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        if (leafletMap.current) leafletMap.current.setView([pos.coords.latitude, pos.coords.longitude], 12);
      });
    }

    // حل مشكلة _leaflet_pos عن طريق التأكد من حجم الخريطة في الإطار التالي
    requestAnimationFrame(() => {
      if (leafletMap.current) leafletMap.current.invalidateSize();
    });
  }, [loading]);

  // تحديث العلامات (Markers) عند تغير البيانات
  useEffect(() => {
    if (!leafletMap.current || !markersLayer.current) return;

    markersLayer.current.clearLayers();
    requests.forEach(req => {
      const avatarUrl = req.profiles?.avatar_url;
      const markerIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative w-10 h-10">
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-700 rotate-45 border border-white shadow-lg"></div>
            <div class="w-10 h-10 bg-emerald-700 rounded-full border-2 border-white shadow-xl overflow-hidden flex items-center justify-center text-white relative z-10">
              ${avatarUrl ? `<img src="${avatarUrl}" class="w-full h-full object-cover" />` : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`}
            </div>
          </div>
        `,
        iconSize: [40, 40], iconAnchor: [20, 40]
      });
      const marker = L.marker([req.latitude, req.longitude], { icon: markerIcon }).addTo(markersLayer.current);
      marker.on('click', () => setSelectedRequest(req));
    });
  }, [requests]);

  const parseRequestInfo = (note?: string) => {
    if (!note) return { country: '', province: '', city: '', phone: '', comm: 'call', cleanNote: '' };
    const countryMatch = note.match(/\[Country: (.*?)\]/);
    const provinceMatch = note.match(/\[Province: (.*?)\]/);
    const cityMatch = note.match(/\[City: (.*?)\]/);
    const phoneMatch = note.match(/\[Phone: (.*?)\]/);
    const commMatch = note.match(/\[Comm: (.*?)\]/);
    const cleanNote = note.replace(/\[(Country|Province|City|Phone|Comm): .*?\]/g, '').trim();
    return { 
      country: countryMatch ? countryMatch[1] : '', 
      province: provinceMatch ? provinceMatch[1] : '', 
      city: cityMatch ? cityMatch[1] : '', 
      phone: phoneMatch ? phoneMatch[1] : '', 
      comm: commMatch ? commMatch[1] : 'call',
      cleanNote 
    };
  };

  const startChat = async (request: IftarRequest) => {
    if (processingId) return;
    setProcessingId(request.id);
    try {
      const { data: existing } = await supabase.from('conversations').select('id').eq('request_id', request.id).eq('donor_id', authUser.id).maybeSingle();
      if (existing) { navigate(`/chat/${existing.id}`); }
      else {
        const { data: newConv } = await supabase.from('conversations').insert({
          request_id: request.id, donor_id: authUser.id, requester_id: request.requester_id, last_message_at: new Date().toISOString()
        }).select().single();
        if (newConv) navigate(`/chat/${newConv.id}`);
      }
    } catch (err) { console.error(err); } finally { setProcessingId(null); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-180px)] space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-emerald-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-900 rounded-xl flex items-center justify-center text-amber-400"><MapIcon className="w-6 h-6" /></div>
          <div>
            <h2 className="text-xl font-black text-emerald-950">{t('requestsMap')}</h2>
            <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-widest">{requests.length} {lang === 'ar' ? 'طلب متاح' : 'Available Requests'}</p>
          </div>
        </div>
        <button onClick={() => navigate('/donor')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-900 rounded-xl font-black hover:bg-emerald-100 transition-all border border-emerald-100 active:scale-95 text-sm"><List className="w-4 h-4" />{lang === 'ar' ? 'القائمة' : 'List View'}</button>
      </div>

      <div className="flex-1 relative bg-emerald-50 rounded-[2.5rem] overflow-hidden border-2 border-emerald-100 shadow-inner">
        <div ref={mapRef} className="h-full w-full z-0" />
        {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10"><Loader2 className="w-10 h-10 text-emerald-900 animate-spin" /></div>}
      </div>

      {selectedRequest && (() => {
        const info = parseRequestInfo(selectedRequest.note);
        const isOwner = selectedRequest.requester_id === authUser?.id;
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
              <div className="ramadan-gradient p-8 text-white relative shrink-0">
                <button onClick={() => setSelectedRequest(null)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"><X className="w-6 h-6" /></button>
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-400 rounded-3xl flex items-center justify-center text-emerald-900 overflow-hidden border-4 border-white/20 shadow-xl">
                     {selectedRequest.profiles?.avatar_url ? <img src={selectedRequest.profiles.avatar_url} className="w-full h-full object-cover" /> : <User className="w-8 h-8 md:w-10 md:h-10" />}
                   </div>
                   <div>
                     <h3 className="text-xl md:text-3xl font-black truncate max-w-[200px]">{selectedRequest.profiles?.full_name}</h3>
                     <p className="text-white/70 font-bold text-xs md:text-sm">{info.country || selectedRequest.profiles?.country} • {info.province}</p>
                   </div>
                </div>
                {!isOwner && (
                  <button onClick={() => startChat(selectedRequest)} className="absolute bottom-4 left-8 bg-amber-400 text-emerald-950 p-4 rounded-2xl shadow-xl hover:scale-110 transition-all active:scale-90">
                    {processingId === selectedRequest.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <MessageCircle className="w-7 h-7" />}
                  </button>
                )}
              </div>
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto hide-scrollbar">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-1">
                    <MapIcon className="w-4 h-4 text-emerald-800" /><div className="text-[8px] font-black text-emerald-500 uppercase">{lang === 'ar' ? 'المحافظة' : 'Province'}</div><div className="text-xs md:text-sm font-black text-emerald-950">{info.province}</div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-1">
                    <Building2 className="w-4 h-4 text-emerald-800" /><div className="text-[8px] font-black text-emerald-500 uppercase">{lang === 'ar' ? 'الوسيلة المفضلة' : 'Preferred'}</div><div className="text-xs md:text-sm font-black text-emerald-950 flex items-center gap-2">{info.comm === 'whatsapp' ? <><MessageCircle className="w-4 h-4 text-green-600"/> {t('preferWhatsapp')}</> : <><Phone className="w-4 h-4 text-emerald-700"/> {t('preferCall')}</>}</div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex flex-col gap-1 col-span-full">
                    <Smartphone className="w-4 h-4 text-amber-800" /><div className="text-[8px] font-black text-amber-500 uppercase">{lang === 'ar' ? 'رقم الهاتف المباشر' : 'Direct Phone'}</div><div className="text-sm md:text-lg font-black text-emerald-950 flex items-center justify-between"><span>{info.phone}</span><button onClick={() => handleCopy(info.phone)} className="p-1 hover:text-amber-600 transition-colors">{copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}</button></div>
                  </div>
                </div>
                {info.cleanNote && <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 italic font-bold text-emerald-900 text-sm leading-relaxed">"{info.cleanNote}"</div>}
                <a href={`https://www.google.com/maps?q=${selectedRequest.latitude},${selectedRequest.longitude}`} target="_blank" className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-800 transition-all active:scale-[0.98]"><Navigation className="w-6 h-6" /> {lang === 'ar' ? 'عرض على الخريطة' : 'View on Map'}</a>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default RequestsMap;

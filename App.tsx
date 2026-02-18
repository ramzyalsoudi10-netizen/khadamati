
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { supabase } from './supabase';
import { translations } from './translations';
import { Profile, Conversation } from './types';
import { ConfirmProvider } from './ConfirmProvider';
import { 
  Wrench, 
  User, 
  LogOut, 
  ChevronDown,
  PlusCircle,
  Home,
  MessageSquare,
  LogIn,
  LayoutGrid,
  Users
} from 'lucide-react';

// --- Contexts ---
interface AppContextType {
  lang: 'ar';
  user: any;
  profile: Profile | null;
  loading: boolean;
  t: (key: string) => string;
  unreadCount: number;
  refreshUnread: () => void;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// --- Pages ---
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import RequestIftarPage from './pages/RequestIftarPage';
import DonorDashboard from './pages/DonorDashboard';
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import ProfileViewPage from './pages/ProfileViewPage';
import CommunityPage from './pages/CommunityPage';
import InfoPage from './pages/InfoPage';

const MobileBottomNav = () => {
  const { user, unreadCount } = useApp();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] px-6 pb-6 pointer-events-none">
      <div className="max-w-md mx-auto h-16 bottom-nav-blur border border-white/40 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-between px-2 pointer-events-auto">
        <NavItem to="/" icon={<Home />} label="الرئيسية" active={isActive('/')} />
        <NavItem to="/donor" icon={<LayoutGrid />} label="سوق الخدمات" active={isActive('/donor')} />
        {user ? (
          <>
            <div className="flex-1 flex justify-center -mt-12">
              <Link to="/request" className="w-14 h-14 bg-[#ff7332] text-white rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(255,115,50,0.4)] border-4 border-white active:scale-90 transition-transform">
                <PlusCircle className="w-8 h-8 stroke-[2.5]" />
              </Link>
            </div>
            <NavItem to="/messages" icon={<MessageSquare />} label="الدردشة" active={isActive('/messages')} badge={unreadCount > 0} />
            <NavItem to="/profile" icon={<User />} label="حسابي" active={isActive('/profile')} />
          </>
        ) : (
          <NavItem to="/auth" icon={<LogIn />} label="دخول" active={isActive('/auth')} />
        )}
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label, active, badge }: { to: string, icon: React.ReactNode, label: string, active: boolean, badge?: boolean }) => (
  <Link to={to} className={`flex flex-col items-center justify-center gap-0.5 flex-1 transition-all duration-300 relative ${active ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
    {badge && <span className="absolute top-1 right-1/2 translate-x-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
    {React.cloneElement(icon as React.ReactElement<any>, { className: `w-6 h-6 stroke-[2.2] ${active ? 'fill-blue-50' : ''}` })}
    <span className={`text-[9px] font-black ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
  </Link>
);

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const checkUnread = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('conversations')
        .select('id, last_message_at')
        .or(`donor_id.eq.${userId},requester_id.eq.${userId}`);
      
      if (data) {
        const readStatus = JSON.parse(localStorage.getItem(`read_status_${userId}`) || '{}');
        const unread = data.filter((c: any) => {
          const lastRead = readStatus[c.id] || '1970-01-01T00:00:00Z';
          return new Date(c.last_message_at) > new Date(lastRead);
        });
        setUnreadCount(unread.length);
      }
    } catch (e) { console.error(e); }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) setProfile(data);
      checkUnread(userId);
    } catch (err) { console.warn(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      // Force Home Page on startup/refresh if path is empty or root
      if (window.location.hash === '' || window.location.hash === '#/') {
        window.location.hash = '/';
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session?.user) {
        setUser(data.session.user);
        fetchProfile(data.session.user.id);
      }
      setLoading(false);
    };
    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setUnreadCount(0); }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const refreshUnread = () => { if (user) checkUnread(user.id); };
  const refreshProfile = async () => { if (user) await fetchProfile(user.id); };
  const t = (key: string) => (translations.ar as any)[key] || key;
  const handleLogout = async () => { await supabase.auth.signOut(); setIsUserMenuOpen(false); };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#f3f7fa] gap-4">
      <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center animate-bounce shadow-2xl">
        <Wrench className="w-10 h-10 text-white" />
      </div>
      <span className="font-black text-blue-900 text-xl">جاري التحميل...</span>
    </div>
  );

  return (
    <AppContext.Provider value={{ lang: 'ar', user, profile, loading, t, unreadCount, refreshUnread, refreshProfile }}>
      <ConfirmProvider>
        <HashRouter>
          <div dir="rtl" className="min-h-screen flex flex-col bg-[#f3f7fa]">
            <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 h-20 hidden lg:flex items-center">
              <div className="container mx-auto px-8 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group shrink-0 w-48">
                  <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-black text-blue-950 tracking-tighter">خدماتي</span>
                </Link>

                <nav className="flex items-center justify-center gap-8 xl:gap-12 flex-1">
                  <Link to="/" className="flex items-center gap-2 font-black text-slate-500 hover:text-blue-600 transition-all">
                    <Home className="w-5 h-5" /> الرئيسية
                  </Link>
                  <Link to="/donor" className="flex items-center gap-2 font-black text-slate-500 hover:text-blue-600 transition-all">
                    <LayoutGrid className="w-5 h-5" /> سوق الخدمات
                  </Link>
                  {user && (
                    <Link to="/request" className="flex items-center gap-2 font-black text-white bg-orange-500 px-8 py-3 rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95">
                      <PlusCircle className="w-5 h-5" /> أنشئ خدمة
                    </Link>
                  )}
                  <Link to="/community" className="flex items-center gap-2 font-black text-slate-500 hover:text-blue-600 transition-all">
                    <Users className="w-5 h-5" /> المجتمع
                  </Link>
                  {user && (
                    <Link to="/messages" className="flex items-center gap-2 font-black text-slate-500 hover:text-blue-600 transition-all relative">
                      <MessageSquare className="w-5 h-5" /> 
                      المحادثات
                      {unreadCount > 0 && <span className="absolute -top-1 -right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                    </Link>
                  )}
                </nav>

                <div className="flex items-center gap-4 shrink-0 w-48 justify-end">
                  {user ? (
                    <div className="relative">
                      <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-full border border-slate-100 transition-all hover:bg-white shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-blue-600 overflow-hidden flex items-center justify-center text-white border-2 border-white">
                          {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isUserMenuOpen && (
                        <div className="absolute top-16 left-0 w-64 bg-white rounded-[2rem] shadow-2xl py-4 border border-slate-50 z-[200] animate-in fade-in slide-in-from-top-2">
                          <Link onClick={() => setIsUserMenuOpen(false)} to="/profile" className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50 font-black text-slate-700"><User className="w-5 h-5 text-blue-600" /> حسابي</Link>
                          <Link onClick={() => setIsUserMenuOpen(false)} to="/messages" className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50 font-black text-slate-700 relative">
                            <MessageSquare className="w-5 h-5 text-blue-600" /> المحادثات
                            {unreadCount > 0 && <span className="absolute top-4 right-12 w-2 h-2 bg-red-500 rounded-full"></span>}
                          </Link>
                          <div className="h-px bg-slate-100 my-2 mx-6"></div>
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-4 hover:bg-red-50 text-red-600 font-black"><LogOut className="w-5 h-5" /> خروج</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link to="/auth" className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all">دخول</Link>
                  )}
                </div>
              </div>
            </header>
            <main className="flex-grow pb-32 lg:pb-0">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/auth" />} />
                <Route path="/profile/:id" element={<ProfileViewPage />} />
                <Route path="/request" element={user ? <RequestIftarPage /> : <Navigate to="/auth" />} />
                <Route path="/donor" element={<DonorDashboard />} />
                <Route path="/messages" element={user ? <ChatList /> : <Navigate to="/auth" />} />
                <Route path="/chat/:id" element={user ? <ChatRoom /> : <Navigate to="/auth" />} />
                <Route path="/info/:slug" element={<InfoPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <MobileBottomNav />
          </div>
        </HashRouter>
      </ConfirmProvider>
    </AppContext.Provider>
  );
};

export default App;

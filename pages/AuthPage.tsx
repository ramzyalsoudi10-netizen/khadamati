
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useApp } from '../App';
import { Mail, Lock, LogIn, UserPlus, CheckCircle2, User, Loader2, Chrome } from 'lucide-react';

const AuthPage: React.FC = () => {
  const { t } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<'idle' | 'success_signup' | 'success_login' | 'reset_sent'>('idle');

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        setAuthState('success_login');
        setTimeout(() => { window.location.hash = '/'; }, 1500);
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName,
              country: 'Jordan'
            }
          }
        });
        if (signUpError) throw signUpError;
        if (data.user) setAuthState('success_signup');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authState === 'success_signup') {
    return (
      <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[2.5rem] shadow-2xl border border-blue-50 text-center animate-in zoom-in duration-500">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-blue-900 mb-6">تم إنشاء الحساب بنجاح</h2>
        <button onClick={() => setIsLogin(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black">{t('login')}</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 md:p-10 bg-white rounded-[3rem] shadow-2xl border border-slate-50">
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-blue-50 rounded-3xl mb-4">
          {isLogin ? <LogIn className="w-8 h-8 text-blue-600" /> : <UserPlus className="w-8 h-8 text-blue-600" />}
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-blue-900 mb-2">{isLogin ? t('login') : 'إنشاء حساب جديد'}</h2>
        <p className="text-slate-400 font-bold text-sm">أهلاً بك في منصة خدماتي الأردن</p>
      </div>

      <div className="space-y-4 mb-8">
        <button 
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {googleLoading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />}
          <span>الدخول عبر Gmail</span>
        </button>
        
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-slate-300 text-xs font-black">أو عبر البريد</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>
      </div>

      <form onSubmit={handleAuth} className="space-y-5">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">{error}</div>}

        {!isLogin && (
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-2 mr-1 uppercase">الاسم الكامل</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" placeholder="أدخل اسمك الحقيقي" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-black text-slate-500 mb-2 mr-1 uppercase">البريد الإلكتروني</label>
          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" placeholder="example@mail.com" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-black text-slate-500 mb-2 mr-1 uppercase">كلمة المرور</label>
          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" placeholder="••••••••" />
          </div>
        </div>

        <button disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (isLogin ? t('login') : 'إنشاء حساب')}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button onClick={() => setIsLogin(!isLogin)} className="text-blue-900 font-black text-sm hover:underline underline-offset-4 decoration-blue-200 transition-all">
          {isLogin ? 'لا تملك حساباً؟ انضم إلينا الآن' : 'لديك حساب بالفعل؟ سجل دخولك'}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;

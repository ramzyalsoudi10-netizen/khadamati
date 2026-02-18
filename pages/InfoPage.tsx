
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { 
  ChevronLeft, ChevronRight, ChevronDown, Info, Shield, 
  HelpCircle, Heart, Mail, ShieldCheck, Wrench, Globe, Target, Eye
} from 'lucide-react';

const InfoPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, lang } = useApp();

  const renderContent = () => {
    switch (slug) {
      case 'about':
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="space-y-4 text-center md:text-right">
              <h2 className="text-4xl font-black text-blue-900 flex items-center justify-center md:justify-start gap-3">
                <Info className="text-orange-500 w-10 h-10" /> من نحن
              </h2>
              <p className="text-xl text-slate-700 leading-relaxed font-bold">
                "خدماتي" هي المنصة الأردنية الرائدة التي تم تطويرها لتكون حلقة الوصل الموثوقة والذكية بين أصحاب المنازل والمنشآت وبين نخبة من أمهر الفنيين والحرفيين في المملكة.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Target className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-blue-900">رسالتنا</h3>
                  <p className="text-xs font-bold text-slate-600">توفير تجربة صيانة منزلية خالية من المتاعب من خلال فنيين موثوقين ومقيمين من قبل المجتمع.</p>
               </div>
               <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Eye className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-orange-900">رؤيتنا</h3>
                  <p className="text-xs font-bold text-slate-600">أن نصبح المنصة الأولى والوحيدة التي يفكر بها كل أردني عند حاجته لأي خدمة تقنية أو منزلية.</p>
               </div>
               <div className="bg-green-50 p-8 rounded-[2.5rem] border border-green-100 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Globe className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-green-900">قيمنا</h3>
                  <p className="text-xs font-bold text-slate-600">الشفافية الكاملة، الأمان في التعامل، والالتزام بدعم الكوادر المهنية الوطنية.</p>
               </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl"></div>
              <h3 className="text-2xl font-black mb-6">تواصل معنا مباشرة</h3>
              <p className="text-slate-400 font-bold mb-8">نحن نؤمن بأن استماعنا للمستخدم هو مفتاح نجاحنا. إذا كان لديك أي اقتراح، شكوى، أو استفسار، لا تتردد في مراسلتنا.</p>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/10 flex-1">
                  <Mail className="w-8 h-8 text-orange-400" />
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">البريد الإلكتروني</p>
                    <a href="mailto:ramzyalsoudi7@gmail.com" className="text-lg font-black hover:text-orange-400 transition-colors">ramzyalsoudi7@gmail.com</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'faqs':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="text-center md:text-right space-y-2">
              <h2 className="text-4xl font-black text-blue-900 flex items-center justify-center md:justify-start gap-3">
                <HelpCircle className="text-blue-500 w-10 h-10" /> الأسئلة الشائعة
              </h2>
              <p className="text-slate-500 font-bold">كل ما تحتاج معرفته عن استخدام منصة "خدماتي".</p>
            </div>

            <div className="grid gap-4">
              <FAQItem 
                q="هل يتطلب استخدام الموقع دفع رسوم اشتراك؟" 
                a="بشكل دائم، نسعى لتقديم خدماتنا بأقل تكلفة. بمناسبة شهر رمضان المبارك، نعلن أن كافة خدمات المنصة مجانية تماماً للفنيين والعملاء، دون أي عمولات أو إعلانات." 
              />
              <FAQItem 
                q="كيف يمكنني التأكد من كفاءة الفني قبل طلبه؟" 
                a="منصة خدماتي تعتمد بشكل أساسي على نظام 'التقييم المجتمعي'. يمكنك الدخول لملف الفني والاطلاع على عدد النجوم والتقييمات الحقيقية التي تركها العملاء السابقون له." 
              />
              <FAQItem 
                q="ما هي المناطق التي تغطيها المنصة؟" 
                a="نحن نغطي كافة محافظات المملكة الأردنية الـ 12. يمكنك استخدام الفلتر في الصفحة الرئيسية لاختيار محافظتك ومنطقتك تحديداً." 
              />
              <FAQItem 
                q="كيف يمكنني التسجيل كفني لتقديم خدماتي؟" 
                a="الأمر بسيط! قم بإنشاء حساب عادي، ثم اذهب إلى صفحة 'حسابي' وقم بتعديل نوع الحساب إلى 'فني صيانة'، ثم أضف تخصصك وموقعك." 
              />
              <FAQItem 
                q="ماذا أفعل في حال حدوث خلاف مع فني أو عميل؟" 
                a="نحن وسيط تقني يربط الطرفين، ولكننا نهتم جداً بجودة المجتمع. في حال وجود أي مشكلة، يرجى مراسلتنا فوراً عبر البريد الإلكتروني المذكور في صفحة 'من نحن' لاتخاذ الإجراء المناسب." 
              />
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="text-center md:text-right space-y-2">
              <h2 className="text-4xl font-black text-blue-900 flex items-center justify-center md:justify-start gap-3">
                <Shield className="text-green-600 w-10 h-10" /> سياسة الخصوصية
            </h2>
              <p className="text-slate-500 font-bold">خصوصيتك هي أولويتنا القصوى في "خدماتي".</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-2 h-full bg-blue-600 transition-all group-hover:w-4"></div>
                <h4 className="font-black text-blue-900 text-xl mb-4">1. ما هي البيانات التي نجمعها؟</h4>
                <p className="text-slate-700 font-bold leading-relaxed">
                  نحن نجمع فقط البيانات الضرورية لتشغيل الخدمة، وتشمل: الاسم الكامل، رقم الهاتف، المحافظة، وصورة الملف الشخصي (اختيارياً). كما نجمع بيانات الموقع الجغرافي لتمكين ميزة البحث عن فنيين قريبين منك.
                </p>
              </div>

              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-2 h-full bg-orange-500 transition-all group-hover:w-4"></div>
                <h4 className="font-black text-blue-900 text-xl mb-4">2. كيف نستخدم بياناتك؟</h4>
                <p className="text-slate-700 font-bold leading-relaxed">
                  تُستخدم بياناتك فقط لغرض الربط بين الفني والعميل. لا تظهر أرقام الهواتف إلا للمستخدمين المسجلين والمهتمين فعلياً بطلب خدمة أو تقديمها.
                </p>
              </div>

              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-2 h-full bg-green-500 transition-all group-hover:w-4"></div>
                <h4 className="font-black text-blue-900 text-xl mb-4">3. حماية البيانات ومشاركتها</h4>
                <p className="text-slate-700 font-bold leading-relaxed">
                  نحن في "خدماتي" نلتزم التزاماً قطعياً بعدم بيع أو مشاركة بياناتك الشخصية مع أي أطراف ثالثة أو شركات إعلانية. بياناتك محفوظة في قواعد بيانات مشفرة ومؤمنة بأحدث التقنيات.
                </p>
              </div>

              <div className="bg-blue-50 p-8 rounded-[3rem] border border-blue-100 flex items-start gap-6">
                <ShieldCheck className="w-12 h-12 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-black text-blue-900 text-lg mb-2">الموافقة والتحديثات</h4>
                  <p className="text-slate-600 font-bold text-sm leading-relaxed">باستخدامك للمنصة، فأنت توافق على سياسة الخصوصية هذه. قد نقوم بتحديث هذه السياسة دورياً لضمان أفضل حماية لك، وسيتم إخطارك بأي تغييرات جوهرية.</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-black text-slate-400">الصفحة غير موجودة</h2>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pb-32">
      <button 
        onClick={() => navigate('/')} 
        className="mb-8 flex items-center gap-2 text-blue-900 font-black hover:gap-3 transition-all bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-50"
      >
        <ChevronRight className="w-5 h-5" /> 
        الرجوع للرئيسية
      </button>

      <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-50 overflow-hidden relative">
        <div className="p-8 md:p-16">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const FAQItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className={`bg-white rounded-3xl border transition-all ${isOpen ? 'border-blue-200 shadow-lg' : 'border-slate-100 shadow-sm'}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-right flex items-center justify-between gap-4"
      >
        <span className="font-black text-blue-950 text-lg">{q}</span>
        <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-right">
          <div className="h-px bg-slate-100 mb-4"></div>
          <p className="text-slate-600 font-bold leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
};

export default InfoPage;

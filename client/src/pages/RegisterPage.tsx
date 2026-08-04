import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, TrendingUp, PieChart, ShieldCheck, Building2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, fullName);
      toast.success('Kayit basarili!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kayit basarisiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-white selection:bg-[#74BCC8]/30 selection:text-slate-900">

      {/* Sol Panel (45%) */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between relative overflow-hidden px-14 xl:px-20 py-14 select-none"
        style={{ background: 'linear-gradient(135deg, #74BCC8 0%, #4FAFC0 100%)' }}
      >
        <div
          className="absolute right-0 bottom-0 w-[80%] h-[85%] opacity-30 pointer-events-none bg-no-repeat bg-bottom bg-contain mix-blend-overlay"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1400&auto=format&fit=crop")' }}
        />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-cyan-950/10 border border-white/40">I</div>
          <div>
            <h1 className="text-white text-3xl xl:text-4xl font-bold tracking-tight leading-none mb-1.5 drop-shadow-md">Iventra</h1>
            <p className="text-white/90 text-[11px] font-bold tracking-[0.25em] uppercase drop-shadow-sm">Kurumsal Envanter Yonetim Platformu</p>
          </div>
        </motion.div>

        <div className="relative z-10 my-auto py-8">
          <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white text-3xl xl:text-[40px] font-bold tracking-tight leading-[1.12] mb-4 max-w-[460px] drop-shadow-md">
            Envanterinizi akilli yonetin, isinize deger katin.
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/85 text-[15px] font-medium leading-relaxed mb-8 max-w-[420px]">
            Tum varliklarinizi tek bir platformda yonetin, izleyin ve gelecege guvenle bakin.
          </motion.p>

          <div className="space-y-4 max-w-[460px]">
            {[
              { icon: TrendingUp, title: 'Merkezi Yonetim', desc: 'Tum varliklarinizi tek bir merkezden yonetin.' },
              { icon: PieChart, title: 'Akilli Analiz & Raporlama', desc: 'Veriye dayali kararlar alin, performansinizi artirin.' },
              { icon: ShieldCheck, title: 'Guvenli & Yetkilendirilebilir', desc: 'Rol tabanli erisim ile verileriniz her zaman guvende.' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.25 + i * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shadow-cyan-950/5 transition-all hover:bg-white/15">
                <div className="p-3 rounded-xl bg-white/20 text-white shrink-0"><f.icon size={22} strokeWidth={1.5} /></div>
                <div>
                  <h3 className="text-white font-semibold text-[14px]">{f.title}</h3>
                  <p className="text-white/80 text-[12px] mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="relative z-10">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 max-w-[460px] shadow-lg">
            <Building2 size={24} className="text-white shrink-0" strokeWidth={1.5} />
            <p className="text-white/90 text-[12px] font-medium leading-relaxed">Iventra, kurumlarin envanter sureclerini daha verimli, daha guvenli ve daha akilli hale getirir.</p>
          </div>
        </motion.div>
      </div>

      {/* Sag Panel (55%) */}
      <div className="flex flex-1 lg:w-[55%] flex-col justify-between items-center bg-slate-50/50 p-6 sm:p-10 lg:p-16 overflow-y-auto">

        <div className="w-full max-w-[440px] mb-6 lg:hidden">
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: '#4FAFC0' }}>Iventra</h1>
          <p className="text-slate-400 text-[13px]">Kurumsal Envanter Yonetim Platformu</p>
        </div>

        <div className="w-full flex-1 flex items-center justify-center my-auto">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full max-w-[440px] bg-white p-8 sm:p-10 rounded-[24px] border border-slate-100"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' }}>

            <div className="mb-8">
              <h2 className="text-[26px] font-bold text-slate-900 mb-2 tracking-tight">Hesap olustur</h2>
              <p className="text-[14px] text-slate-400">Envanter yonetimine hemen baslayin.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="mb-2 block text-[13px] font-semibold text-slate-700">Ad Soyad</label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-300 group-focus-within:text-[#74BCC8] transition-colors"><User size={18} /></div>
                  <input type="text" className="block w-full h-[50px] rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-[14px] text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-[#74BCC8] focus:ring-4 focus:ring-[#74BCC8]/15 shadow-sm"
                    placeholder="Adiniz Soyadiniz" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-[13px] font-semibold text-slate-700">E-posta</label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-300 group-focus-within:text-[#74BCC8] transition-colors"><Mail size={18} /></div>
                  <input type="email" className="block w-full h-[50px] rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-[14px] text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-[#74BCC8] focus:ring-4 focus:ring-[#74BCC8]/15 shadow-sm"
                    placeholder="ornek@sirket.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-[13px] font-semibold text-slate-700">Sifre</label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-300 group-focus-within:text-[#74BCC8] transition-colors"><Lock size={18} /></div>
                  <input type={showPassword ? 'text' : 'password'}
                    className="block w-full h-[50px] rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-[14px] text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-[#74BCC8] focus:ring-4 focus:ring-[#74BCC8]/15 shadow-sm"
                    placeholder="En az 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-300 hover:text-slate-500 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full h-[52px] rounded-xl text-white text-[15px] font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-[1px] flex items-center justify-center gap-2"
                style={{ backgroundColor: '#74BCC8', boxShadow: '0 4px 14px rgba(116,188,200,0.3)' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(116,188,200,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(116,188,200,0.3)'; }}>
                {loading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>Kayit Ol <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-[14px] text-slate-400">
              Hesabiniz var mi?{' '}
              <Link to="/login" className="font-semibold text-[#5ac3e2] hover:text-[#4FAFC0] transition-colors">Giris Yap</Link>
            </p>
          </motion.div>
        </div>

        <div className="w-full max-w-[440px] mt-6 flex flex-col sm:flex-row items-center justify-between text-[12px] text-slate-300 gap-2">
          <span>&copy; 2026 Iventra. Tum haklari saklidir.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-500 transition-colors">Gizlilik Politikasi</a>
            <a href="#" className="hover:text-slate-500 transition-colors">Kullanim Kosullari</a>
          </div>
        </div>
      </div>
    </div>
  );
}

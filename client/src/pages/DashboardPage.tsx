import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Monitor, CheckCircle2, Wrench, ShieldAlert, ArrowUpRight, ArrowDownRight, Server, Database, Wifi, Radio, Plus, Download, QrCode, AlertTriangle, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import type { DashboardStats } from '../types';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/ui/PageTransition';
import { CardSkeleton } from '../components/ui/Skeleton';

const P = { primary: '#74BCC8', dark: '#4FAFC0', emerald: '#10b981', amber: '#f59e0b', red: '#ef4444', slate: '#94a3b8' };

const trendData = [
  { m: 'Oca', v: 120 }, { m: 'Sub', v: 155 }, { m: 'Mar', v: 210 },
  { m: 'Nis', v: 280 }, { m: 'May', v: 340 }, { m: 'Haz', v: 420 },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusServices = useMemo(() => [
    { label: 'API', icon: Server, ok: true },
    { label: 'Database', icon: Database, ok: true },
    { label: 'Redis', icon: Radio, ok: true },
    { label: 'WebSocket', icon: Wifi, ok: true },
  ], []);

  if (loading || !stats) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>;

  const activeCount = stats.statusDistribution.find(d => d._id === 'active')?.count || 0;
  const inactiveCount = stats.statusDistribution.find(d => d._id === 'inactive')?.count || 0;
  const maintCount = stats.statusDistribution.find(d => d._id === 'maintenance')?.count || 0;
  const decommCount = stats.statusDistribution.find(d => d._id === 'decommissioned')?.count || 0;

  const cards = [
    { icon: Monitor, label: 'Toplam Envanter', value: stats.items, delta: '+12%', up: true, color: P.primary, bg: 'rgba(116,188,200,0.1)' },
    { icon: CheckCircle2, label: 'Aktif Cihaz', value: activeCount, delta: `${stats.items > 0 ? Math.round((activeCount / stats.items) * 100) : 0}%`, up: true, color: P.emerald, bg: 'rgba(16,185,129,0.1)' },
    { icon: Wrench, label: 'Bakimda', value: stats.maintenance, delta: `${stats.maintenance}`, up: false, color: P.amber, bg: 'rgba(245,158,11,0.1)' },
    { icon: ShieldAlert, label: 'Garanti Biten', value: stats.warrantyExpiring, delta: `${stats.warrantyExpiring}`, up: false, color: P.red, bg: 'rgba(239,68,68,0.1)' },
  ];

  const donutData = [
    { name: 'Aktif', value: activeCount, color: P.primary },
    { name: 'Bakim', value: maintCount, color: P.amber },
    { name: 'Pasif', value: inactiveCount, color: P.red },
    { name: 'Devre Disi', value: decommCount, color: P.slate },
  ].filter(d => d.value > 0);

  const vendorData = (stats.vendorDistribution || []).slice(0, 5);

  const alerts = [
    stats.warrantyExpiring > 0 && { icon: ShieldAlert, text: `${stats.warrantyExpiring} cihazin garantisi dolmak uzere`, color: P.red, bg: 'rgba(239,68,68,0.06)' },
    stats.maintenance > 0 && { icon: Wrench, text: `${stats.maintenance} cihaz bakim surecinde`, color: P.amber, bg: 'rgba(245,158,11,0.06)' },
    stats.offline > 0 && { icon: AlertTriangle, text: `${stats.offline} cihaz cevrimdisi durumda`, color: P.slate, bg: 'rgba(148,163,184,0.1)' },
  ].filter(Boolean) as { icon: any; text: string; color: string; bg: string }[];

  const quickActions = [
    { icon: Plus, label: 'Yeni Cihaz', to: '/inventory' },
    { icon: Download, label: 'Rapor Indir', to: '/inventory' },
    { icon: QrCode, label: 'QR Tara', to: '' },
  ];

  return (
    <PageTransition>
      <motion.div variants={stagger} initial="hidden" animate="visible">

        {/* ── Hero ── */}
        <motion.div variants={fadeUp}
          className="mb-6 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #74BCC8 0%, #4FAFC0 100%)' }}>
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-white/60 text-[11px] font-semibold tracking-[0.2em] uppercase mb-1.5">Iventra Kurumsal Yonetim</p>
              <h1 className="text-[22px] lg:text-[26px] font-bold leading-tight mb-1.5">Hos geldiniz, {user?.fullName}</h1>
              <p className="text-white/75 text-[13px] max-w-[520px]">Envanter durumunuz asagida ozetlenmistir.</p>
            </div>
            {/* System Status */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15 shrink-0">
              {statusServices.map(s => (
                <div key={s.label} className="flex items-center gap-1.5 text-[11px]" title={s.label}>
                  <span className={`h-2 w-2 rounded-full ${s.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="text-white/80 hidden sm:inline">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── KPI Cards ── */}
        <div className="mb-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <motion.div key={c.label} variants={fadeUp}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: c.bg }}>
                  <c.icon size={20} style={{ color: c.color }} strokeWidth={1.5} />
                </div>
                {i < 2 && (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold" style={{ color: c.up ? P.emerald : P.red }}>
                    {c.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{c.delta}
                  </span>
                )}
              </div>
              <p className="text-[26px] font-bold text-slate-900 tabular-nums leading-none mb-1">{c.value.toLocaleString()}</p>
              <p className="text-[12px] text-slate-400 font-medium">{c.label}</p>
              {/* Mini progress */}
              <div className="mt-3 h-1 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${stats.items > 0 ? Math.min((c.value / stats.items) * 100, 100) : 0}%`, backgroundColor: c.color }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Alerts (only if any) ── */}
        {alerts.length > 0 && (
          <motion.div variants={fadeUp} className="mb-6 grid gap-3 sm:grid-cols-3">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3 border" style={{ backgroundColor: a.bg, borderColor: 'transparent' }}>
                <a.icon size={16} style={{ color: a.color }} strokeWidth={1.5} />
                <span className="text-[13px] text-slate-600">{a.text}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Charts Row ── */}
        <div className="mb-6 grid gap-4 lg:grid-cols-5">
          {/* Area Chart 3/5 */}
          <motion.div variants={fadeUp} className="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold text-slate-800">Envanter Trendi</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Son 6 aylik degisim</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={P.primary} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={P.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
                <Area type="monotone" dataKey="v" stroke={P.primary} strokeWidth={2} fill="url(#ag)" dot={false} activeDot={{ r: 4, fill: P.primary, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Donut 2/5 */}
          <motion.div variants={fadeUp} className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="text-[14px] font-semibold text-slate-800 mb-1">Durum Dagilimi</h3>
            <p className="text-[11px] text-slate-400 mb-3">Cihaz durumlari</p>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={donutData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={45} paddingAngle={3} strokeWidth={0}>
                      {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-[20px] font-bold text-slate-900">{stats.items}</span>
                  <span className="text-[10px] text-slate-400">Toplam</span>
                </div>
              </div>
              <div className="space-y-2.5 flex-1">
                {donutData.map(d => {
                  const pct = stats.items > 0 ? Math.round((d.value / stats.items) * 100) : 0;
                  return (
                    <div key={d.name}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="flex items-center gap-1.5 text-[12px] text-slate-600">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}
                        </span>
                        <span className="text-[11px] text-slate-400 tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Vendor Dist */}
          {vendorData.length > 0 && (
            <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-slate-800 mb-1">Uretici Dagilimi</h3>
              <p className="text-[11px] text-slate-400 mb-3">Ilk 5 marka</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={vendorData} layout="vertical" margin={{ left: 0, right: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="_id" tick={{ fontSize: 11, fill: '#64748b' }} width={70} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill={P.primary} radius={[0, 5, 5, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="text-[14px] font-semibold text-slate-800 mb-1">Hizli Islemler</h3>
            <p className="text-[11px] text-slate-400 mb-4">Sik kullanilan islemler</p>
            <div className="space-y-2">
              {quickActions.map(a => (
                a.to ? (
                  <Link key={a.label} to={a.to}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 border border-slate-100 text-slate-600 hover:border-[#74BCC8]/30 hover:bg-[rgba(116,188,200,0.04)] transition-all group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(116,188,200,0.1)' }}>
                      <a.icon size={16} style={{ color: P.primary }} strokeWidth={1.5} />
                    </div>
                    <span className="text-[13px] font-medium flex-1">{a.label}</span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-[#74BCC8] transition-colors" />
                  </Link>
                ) : (
                  <button key={a.label} onClick={() => toast('QR Tarama ozelligi yakin zamanda aktif olacak', { icon: 'ℹ️' })}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 border border-slate-100 text-slate-600 hover:border-[#74BCC8]/30 hover:bg-[rgba(116,188,200,0.04)] transition-all group text-left">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(116,188,200,0.1)' }}>
                      <a.icon size={16} style={{ color: P.primary }} strokeWidth={1.5} />
                    </div>
                    <span className="text-[13px] font-medium flex-1">{a.label}</span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-[#74BCC8] transition-colors" />
                  </button>
                )
              ))}
            </div>
          </motion.div>

          {/* OS Distribution */}
          {stats.osDistribution.length > 0 && (
            <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-slate-800 mb-1">Isletim Sistemi</h3>
              <p className="text-[11px] text-slate-400 mb-4">Sistem dagilimi</p>
              <div className="space-y-3">
                {stats.osDistribution.slice(0, 5).map((os, i) => {
                  const pct = stats.items > 0 ? Math.round((os.count / stats.items) * 100) : 0;
                  const colors = [P.primary, P.dark, P.emerald, P.amber, P.slate];
                  return (
                    <div key={os._id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-slate-600 font-medium truncate max-w-[140px]">{os._id}</span>
                        <span className="text-[11px] text-slate-400 tabular-nums">{os.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

      </motion.div>
    </PageTransition>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, TrendingUp, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import PageTransition from '../components/ui/PageTransition';
import { CardSkeleton } from '../components/ui/Skeleton';

const SEV_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: 'rgba(239,68,68,0.06)', text: '#dc2626', dot: 'bg-red-500' },
  high: { bg: 'rgba(245,158,11,0.06)', text: '#d97706', dot: 'bg-amber-500' },
  medium: { bg: 'rgba(59,130,246,0.06)', text: '#2563eb', dot: 'bg-blue-500' },
  low: { bg: 'rgba(116,188,200,0.06)', text: '#4FAFC0', dot: 'bg-[#74BCC8]' },
};
const SEV_LABELS: Record<string, string> = { critical: 'Kritik', high: 'Yuksek', medium: 'Orta', low: 'Dusuk' };

export default function InsightsPage() {
  const [risk, setRisk] = useState<any>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/insights/risk'), api.get('/insights/recommendations')])
      .then(([r, rec]) => { setRisk(r.data); setRecs(rec.data); })
      .catch(() => toast.error('Veriler yuklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0,1,2,3].map(i => <CardSkeleton key={i} />)}</div>;

  const healthColor = risk?.healthScore >= 75 ? '#10b981' : risk?.healthScore >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <PageTransition>
      {/* Health + Risk Summary */}
      <div className="mb-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: `${healthColor}15` }}>
            <Activity size={20} style={{ color: healthColor }} strokeWidth={1.5} />
          </div>
          <p className="text-[32px] font-bold" style={{ color: healthColor }}>{risk?.healthScore || 0}</p>
          <p className="text-[12px] text-slate-400">Varlik Sagligi Puani</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3 bg-red-50">
            <ShieldAlert size={20} className="text-red-500" strokeWidth={1.5} />
          </div>
          <p className="text-[24px] font-bold text-slate-900">{risk?.distribution?.critical || 0}</p>
          <p className="text-[12px] text-slate-400">Kritik Risk</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3 bg-amber-50">
            <AlertTriangle size={20} className="text-amber-500" strokeWidth={1.5} />
          </div>
          <p className="text-[24px] font-bold text-slate-900">{risk?.distribution?.high || 0}</p>
          <p className="text-[12px] text-slate-400">Yuksek Risk</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: 'rgba(116,188,200,0.1)' }}>
            <CheckCircle2 size={20} style={{ color: '#74BCC8' }} strokeWidth={1.5} />
          </div>
          <p className="text-[24px] font-bold text-slate-900">{risk?.distribution?.low || 0}</p>
          <p className="text-[12px] text-slate-400">Dusuk Risk</p>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recommendations */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} style={{ color: '#74BCC8' }} />
            <h2 className="text-[15px] font-semibold text-slate-800">Operasyonel Oneriler</h2>
          </div>
          {recs.length === 0 ? (
            <p className="text-[13px] text-slate-400 py-8 text-center">Tebrikler! Su anda onerilen bir islem yok.</p>
          ) : (
            <div className="space-y-3">
              {recs.map((r, i) => {
                const sev = SEV_COLORS[r.severity] || SEV_COLORS.low;
                return (
                  <div key={i} className="rounded-xl p-4 border" style={{ backgroundColor: sev.bg, borderColor: 'transparent' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-2 w-2 rounded-full ${sev.dot}`} />
                      <span className="text-[12px] font-semibold" style={{ color: sev.text }}>{SEV_LABELS[r.severity]}</span>
                      <span className="text-[12px] font-semibold text-slate-700 ml-1">{r.title}</span>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed">{r.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Top Risk Assets */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={18} style={{ color: '#74BCC8' }} />
            <h2 className="text-[15px] font-semibold text-slate-800">En Yuksek Riskli Cihazlar</h2>
          </div>
          {!risk?.topRisks?.length ? (
            <p className="text-[13px] text-slate-400 py-8 text-center">Riskli cihaz bulunamadi.</p>
          ) : (
            <div className="space-y-2">
              {risk.topRisks.slice(0, 8).map((item: any) => {
                const sev = SEV_COLORS[item.riskLevel] || SEV_COLORS.low;
                return (
                  <div key={item._id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{item.assetId} · {item.vendor}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${item.riskScore}%`, backgroundColor: sev.text }} />
                      </div>
                      <span className="text-[12px] font-semibold tabular-nums w-8 text-right" style={{ color: sev.text }}>{item.riskScore}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}

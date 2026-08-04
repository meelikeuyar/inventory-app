import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Pencil, Trash2, ArrowRightLeft, Upload, RefreshCw } from 'lucide-react';
import api from '../services/api';
import type { AuditLog } from '../types';
import PageTransition from '../components/ui/PageTransition';

const ICONS: Record<string, typeof Clock> = { created: Plus, updated: Pencil, deleted: Trash2, moved: ArrowRightLeft, imported: Upload, bulk_updated: RefreshCw };
const COLORS: Record<string, string> = { created: 'bg-emerald-100 text-emerald-600', updated: 'bg-brand-100 text-brand-600', deleted: 'bg-red-100 text-red-600', moved: 'bg-amber-100 text-amber-600', imported: 'bg-violet-100 text-violet-600', bulk_updated: 'bg-cyan-100 text-cyan-600' };
const LABELS: Record<string, string> = { created: 'Oluşturuldu', updated: 'Güncellendi', deleted: 'Silindi', moved: 'Taşındı', imported: 'İçe Aktarıldı', bulk_updated: 'Toplu Güncellendi' };

export default function ActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/activity').then(({ data }) => setLogs(data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  return (
    <PageTransition>
      <div className="mb-6"><h1 className="text-2xl font-semibold text-gray-900">Aktivite Geçmişi</h1><p className="mt-1 text-sm text-gray-500">Son {logs.length} işlem</p></div>
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {loading ? <div className="space-y-4">{[0,1,2,3].map(i=><div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100"/>)}</div> : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400"><Clock size={24} className="mx-auto mb-2"/><p>Henüz aktivite kaydı yok</p></div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100"/>
            <div className="space-y-1">
              {logs.map((log, i) => {
                const Icon = ICONS[log.action] || Clock;
                const d = new Date(log.createdAt);
                return (
                  <motion.div key={log._id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}} className="relative flex gap-3 py-3">
                    <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${COLORS[log.action] || 'bg-gray-100 text-gray-500'}`}><Icon size={14}/></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-gray-800">{LABELS[log.action] || log.action}</span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{log.entityType}</span>
                        <span className="text-[11px] text-gray-400">{d.toLocaleDateString('tr-TR')} {d.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                      <p className="text-[12px] text-gray-500">{log.userId?.fullName || 'Sistem'}</p>
                      {log.changes.length > 0 && <div className="mt-1 space-y-0.5">{log.changes.slice(0,3).map((c,ci)=><p key={ci} className="text-[11px] text-gray-400"><span className="font-medium">{c.field}:</span> {c.oldValue && <span className="text-red-500 line-through">{c.oldValue}</span>} {c.newValue && <span className="text-emerald-600">{c.newValue}</span>}</p>)}</div>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

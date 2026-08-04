import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, ShieldAlert, Plus, Trash2, Upload, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import type { AuditLog } from '../types';
import PageTransition from '../components/ui/PageTransition';

const NOTIF_ICONS: Record<string, typeof Bell> = { created: Plus, deleted: Trash2, imported: Upload, default: AlertTriangle };
const NOTIF_MSG: Record<string, string> = { created: 'Yeni cihaz eklendi', deleted: 'Cihaz silindi', imported: 'Excel import tamamlandı', updated: 'Cihaz güncellendi', moved: 'Cihaz taşındı', bulk_updated: 'Toplu güncelleme yapıldı' };

export default function NotificationsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/activity?limit=30').then(({ data }) => setLogs(data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  return (
    <PageTransition>
      <div className="mb-6"><h1 className="text-2xl font-semibold text-gray-900">Bildirimler</h1><p className="mt-1 text-sm text-gray-500">{logs.length} bildirim</p></div>
      <div className="space-y-2">
        {loading ? [0,1,2].map(i=><div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100"/>) : logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center"><Bell size={24} className="mx-auto mb-2 text-gray-300"/><p className="text-sm text-gray-400">Bildirim yok</p></div>
        ) : logs.map((log, i) => {
          const Icon = NOTIF_ICONS[log.action] || NOTIF_ICONS.default!;
          const d = new Date(log.createdAt);
          const name = log.changes.find(c => c.field === 'name');
          return (
            <motion.div key={log._id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
              className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon size={16}/></div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-800">{NOTIF_MSG[log.action] || log.action}</p>
                {name && <p className="text-[12px] text-gray-500 truncate">{name.newValue || name.oldValue}</p>}
                <p className="text-[11px] text-gray-400 mt-0.5">{log.userId?.fullName} — {d.toLocaleDateString('tr-TR')} {d.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageTransition>
  );
}

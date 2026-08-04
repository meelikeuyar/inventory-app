import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Pencil, Trash2, ArrowRightLeft, Upload, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import type { AuditLog } from '../../types';

const ACTION_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  created: { icon: Plus, color: 'bg-emerald-100 text-emerald-600', label: 'Oluşturuldu' },
  updated: { icon: Pencil, color: 'bg-brand-100 text-brand-600', label: 'Güncellendi' },
  deleted: { icon: Trash2, color: 'bg-red-100 text-red-600', label: 'Silindi' },
  moved: { icon: ArrowRightLeft, color: 'bg-amber-100 text-amber-600', label: 'Taşındı' },
  imported: { icon: Upload, color: 'bg-violet-100 text-violet-600', label: 'İçe Aktarıldı' },
  bulk_updated: { icon: RefreshCw, color: 'bg-cyan-100 text-cyan-600', label: 'Toplu Güncellendi' },
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Cihaz Adı', ipAddress: 'IP Adresi', serialNumber: 'Seri No', vendor: 'Üretici',
  model: 'Model', cpu: 'CPU', ram: 'RAM', storage: 'Depolama', os: 'İşletim Sistemi',
  rack: 'Raf', cabinet: 'Kabin', rackPosition: 'Raf Pozisyonu', status: 'Durum',
  warrantyDate: 'Garanti Tarihi', notes: 'Notlar', site: 'Site',
};

interface Props {
  apiPath: string;
  itemId: string;
}

export default function AssetTimeline({ apiPath, itemId }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`${apiPath}/${itemId}/timeline`)
      .then(({ data }) => setLogs(data.logs))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [apiPath, itemId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        <Clock size={24} className="mx-auto mb-2 text-gray-300" />
        Henüz geçmiş kaydı yok
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />

      <div className="space-y-1">
        {logs.map((log, idx) => {
          const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.updated!;
          const Icon = config.icon;
          const date = new Date(log.createdAt);

          return (
            <motion.div
              key={log._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative flex gap-3 py-3 pl-0"
            >
              {/* Icon */}
              <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                <Icon size={14} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-gray-800">{config.label}</span>
                  <span className="text-[11px] text-gray-400">
                    {date.toLocaleDateString('tr-TR')} {date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[12px] text-gray-500">
                  {log.userId?.fullName || 'Sistem'}
                </p>

                {/* Changes */}
                {log.changes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {log.changes.map((change, ci) => (
                      <div key={ci} className="flex items-center gap-2 text-[11px]">
                        <span className="font-medium text-gray-500">{FIELD_LABELS[change.field] || change.field}:</span>
                        {change.oldValue && (
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 line-through">
                            {change.oldValue}
                          </span>
                        )}
                        {change.oldValue && change.newValue && <span className="text-gray-300">→</span>}
                        {change.newValue && (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600">
                            {change.newValue}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

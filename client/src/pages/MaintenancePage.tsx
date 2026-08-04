import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wrench, Search, X, CheckCircle2, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import PageTransition from '../components/ui/PageTransition';
import Modal from '../components/ui/Modal';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';

const TYPE_LABELS: Record<string, string> = { preventive: 'Onleyici', corrective: 'Duzeltici', upgrade: 'Yukseltme', inspection: 'Denetim' };
const STATUS_LABELS: Record<string, string> = { scheduled: 'Planli', in_progress: 'Devam Ediyor', completed: 'Tamamlandi', cancelled: 'Iptal' };
const STATUS_COLORS: Record<string, string> = { scheduled: '#f59e0b', in_progress: '#3b82f6', completed: '#10b981', cancelled: '#94a3b8' };

export default function MaintenancePage() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['admin', 'project_manager', 'engineer', 'technician']);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ assetId: '', type: 'corrective', description: '', cost: 0, parts: '', scheduledDate: '', notes: '' });
  const [assets, setAssets] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const [recs, st] = await Promise.all([
        api.get(`/maintenance?${params}`), api.get('/maintenance/stats')
      ]);
      setRecords(recs.data.records); setStats(st.data);
    } catch { toast.error('Veriler yuklenemedi'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const openModal = async () => {
    try { const { data } = await api.get('/inventory?limit=200'); setAssets(data.items); } catch {}
    setShowModal(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.assetId || !form.description) return;
    setSubmitting(true);
    try {
      await api.post('/maintenance', form);
      toast.success('Bakim kaydi olusturuldu');
      setShowModal(false); setForm({ assetId: '', type: 'corrective', description: '', cost: 0, parts: '', scheduledDate: '', notes: '' });
      fetchData();
    } catch { toast.error('Kayit olusturulamadi'); }
    finally { setSubmitting(false); }
  };

  const handleComplete = async (id: string) => {
    try { await api.put(`/maintenance/${id}/complete`); toast.success('Bakim tamamlandi'); fetchData(); }
    catch { toast.error('Islem basarisiz'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kaydi silmek istediginize emin misiniz?')) return;
    try { await api.delete(`/maintenance/${id}`); toast.success('Kayit silindi'); fetchData(); }
    catch { toast.error('Silinemedi'); }
  };

  const filtered = search ? records.filter(r => r.description?.toLowerCase().includes(search.toLowerCase()) || r.asset?.name?.toLowerCase().includes(search.toLowerCase())) : records;

  const statCards = stats ? [
    { icon: Wrench, label: 'Toplam Bakim', value: stats.total, color: '#74BCC8', bg: 'rgba(116,188,200,0.1)' },
    { icon: Clock, label: 'Planli', value: stats.scheduled, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { icon: AlertTriangle, label: 'Devam Eden', value: stats.inProgress, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { icon: DollarSign, label: 'Toplam Maliyet', value: `${stats.totalCost.toLocaleString()} TL`, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  ] : [];

  return (
    <PageTransition>
      {/* Stats */}
      {stats && (
        <div className="mb-5 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: s.bg }}>
                <s.icon size={20} style={{ color: s.color }} strokeWidth={1.5} />
              </div>
              <p className="text-[24px] font-bold text-slate-900">{s.value}</p>
              <p className="text-[12px] text-slate-400">{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-slate-900">Bakim Yonetimi</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">{records.length} kayit</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input className="h-[38px] w-[180px] rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-[13px] placeholder:text-slate-300 outline-none focus:border-[#74BCC8] focus:ring-2 focus:ring-[#74BCC8]/15"
                placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X size={14} /></button>}
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[38px] px-3 rounded-lg border border-slate-200 text-[13px] text-slate-500 outline-none focus:border-[#74BCC8]">
              <option value="">Tum Durumlar</option>
              <option value="scheduled">Planli</option><option value="in_progress">Devam Eden</option>
              <option value="completed">Tamamlanan</option><option value="cancelled">Iptal</option>
            </select>
            {canManage && (
              <button onClick={openModal} className="flex items-center gap-1.5 h-[38px] px-4 rounded-lg text-[13px] font-medium text-white transition hover:-translate-y-[0.5px]" style={{ backgroundColor: '#74BCC8' }}>
                <Plus size={15} /> Yeni Bakim
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Yeni Bakim Kaydi">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-slate-600">Cihaz *</label>
            <select className="block w-full h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-[#74BCC8] focus:ring-2 focus:ring-[#74BCC8]/15"
              value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} required>
              <option value="">Cihaz secin</option>
              {assets.map((a: any) => <option key={a._id} value={a._id}>{a.name} {a.assetId ? `(${a.assetId})` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-slate-600">Tip *</label>
              <select className="block w-full h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-[#74BCC8]"
                value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="corrective">Duzeltici</option><option value="preventive">Onleyici</option>
                <option value="upgrade">Yukseltme</option><option value="inspection">Denetim</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-slate-600">Maliyet (TL)</label>
              <input type="number" className="block w-full h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-[#74BCC8]"
                min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-slate-600">Aciklama *</label>
            <input className="block w-full h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-[#74BCC8]"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-slate-600">Degisen Parcalar</label>
            <input className="block w-full h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-[#74BCC8]"
              placeholder="SSD, RAM, Fan..." value={form.parts} onChange={(e) => setForm({ ...form, parts: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-slate-600">Planlanan Tarih</label>
              <input type="date" className="block w-full h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-[#74BCC8]"
                value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-slate-600">Notlar</label>
              <input className="block w-full h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-[#74BCC8]"
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={submitting} className="flex-1 h-[42px] rounded-xl text-white text-[14px] font-medium disabled:opacity-60" style={{ backgroundColor: '#74BCC8' }}>
              {submitting ? 'Olusturuluyor...' : 'Olustur'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="h-[42px] px-5 rounded-xl border border-slate-200 text-[14px] text-slate-500 hover:bg-slate-50">Iptal</button>
          </div>
        </form>
      </Modal>

      {/* Table */}
      {loading ? <CardSkeleton /> : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {['Cihaz', 'Tip', 'Aciklama', 'Maliyet', 'Durum', 'Tarih', 'Islemler'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <Wrench size={32} className="mx-auto mb-2 text-slate-200" />
                    <p className="text-[14px] text-slate-400">Henuz bakim kaydi yok</p>
                  </td></tr>
                ) : filtered.map((r: any) => (
                  <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{r.asset?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{TYPE_LABELS[r.type] || r.type}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{r.description}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">{r.cost > 0 ? `${r.cost.toLocaleString()} TL` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[r.status] }} />
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[12px]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('tr-TR') : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {r.status !== 'completed' && canManage && (
                          <button onClick={() => handleComplete(r._id)} className="flex h-7 items-center gap-1 px-2 rounded-lg text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 transition">
                            <CheckCircle2 size={13} /> Tamamla
                          </button>
                        )}
                        {canManage && (
                          <button onClick={() => handleDelete(r._id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </PageTransition>
  );
}

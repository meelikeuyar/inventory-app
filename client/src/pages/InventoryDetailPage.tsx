import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Server, Cpu, HardDrive, Network, Shield, FileText, Clock, Pencil } from 'lucide-react';
import api from '../services/api';
import type { InventoryItem } from '../types';
import toast from 'react-hot-toast';
import PageTransition from '../components/ui/PageTransition';
import AssetTimeline from '../components/ui/AssetTimeline';
import Modal from '../components/ui/Modal';

const STATUS_BADGE: Record<string, string> = { active: 'bg-emerald-50 text-emerald-700', inactive: 'bg-gray-100 text-gray-600', maintenance: 'bg-amber-50 text-amber-700', decommissioned: 'bg-red-50 text-red-600' };
const STATUS_LABELS: Record<string, string> = { active: 'Aktif', inactive: 'Pasif', maintenance: 'Bakım', decommissioned: 'Devre Dışı' };

type Tab = 'general' | 'hardware' | 'network' | 'warranty' | 'history' | 'notes';

export default function InventoryDetailPage() {
  const { projectId, siteId, itemId } = useParams();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('general');
  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const basePath = `/projects/${projectId}/sites/${siteId}/items`;

  useEffect(() => {
    api.get(`${basePath}/${itemId}`).then(({ data }) => { setItem(data); setForm({ name: data.name, ipAddress: data.ipAddress||'', serialNumber: data.serialNumber||'', vendor: data.vendor||'', model: data.model||'', cpu: data.cpu||'', ram: data.ram||'', storage: data.storage||'', os: data.os||'', rack: data.rack||'', cabinet: data.cabinet||'', rackPosition: String(data.rackPosition||0), status: data.status||'active', warrantyDate: data.warrantyDate?data.warrantyDate.slice(0,10):'', notes: data.notes||'' }); })
      .catch(() => toast.error('Cihaz bulunamadı')).finally(() => setLoading(false));
  }, [basePath, itemId]);

  const handleSave = async () => {
    try { const { data } = await api.put(`${basePath}/${itemId}`, { ...form, rackPosition: parseInt(form.rackPosition||'0') }); setItem(data); setEditModal(false); toast.success('Güncellendi'); } catch { toast.error('Güncelleme başarısız'); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500"/></div>;
  if (!item) return <div className="py-16 text-center text-gray-400">Cihaz bulunamadı</div>;

  const tabs: Array<{ key: Tab; label: string; icon: typeof Server }> = [
    { key: 'general', label: 'Genel', icon: Server }, { key: 'hardware', label: 'Donanım', icon: Cpu },
    { key: 'network', label: 'Ağ', icon: Network }, { key: 'warranty', label: 'Garanti', icon: Shield },
    { key: 'history', label: 'Geçmiş', icon: Clock }, { key: 'notes', label: 'Notlar', icon: FileText },
  ];

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-start border-b border-gray-50 py-2.5">
      <span className="w-36 shrink-0 text-[12px] font-medium text-gray-500">{label}</span>
      <span className="text-[13px] text-gray-800">{value || '—'}</span>
    </div>
  );

  return (
    <PageTransition>
      <div className="mb-4">
        <Link to={`/projects/${projectId}/sites/${siteId}/inventory`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
          <ArrowLeft size={14}/> Envanter
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Server size={28}/></div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{item.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[item.status]||''}`}>{STATUS_LABELS[item.status]}</span>
              <span className="text-[12px] text-gray-400">{item.vendor} {item.model}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setEditModal(true)} className="btn-primary text-[13px]"><Pencil size={14}/> Düzenle</button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-gray-100">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[13px] font-medium transition ${tab === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={14}/>{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {tab === 'general' && (
          <div><InfoRow label="Hostname" value={item.name}/><InfoRow label="IP Adresi" value={item.ipAddress}/><InfoRow label="Seri Numarası" value={item.serialNumber}/><InfoRow label="Üretici" value={item.vendor}/><InfoRow label="Model" value={item.model}/><InfoRow label="Durum" value={STATUS_LABELS[item.status]||item.status}/><InfoRow label="Raf" value={item.rack ? `${item.rack} U${item.rackPosition}` : ''}/><InfoRow label="Kabin" value={item.cabinet}/><InfoRow label="Ekleyen" value={typeof item.addedBy === 'object' ? item.addedBy.fullName : ''}/><InfoRow label="Oluşturulma" value={new Date(item.createdAt).toLocaleString('tr-TR')}/><InfoRow label="Son Güncelleme" value={new Date(item.updatedAt).toLocaleString('tr-TR')}/></div>
        )}
        {tab === 'hardware' && (
          <div><InfoRow label="CPU" value={item.cpu}/><InfoRow label="RAM" value={item.ram}/><InfoRow label="Depolama" value={item.storage}/><InfoRow label="İşletim Sistemi" value={item.os}/></div>
        )}
        {tab === 'network' && (
          <div><InfoRow label="IP Adresi" value={item.ipAddress}/><InfoRow label="Hostname" value={item.name}/></div>
        )}
        {tab === 'warranty' && (
          <div>
            <InfoRow label="Garanti Tarihi" value={item.warrantyDate ? new Date(item.warrantyDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}/>
            <InfoRow label="Seri Numarası" value={item.serialNumber}/>
            {item.warrantyDate && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <p className="text-[12px] font-medium text-gray-600">
                  {new Date(item.warrantyDate) > new Date() ? `Garanti bitimine ${Math.ceil((new Date(item.warrantyDate).getTime() - Date.now()) / (1000*60*60*24))} gün kaldı` : 'Garanti süresi dolmuş'}
                </p>
              </div>
            )}
          </div>
        )}
        {tab === 'history' && <AssetTimeline apiPath={basePath} itemId={itemId!}/>}
        {tab === 'notes' && (
          <div>{item.notes ? <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{item.notes}</p> : <p className="text-[13px] text-gray-400">Not eklenmemiş</p>}</div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Cihaz Düzenle">
        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            {[['name','Hostname'],['ipAddress','IP'],['serialNumber','Seri No'],['vendor','Üretici'],['model','Model'],['cpu','CPU'],['ram','RAM'],['storage','Depolama'],['os','OS'],['rack','Raf'],['cabinet','Kabin']].map(([k,l]) => (
              <div key={k}><label className="mb-1 block text-xs font-medium text-gray-500">{l}</label><input className="input-base" value={form[k!]||''} onChange={e => setForm({...form,[k!]:e.target.value})}/></div>
            ))}
            <div><label className="mb-1 block text-xs font-medium text-gray-500">Durum</label><select className="input-base" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">Aktif</option><option value="inactive">Pasif</option><option value="maintenance">Bakım</option><option value="decommissioned">Devre Dışı</option></select></div>
            <div><label className="mb-1 block text-xs font-medium text-gray-500">Garanti</label><input type="date" className="input-base" value={form.warrantyDate||''} onChange={e=>setForm({...form,warrantyDate:e.target.value})}/></div>
            <div className="col-span-2"><label className="mb-1 block text-xs font-medium text-gray-500">Notlar</label><textarea className="input-base" rows={2} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
          </div>
          <div className="flex gap-2 pt-2"><button onClick={handleSave} className="btn-primary flex-1">Kaydet</button><button onClick={()=>setEditModal(false)} className="btn-secondary">İptal</button></div>
        </div>
      </Modal>
    </PageTransition>
  );
}

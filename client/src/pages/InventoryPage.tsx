import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, ArrowLeft, Pencil, Trash2, X, Inbox, Server, Clock, Table2 } from 'lucide-react';
import api from '../services/api';
import type { InventoryItem, Pagination, Site } from '../types';
import toast from 'react-hot-toast';
import PageTransition from '../components/ui/PageTransition';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import ImportWizard from '../components/ui/ImportWizard';
import ExportMenu from '../components/ui/ExportMenu';
import AdvancedFilter, { type FilterValues } from '../components/ui/AdvancedFilter';
import AssetTimeline from '../components/ui/AssetTimeline';
import RackView from '../components/ui/RackView';
import BulkActionBar from '../components/ui/BulkActionBar';
import { useAuth } from '../context/AuthContext';

type ViewMode = 'table' | 'rack';

const STATUS_DOT: Record<string, string> = { active: 'bg-emerald-500', inactive: 'bg-red-400', maintenance: 'bg-amber-400', decommissioned: 'bg-slate-300' };
const STATUS_LABELS: Record<string, string> = { active: 'Aktif', inactive: 'Pasif', maintenance: 'Bakim', decommissioned: 'Devre Disi' };

const inputCls = 'block w-full h-[42px] rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-[#74BCC8] focus:ring-2 focus:ring-[#74BCC8]/15';
const labelCls = 'mb-1 block text-[12px] font-semibold text-slate-600';

export default function InventoryPage() {
  const { projectId, siteId } = useParams<{ projectId: string; siteId: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'project_manager', 'engineer']);
  const canDelete = hasRole(['admin', 'project_manager']);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [showModal, setShowModal] = useState(false);
  const [showTimeline, setShowTimeline] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', ipAddress: '', serialNumber: '', vendor: '', model: '', category: 'other' as string, criticality: 'medium' as string, cpu: '', ram: '', storage: '', os: '', rack: '', cabinet: '', rackPosition: 0, status: 'active' as string, warrantyDate: '', purchaseDate: '', purchasePrice: 0, supplier: '', invoiceNumber: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sites, setSites] = useState<Site[]>([]);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const basePath = `/projects/${projectId}/sites/${siteId}/items`;

  const [filters, setFilters] = useState<FilterValues>({ vendor: '', status: '', os: '', rack: '', warrantyBefore: '', warrantyAfter: '' });
  const [vendors, setVendors] = useState<string[]>([]);
  const [osList, setOsList] = useState<string[]>([]);
  const [racks, setRacks] = useState<string[]>([]);

  useEffect(() => { api.get('/filter-options').then(({ data }) => { setVendors(data.vendors || []); setOsList(data.osList || []); setRacks(data.racks || []); }).catch(() => { }); }, []);

  const fetchItems = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filters.vendor) params.set('vendor', filters.vendor);
      if (filters.status) params.set('status', filters.status);
      if (filters.os) params.set('os', filters.os);
      if (filters.rack) params.set('rack', filters.rack);
      if (filters.warrantyBefore) params.set('warrantyBefore', filters.warrantyBefore);
      if (filters.warrantyAfter) params.set('warrantyAfter', filters.warrantyAfter);
      const { data } = await api.get(`${basePath}?${params}`);
      setItems(data.items); setPagination(data.pagination);
    } catch { toast.error('Envanter yuklenemedi'); }
    finally { setLoading(false); }
  }, [basePath, debouncedSearch, filters]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { api.get<Site[]>(`/projects/${projectId}/sites`).then(({ data }) => setSites(data)).catch(() => { }); }, [projectId]);

  const resetForm = () => { setForm({ name: '', ipAddress: '', serialNumber: '', vendor: '', model: '', category: 'other', criticality: 'medium', cpu: '', ram: '', storage: '', os: '', rack: '', cabinet: '', rackPosition: 0, status: 'active', warrantyDate: '', purchaseDate: '', purchasePrice: 0, supplier: '', invoiceNumber: '', notes: '' }); setEditId(null); setShowModal(false); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      if (editId) { await api.put(`${basePath}/${editId}`, form); toast.success('Kayit guncellendi'); }
      else { await api.post(basePath, form); toast.success('Kayit eklendi'); }
      resetForm(); fetchItems(pagination.page);
    } catch { toast.error('Islem basarisiz'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (item: InventoryItem) => {
    setForm({ name: item.name, ipAddress: item.ipAddress, serialNumber: item.serialNumber, vendor: item.vendor || '', model: item.model || '', category: item.category || 'other', criticality: item.criticality || 'medium', cpu: item.cpu || '', ram: item.ram || '', storage: item.storage || '', os: item.os || '', rack: item.rack || '', cabinet: item.cabinet || '', rackPosition: item.rackPosition || 0, status: item.status || 'active', warrantyDate: item.warrantyDate ? item.warrantyDate.slice(0, 10) : '', purchaseDate: item.purchaseDate ? item.purchaseDate.slice(0, 10) : '', purchasePrice: item.purchasePrice || 0, supplier: item.supplier || '', invoiceNumber: item.invoiceNumber || '', notes: item.notes || '' });
    setEditId(item._id); setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kaydi silmek istediginize emin misiniz?')) return;
    try { await api.delete(`${basePath}/${id}`); toast.success('Kayit silindi'); fetchItems(pagination.page); } catch { toast.error('Kayit silinemedi'); }
  };

  const toggleSelect = (id: string) => { setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const toggleSelectAll = () => { selectedIds.size === items.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(items.map(i => i._id))); };

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedIds.size} kaydi silmek istediginize emin misiniz?`)) return;
    try { await api.post(`${basePath}/bulk-delete`, { itemIds: [...selectedIds] }); toast.success(`${selectedIds.size} kayit silindi`); setSelectedIds(new Set()); fetchItems(1); }
    catch { toast.error('Toplu silme basarisiz'); }
  };
  const handleBulkUpdate = async (updates: Record<string, string>) => {
    try { await api.post(`${basePath}/bulk-update`, { itemIds: [...selectedIds], updates }); toast.success('Kayitlar guncellendi'); setSelectedIds(new Set()); fetchItems(pagination.page); }
    catch { toast.error('Toplu guncelleme basarisiz'); }
  };
  const handleBulkMove = async (targetSiteId: string) => {
    try { await api.post(`${basePath}/bulk-move`, { itemIds: [...selectedIds], targetSiteId }); toast.success('Kayitlar tasindi'); setSelectedIds(new Set()); fetchItems(1); }
    catch { toast.error('Toplu tasima basarisiz'); }
  };

  return (
    <PageTransition>
      {/* Back */}
      <div className="mb-4">
        <Link to={`/projects/${projectId}/sites`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
          <ArrowLeft size={13} /> Siteler
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-slate-900">Envanter</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">{pagination.total} kayit</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Toggle */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-3 py-2 text-[12px] font-medium transition ${viewMode === 'table' ? 'text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                style={viewMode === 'table' ? { backgroundColor: '#74BCC8' } : undefined}>
                <Table2 size={13} /> Tablo
              </button>
              <button onClick={() => setViewMode('rack')}
                className={`flex items-center gap-1 px-3 py-2 text-[12px] font-medium transition ${viewMode === 'rack' ? 'text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                style={viewMode === 'rack' ? { backgroundColor: '#74BCC8' } : undefined}>
                <Server size={13} /> Raf
              </button>
            </div>
            <ExportMenu items={items} filename="envanter" />
            <AdvancedFilter onApply={(f) => setFilters(f)} vendors={vendors} osList={osList} racks={racks} />
            {canEdit && (
              <>
                <button onClick={() => { resetForm(); setShowModal(true); }}
                  className="flex items-center gap-1.5 h-[38px] px-4 rounded-lg text-[13px] font-medium text-white transition hover:-translate-y-[0.5px] hover:shadow-md"
                  style={{ backgroundColor: '#74BCC8' }}>
                  <Plus size={15} /> Yeni Kayit
                </button>
                <button onClick={() => setShowImportWizard(true)}
                  className="flex items-center gap-1.5 h-[38px] px-3 rounded-lg border border-slate-200 text-[13px] text-slate-500 hover:bg-slate-50 transition">
                  Import
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ImportWizard open={showImportWizard} onClose={() => setShowImportWizard(false)} apiPath={basePath} onSuccess={() => fetchItems(1)} />

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={resetForm} title={editId ? 'Kaydi Duzenle' : 'Yeni Kayit Ekle'}>
        <form onSubmit={handleSubmit} className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelCls}>Cihaz Adi *</label><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus /></div>
            <div><label className={labelCls}>IP Adresi</label><input className={inputCls} value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} /></div>
            <div><label className={labelCls}>Seri No</label><input className={inputCls} value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></div>
            <div><label className={labelCls}>Uretici</label><input className={inputCls} placeholder="Cisco, HP, Dell..." value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
            <div><label className={labelCls}>Model</label><input className={inputCls} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
            <div><label className={labelCls}>Kategori</label>
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="server">Server</option><option value="switch">Switch</option><option value="router">Router</option>
                <option value="firewall">Firewall</option><option value="laptop">Laptop</option><option value="desktop">Desktop</option>
                <option value="monitor">Monitor</option><option value="printer">Printer</option><option value="phone">Telefon</option>
                <option value="storage">Storage</option><option value="ups">UPS</option><option value="other">Diger</option>
              </select>
            </div>
            <div><label className={labelCls}>Kritiklik</label>
              <select className={inputCls} value={form.criticality} onChange={(e) => setForm({ ...form, criticality: e.target.value })}>
                <option value="critical">Kritik</option><option value="high">Yuksek</option><option value="medium">Orta</option><option value="low">Dusuk</option>
              </select>
            </div>
            <div><label className={labelCls}>CPU</label><input className={inputCls} value={form.cpu} onChange={(e) => setForm({ ...form, cpu: e.target.value })} /></div>
            <div><label className={labelCls}>RAM</label><input className={inputCls} value={form.ram} onChange={(e) => setForm({ ...form, ram: e.target.value })} /></div>
            <div><label className={labelCls}>Depolama</label><input className={inputCls} value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} /></div>
            <div><label className={labelCls}>Isletim Sistemi</label><input className={inputCls} value={form.os} onChange={(e) => setForm({ ...form, os: e.target.value })} /></div>
            <div><label className={labelCls}>Raf</label><input className={inputCls} placeholder="RACK-A01" value={form.rack} onChange={(e) => setForm({ ...form, rack: e.target.value })} /></div>
            <div><label className={labelCls}>Raf Pozisyonu (U)</label><input type="number" className={inputCls} min={0} max={48} value={form.rackPosition} onChange={(e) => setForm({ ...form, rackPosition: parseInt(e.target.value) || 0 })} /></div>
            <div><label className={labelCls}>Durum</label>
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Aktif</option><option value="inactive">Pasif</option>
                <option value="maintenance">Bakim</option><option value="decommissioned">Devre Disi</option>
              </select>
            </div>
            <div><label className={labelCls}>Garanti Tarihi</label><input type="date" className={inputCls} value={form.warrantyDate} onChange={(e) => setForm({ ...form, warrantyDate: e.target.value })} /></div>
            <div><label className={labelCls}>Satin Alma Tarihi</label><input type="date" className={inputCls} value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></div>
            <div><label className={labelCls}>Satin Alma Fiyati (TL)</label><input type="number" className={inputCls} min={0} value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: parseFloat(e.target.value) || 0 })} /></div>
            <div><label className={labelCls}>Tedarikci</label><input className={inputCls} placeholder="Tedarikci adi" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
            <div><label className={labelCls}>Fatura No</label><input className={inputCls} value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} /></div>
            <div className="col-span-2"><label className={labelCls}>Notlar</label><textarea className={`${inputCls} h-auto`} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={submitting} className="flex-1 h-[42px] rounded-xl text-white text-[14px] font-medium transition disabled:opacity-60" style={{ backgroundColor: '#74BCC8' }}>
              {submitting ? '...' : editId ? 'Guncelle' : 'Ekle'}
            </button>
            <button type="button" onClick={resetForm} className="h-[42px] px-5 rounded-xl border border-slate-200 text-[14px] text-slate-500 hover:bg-slate-50 transition">Iptal</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!showTimeline} onClose={() => setShowTimeline(null)} title="Cihaz Gecmisi">
        {showTimeline && <AssetTimeline apiPath={basePath} itemId={showTimeline} />}
      </Modal>

      {viewMode === 'rack' ? (
        <RackView apiPath={basePath} onSelectItem={(item) => handleEdit(item)} />
      ) : (
        <>
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input className="h-[38px] w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-[#74BCC8] focus:ring-2 focus:ring-[#74BCC8]/15"
                placeholder="Ad, IP, seri no, uretici, raf..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"><X size={14} /></button>}
            </div>
          </div>

          {loading ? <TableSkeleton rows={6} /> : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="w-10 px-3 py-3">
                        <input type="checkbox" checked={items.length > 0 && selectedIds.size === items.length} onChange={toggleSelectAll}
                          className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer accent-[#74BCC8]" />
                      </th>
                      {['Hostname', 'IP', 'Uretici', 'Model', 'Raf', 'Durum', 'Islemler'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={8} className="py-16 text-center">
                        <Inbox size={32} className="mx-auto mb-2 text-slate-200" />
                        <p className="text-[14px] text-slate-400">{search ? 'Sonuc bulunamadi' : 'Henuz kayit yok'}</p>
                      </td></tr>
                    ) : items.map((item) => (
                      <tr key={item._id}
                        onClick={() => navigate(`/projects/${projectId}/sites/${siteId}/inventory/${item._id}`)}
                        className={`cursor-pointer border-b border-slate-50 transition-colors duration-100 ${selectedIds.has(item._id) ? 'bg-[rgba(116,188,200,0.04)]' : 'hover:bg-slate-50/60'}`}>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.has(item._id)} onChange={() => toggleSelect(item._id)}
                            className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer accent-[#74BCC8]" />
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-800">{item.name}</td>
                        <td className="px-3 py-3 font-mono text-[11px] text-slate-400">{item.ipAddress || '—'}</td>
                        <td className="px-3 py-3 text-slate-600">{item.vendor || '—'}</td>
                        <td className="px-3 py-3 text-slate-500">{item.model || '—'}</td>
                        <td className="px-3 py-3 text-[11px] font-mono text-slate-400">{item.rack ? `${item.rack} U${item.rackPosition}` : '—'}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[item.status] || 'bg-slate-300'}`} />
                            <span className="text-slate-600">{STATUS_LABELS[item.status] || item.status}</span>
                          </span>
                        </td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-0.5">
                            <button onClick={() => setShowTimeline(item._id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-100 hover:text-slate-600" title="Gecmis"><Clock size={14} /></button>
                            {canEdit && <button onClick={() => handleEdit(item)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-[rgba(116,188,200,0.1)] hover:text-[#4FAFC0]"><Pencil size={14} /></button>}
                            {canDelete && <button onClick={() => handleDelete(item._id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-[13px] text-slate-400">
              <span>Sayfa {pagination.page} / {pagination.pages} · {pagination.total} kayit</span>
              <div className="flex gap-1">
                <button disabled={pagination.page <= 1} onClick={() => fetchItems(pagination.page - 1)}
                  className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] hover:bg-slate-50 disabled:opacity-30 transition">Onceki</button>
                <button disabled={pagination.page >= pagination.pages} onClick={() => fetchItems(pagination.page + 1)}
                  className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] hover:bg-slate-50 disabled:opacity-30 transition">Sonraki</button>
              </div>
            </div>
          )}
        </>
      )}

      {canDelete && (
        <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())}
          onBulkDelete={handleBulkDelete} onBulkUpdate={handleBulkUpdate} onBulkMove={handleBulkMove}
          sites={sites} currentSiteId={siteId!} />
      )}
    </PageTransition>
  );
}

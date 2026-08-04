import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Inbox, Filter, Plus, ChevronLeft, ChevronRight, ChevronDown, Trash2, ArrowRightLeft, Pencil } from 'lucide-react';
import api from '../services/api';
import type { InventoryItem, Pagination } from '../types';
import toast from 'react-hot-toast';
import PageTransition from '../components/ui/PageTransition';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import ExportMenu from '../components/ui/ExportMenu';

const STATUS_DOT: Record<string, string> = { active: 'bg-emerald-500', inactive: 'bg-red-400', maintenance: 'bg-amber-400', decommissioned: 'bg-slate-300' };
const STATUS_LABELS: Record<string, string> = { active: 'Aktif', inactive: 'Pasif', maintenance: 'Bakim', decommissioned: 'Devre Disi' };
const STATUS_OPTIONS = ['active', 'inactive', 'maintenance', 'decommissioned'];
const PER_PAGE_OPTIONS = [25, 50, 100];

export default function GlobalInventoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(50);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [vendorFilter, setVendorFilter] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  const initialLoad = useRef(true);
  const fetchItems = useCallback(async (page = 1) => {
    if (initialLoad.current) setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (vendorFilter) params.set('vendor', vendorFilter);
      const { data } = await api.get(`/inventory?${params}`);
      setItems(data.items);
      setPagination(data.pagination);
      setSelected(new Set());
    } catch { toast.error('Envanter yuklenemedi'); }
    finally { setLoading(false); initialLoad.current = false; }
  }, [debouncedSearch, perPage, statusFilter, vendorFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getSiteName = (site: InventoryItem['site']) => typeof site === 'object' && site !== null ? site.name : '—';
  const toggleSelect = (id: string) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); };
  const toggleAll = () => { selected.size === items.length ? setSelected(new Set()) : setSelected(new Set(items.map(i => i._id))); };

  const handleBulkAction = (action: string) => {
    toast(`Toplu ${action} islemi icin site bazli envanter sayfasini kullanin.`, { icon: 'ℹ️' });
  };

  const filters = [
    statusFilter && { label: `Durum: ${STATUS_LABELS[statusFilter]}`, key: 'status' },
    vendorFilter && { label: `Uretici: ${vendorFilter}`, key: 'vendor' },
  ].filter(Boolean) as { label: string; key: string }[];

  const removeFilter = (key: string) => {
    if (key === 'status') setStatusFilter(null);
    if (key === 'vendor') setVendorFilter(null);
  };

  const uniqueVendors = [...new Set(items.map(i => i.vendor).filter(Boolean))];
  const startIdx = (pagination.page - 1) * pagination.limit + 1;
  const endIdx = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <PageTransition>
      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ duration: 0.2 }}
            className="mb-4 flex items-center justify-between rounded-xl bg-slate-900 px-5 py-3 text-white shadow-lg">
            <span className="text-[13px] font-medium">{selected.size} kayit secildi</span>
            <div className="flex items-center gap-2">
              <button onClick={() => handleBulkAction('tasima')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium bg-white/10 hover:bg-white/20 transition">
                <ArrowRightLeft size={13} /> Tasi
              </button>
              <button onClick={() => handleBulkAction('guncelleme')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium bg-white/10 hover:bg-white/20 transition">
                <Pencil size={13} /> Guncelle
              </button>
              <button onClick={() => handleBulkAction('silme')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium bg-red-500/80 hover:bg-red-500 transition">
                <Trash2 size={13} /> Sil
              </button>
              <button onClick={() => setSelected(new Set())}
                className="ml-1 flex items-center justify-center h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 transition">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-slate-900">Envanter</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">{pagination.total.toLocaleString()} kayit</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input className="h-[38px] w-[220px] rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-[#74BCC8] focus:ring-2 focus:ring-[#74BCC8]/15"
                placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"><X size={14} /></button>}
            </div>

            {/* Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button onClick={() => setFilterOpen(!filterOpen)}
                className={`flex items-center gap-1.5 h-[38px] px-3 rounded-lg border text-[13px] transition ${filters.length > 0 ? 'border-[#74BCC8]/40 text-[#4FAFC0] bg-[rgba(116,188,200,0.04)]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <Filter size={14} /> Filtre {filters.length > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#74BCC8' }}>{filters.length}</span>}
                <ChevronDown size={12} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {filterOpen && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 z-30 w-52 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 overflow-hidden">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">Durum</p>
                    {STATUS_OPTIONS.map(s => (
                      <button key={s} onClick={() => { setStatusFilter(statusFilter === s ? null : s); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition hover:bg-slate-50 ${statusFilter === s ? 'font-medium' : 'text-slate-600'}`}
                        style={statusFilter === s ? { color: '#4FAFC0' } : undefined}>
                        <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[s]}`} />
                        {STATUS_LABELS[s]}
                        {statusFilter === s && <span className="ml-auto text-[#74BCC8] text-[14px]">&#10003;</span>}
                      </button>
                    ))}
                    {uniqueVendors.length > 0 && (
                      <>
                        <div className="my-1 border-t border-slate-100" />
                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">Uretici</p>
                        {uniqueVendors.slice(0, 6).map(v => (
                          <button key={v} onClick={() => { setVendorFilter(vendorFilter === v ? null : v); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition hover:bg-slate-50 ${vendorFilter === v ? 'font-medium' : 'text-slate-600'}`}
                            style={vendorFilter === v ? { color: '#4FAFC0' } : undefined}>
                            {v}
                            {vendorFilter === v && <span className="ml-auto text-[#74BCC8] text-[14px]">&#10003;</span>}
                          </button>
                        ))}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ExportMenu items={items} filename="tum-envanter" />

            <button onClick={() => navigate('/projects')}
              className="flex items-center gap-1.5 h-[38px] px-4 rounded-lg text-[13px] font-medium text-white transition hover:-translate-y-[0.5px] hover:shadow-md"
              style={{ backgroundColor: '#74BCC8' }}>
              <Plus size={15} /> Yeni Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <AnimatePresence>
        {filters.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-center gap-2 flex-wrap">
            {filters.map(f => (
              <span key={f.key} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium border"
                style={{ backgroundColor: 'rgba(116,188,200,0.06)', borderColor: 'rgba(116,188,200,0.25)', color: '#4FAFC0' }}>
                {f.label}
                <button onClick={() => removeFilter(f.key)} className="hover:text-red-400 transition"><X size={12} /></button>
              </span>
            ))}
            <button onClick={() => { setStatusFilter(null); setVendorFilter(null); }} className="text-[12px] text-slate-400 hover:text-slate-600 transition">Temizle</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {loading ? <TableSkeleton rows={10} /> : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" checked={items.length > 0 && selected.size === items.length} onChange={toggleAll}
                      className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer accent-[#74BCC8]" />
                  </th>
                  {['Hostname', 'IP Adresi', 'Vendor', 'Model', 'Durum', 'Site', 'Raf', 'Garanti'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center">
                      <Inbox size={36} className="mx-auto mb-3 text-slate-200" />
                      <p className="text-[14px] text-slate-400 font-medium">{search || statusFilter ? 'Sonuc bulunamadi' : 'Henuz kayit yok'}</p>
                      <p className="text-[12px] text-slate-300 mt-1">Filtreleri degistirmeyi deneyin veya yeni envanter ekleyin.</p>
                    </td>
                  </tr>
                ) : items.map((item) => {
                  const isSelected = selected.has(item._id);
                  const warrantyStr = item.warrantyDate ? new Date(item.warrantyDate).toLocaleDateString('tr-TR') : '—';
                  const isExpired = item.warrantyDate ? new Date(item.warrantyDate) < new Date() : false;
                  return (
                    <tr key={item._id}
                      className={`border-b border-slate-50 transition-colors duration-100 ${isSelected ? 'bg-[rgba(116,188,200,0.04)]' : 'hover:bg-slate-50/60'}`}>
                      <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item._id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer accent-[#74BCC8]" />
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800 cursor-pointer hover:text-[#4FAFC0] transition-colors"
                        onClick={() => {
                          const s = typeof item.site === 'object' && item.site ? item.site : null;
                          if (s) toast('Detay icin site bazli envanter sayfasini kullanin', { icon: 'i' });
                        }}>
                        {item.name}
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] text-slate-400">{item.ipAddress || '—'}</td>
                      <td className="px-3 py-3 text-slate-600">{item.vendor || '—'}</td>
                      <td className="px-3 py-3 text-slate-500">{item.model || '—'}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[item.status] || 'bg-slate-300'}`} />
                          <span className="text-slate-600">{STATUS_LABELS[item.status] || item.status}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500">{getSiteName(item.site)}</td>
                      <td className="px-3 py-3 text-slate-400">{item.rack || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[12px] ${isExpired ? 'text-red-500 font-medium' : 'text-slate-400'}`}>{warrantyStr}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[13px] text-slate-400">
          <span>{startIdx}-{endIdx} / {pagination.total.toLocaleString()} kayit</span>
          <div className="flex items-center gap-1">
            <button disabled={pagination.page <= 1} onClick={() => fetchItems(pagination.page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition">
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              let p: number;
              if (pagination.pages <= 5) p = i + 1;
              else if (pagination.page <= 3) p = i + 1;
              else if (pagination.page >= pagination.pages - 2) p = pagination.pages - 4 + i;
              else p = pagination.page - 2 + i;
              return (
                <button key={p} onClick={() => fetchItems(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-medium transition ${pagination.page === p ? 'text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  style={pagination.page === p ? { backgroundColor: '#74BCC8' } : undefined}>
                  {p}
                </button>
              );
            })}
            <button disabled={pagination.page >= pagination.pages} onClick={() => fetchItems(pagination.page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition">
              <ChevronRight size={15} />
            </button>
          </div>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}
            className="h-8 rounded-lg border border-slate-200 px-2 text-[12px] text-slate-500 outline-none cursor-pointer focus:border-[#74BCC8]">
            {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n} / sayfa</option>)}
          </select>
        </div>
      )}
    </PageTransition>
  );
}

import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Trash2, ArrowLeft, Package, Search, X } from 'lucide-react';
import api from '../services/api';
import type { Site } from '../types';
import toast from 'react-hot-toast';
import PageTransition from '../components/ui/PageTransition';
import Modal from '../components/ui/Modal';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';

const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function SitesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManage = hasRole(['admin', 'project_manager', 'engineer']);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<Site[]>(`/projects/${projectId}/sites`)
      .then(({ data }) => setSites(data))
      .catch(() => toast.error('Siteler yuklenemedi'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post<Site>(`/projects/${projectId}/sites`, { name: name.trim(), code: code.trim() });
      setSites((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setName(''); setCode(''); setShowModal(false);
      toast.success('Site olusturuldu');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Site olusturulamadi'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu siteyi ve tum envanter kayitlarini silmek istediginize emin misiniz?')) return;
    try { await api.delete(`/projects/${projectId}/sites/${id}`); setSites((prev) => prev.filter((s) => s._id !== id)); toast.success('Site silindi'); }
    catch { toast.error('Site silinemedi'); }
  };

  const totalItems = sites.reduce((a, s) => a + s.itemCount, 0);
  const filtered = search ? sites.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())) : sites;

  return (
    <PageTransition>
      {/* Back */}
      <div className="mb-4">
        <Link to="/projects" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
          <ArrowLeft size={13} /> Projeler
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-slate-900">Siteler</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">{sites.length} site · {totalItems} envanter</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input className="h-[38px] w-[180px] rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-[#74BCC8] focus:ring-2 focus:ring-[#74BCC8]/15"
                placeholder="Site ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"><X size={14} /></button>}
            </div>
            {canManage && (
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 h-[38px] px-4 rounded-lg text-[13px] font-medium text-white transition hover:-translate-y-[0.5px] hover:shadow-md"
                style={{ backgroundColor: '#74BCC8' }}>
                <Plus size={15} /> Yeni Site
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Yeni Site Olustur">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Site Adi</label>
            <input className="block w-full h-[44px] rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-[#74BCC8] focus:ring-2 focus:ring-[#74BCC8]/15"
              placeholder="Ankara" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Kod (2-5 karakter)</label>
            <input className="block w-full h-[44px] rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-[#74BCC8] focus:ring-2 focus:ring-[#74BCC8]/15"
              placeholder="ANK" maxLength={5} value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={submitting} className="flex-1 h-[44px] rounded-xl text-white text-[14px] font-medium transition disabled:opacity-60" style={{ backgroundColor: '#74BCC8' }}>
              {submitting ? 'Olusturuluyor...' : 'Olustur'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="h-[44px] px-5 rounded-xl border border-slate-200 text-[14px] text-slate-500 hover:bg-slate-50 transition">Iptal</button>
          </div>
        </form>
      </Modal>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4" style={{ backgroundColor: 'rgba(116,188,200,0.1)' }}>
            <MapPin size={28} style={{ color: '#74BCC8' }} strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-medium text-slate-600 mb-1">{search ? 'Sonuc bulunamadi' : 'Henuz site yok'}</p>
          <p className="text-[13px] text-slate-400 mb-5">{search ? 'Farkli bir arama deneyin.' : 'Yeni bir site ekleyerek baslayin.'}</p>
          {!search && canManage && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 h-[38px] px-4 rounded-lg text-[13px] font-medium text-white" style={{ backgroundColor: '#74BCC8' }}>
              <Plus size={15} /> Yeni Site
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence>
            {filtered.map((s) => (
              <motion.div key={s._id} variants={fadeUp} layout
                onClick={() => navigate(`/projects/${projectId}/sites/${s._id}/inventory`)}
                className="group relative bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-[#74BCC8]/30">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(116,188,200,0.1)' }}>
                    <MapPin size={18} style={{ color: '#74BCC8' }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-slate-800 group-hover:text-[#4FAFC0] transition-colors">{s.name}</h3>
                    <span className="text-[11px] font-semibold tracking-wider" style={{ color: '#74BCC8' }}>{s.code}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center gap-1 text-[12px] text-slate-400">
                  <Package size={13} strokeWidth={1.5} /> {s.itemCount} envanter kaydi
                </div>
                {canManage && (
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(s._id); }}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-200 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </PageTransition>
  );
}

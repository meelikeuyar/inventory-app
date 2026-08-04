import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderKanban, Trash2, MapPin, Package, Calendar, Search, X } from 'lucide-react';
import api from '../services/api';
import type { Project } from '../types';
import toast from 'react-hot-toast';
import PageTransition from '../components/ui/PageTransition';
import Modal from '../components/ui/Modal';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';

const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManage = hasRole(['admin', 'project_manager']);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<Project[]>('/projects')
      .then(({ data }) => setProjects(data))
      .catch(() => toast.error('Projeler yuklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post<Project>('/projects', { name: name.trim(), description: description.trim() });
      setProjects((prev) => [data, ...prev]);
      setName(''); setDescription(''); setShowModal(false);
      toast.success('Proje olusturuldu');
    } catch { toast.error('Proje olusturulamadi'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu projeyi ve tum verilerini silmek istediginize emin misiniz?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast.success('Proje silindi');
    } catch { toast.error('Proje silinemedi'); }
  };

  const totalItems = projects.reduce((a, p) => a + p.itemCount, 0);
  const totalSites = projects.reduce((a, p) => a + p.siteCount, 0);
  const filtered = search ? projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : projects;

  return (
    <PageTransition>
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-slate-900">Projeler</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">{projects.length} proje · {totalSites} site · {totalItems} envanter</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input className="h-[38px] w-[180px] rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-[#74BCC8] focus:ring-2 focus:ring-[#74BCC8]/15"
                placeholder="Proje ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"><X size={14} /></button>}
            </div>
            {canManage && (
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 h-[38px] px-4 rounded-lg text-[13px] font-medium text-white transition hover:-translate-y-[0.5px] hover:shadow-md"
                style={{ backgroundColor: '#74BCC8' }}>
                <Plus size={15} /> Yeni Proje
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Yeni Proje Olustur">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Proje Adi</label>
            <input className="block w-full h-[44px] rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-[#74BCC8] focus:ring-2 focus:ring-[#74BCC8]/15"
              placeholder="Proje adi" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Aciklama</label>
            <input className="block w-full h-[44px] rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-[#74BCC8] focus:ring-2 focus:ring-[#74BCC8]/15"
              placeholder="Opsiyonel" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={submitting}
              className="flex-1 h-[44px] rounded-xl text-white text-[14px] font-medium transition disabled:opacity-60"
              style={{ backgroundColor: '#74BCC8' }}>
              {submitting ? 'Olusturuluyor...' : 'Olustur'}
            </button>
            <button type="button" onClick={() => setShowModal(false)}
              className="h-[44px] px-5 rounded-xl border border-slate-200 text-[14px] text-slate-500 hover:bg-slate-50 transition">
              Iptal
            </button>
          </div>
        </form>
      </Modal>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4" style={{ backgroundColor: 'rgba(116,188,200,0.1)' }}>
            <FolderKanban size={28} style={{ color: '#74BCC8' }} strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-medium text-slate-600 mb-1">{search ? 'Sonuc bulunamadi' : 'Henuz proje yok'}</p>
          <p className="text-[13px] text-slate-400 mb-5">{search ? 'Farkli bir arama deneyin.' : 'Yeni bir proje olusturarak baslayin.'}</p>
          {!search && canManage && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 h-[38px] px-4 rounded-lg text-[13px] font-medium text-white"
              style={{ backgroundColor: '#74BCC8' }}>
              <Plus size={15} /> Yeni Proje
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((p) => (
              <motion.div key={p._id} variants={fadeUp} layout
                onClick={() => navigate(`/projects/${p._id}/sites`)}
                className="group relative bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-[#74BCC8]/30">

                {/* Icon */}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(116,188,200,0.1)' }}>
                  <FolderKanban size={20} style={{ color: '#74BCC8' }} strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 className="text-[15px] font-semibold text-slate-800 group-hover:text-[#4FAFC0] transition-colors">{p.name}</h3>
                {p.description && <p className="mt-1 line-clamp-2 text-[12px] text-slate-400 leading-relaxed">{p.description}</p>}

                {/* Stats */}
                <div className="mt-4 flex items-center gap-4 text-[12px] text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={13} strokeWidth={1.5} /> {p.siteCount} site</span>
                  <span className="flex items-center gap-1"><Package size={13} strokeWidth={1.5} /> {p.itemCount} kayit</span>
                </div>

                {/* Date */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-300">
                  <Calendar size={11} strokeWidth={1.5} />
                  {new Date(p.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                {/* Delete */}
                {canManage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}
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

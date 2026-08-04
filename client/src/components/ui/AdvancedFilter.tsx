import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';

export interface FilterValues {
  vendor: string; status: string; os: string; rack: string;
  warrantyBefore: string; warrantyAfter: string;
}

const EMPTY: FilterValues = { vendor: '', status: '', os: '', rack: '', warrantyBefore: '', warrantyAfter: '' };

interface Props {
  onApply: (filters: FilterValues) => void;
  vendors: string[];
  osList: string[];
  racks: string[];
}

export default function AdvancedFilter({ onApply, vendors, osList, racks }: Props) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(EMPTY);
  const activeCount = Object.values(filters).filter(Boolean).length;

  const apply = () => { onApply(filters); setOpen(false); };
  const clear = () => { setFilters(EMPTY); onApply(EMPTY); setOpen(false); };
  const set = (k: keyof FilterValues, v: string) => setFilters(p => ({ ...p, [k]: v }));

  return (
    <>
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition
          ${activeCount > 0 ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
        <SlidersHorizontal size={14}/>
        Filtreler
        {activeCount > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white">{activeCount}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setOpen(false)} className="fixed inset-0 z-40"/>
            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
              className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-gray-900">Gelişmiş Filtreler</h3>
                <button onClick={()=>setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
              </div>
              <div className="space-y-3">
                <div><label className="mb-1 block text-[11px] font-medium text-gray-500">Üretici</label>
                  <select className="input-base text-[12px]" value={filters.vendor} onChange={e=>set('vendor',e.target.value)}>
                    <option value="">Tümü</option>{vendors.map(v=><option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div><label className="mb-1 block text-[11px] font-medium text-gray-500">Durum</label>
                  <select className="input-base text-[12px]" value={filters.status} onChange={e=>set('status',e.target.value)}>
                    <option value="">Tümü</option><option value="active">Aktif</option><option value="inactive">Pasif</option><option value="maintenance">Bakım</option><option value="decommissioned">Devre Dışı</option>
                  </select>
                </div>
                <div><label className="mb-1 block text-[11px] font-medium text-gray-500">İşletim Sistemi</label>
                  <select className="input-base text-[12px]" value={filters.os} onChange={e=>set('os',e.target.value)}>
                    <option value="">Tümü</option>{osList.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div><label className="mb-1 block text-[11px] font-medium text-gray-500">Raf</label>
                  <select className="input-base text-[12px]" value={filters.rack} onChange={e=>set('rack',e.target.value)}>
                    <option value="">Tümü</option>{racks.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="mb-1 block text-[11px] font-medium text-gray-500">Garanti (Sonra)</label><input type="date" className="input-base text-[12px]" value={filters.warrantyAfter} onChange={e=>set('warrantyAfter',e.target.value)}/></div>
                  <div><label className="mb-1 block text-[11px] font-medium text-gray-500">Garanti (Önce)</label><input type="date" className="input-base text-[12px]" value={filters.warrantyBefore} onChange={e=>set('warrantyBefore',e.target.value)}/></div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={apply} className="btn-primary flex-1 text-[12px]">Uygula</button>
                <button onClick={clear} className="btn-secondary text-[12px]">Temizle</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

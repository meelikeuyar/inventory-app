import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Server } from 'lucide-react';
import api from '../../services/api';
import type { InventoryItem } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (debouncedQuery.length < 2) { setResults([]); return; } setLoading(true); api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`).then(({data})=>setResults(data)).catch(()=>{}).finally(()=>setLoading(false)); }, [debouncedQuery]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.ctrlKey||e.metaKey)&&e.key==='k') { e.preventDefault(); setOpen(true); } if (e.key==='Escape') setOpen(false); }; window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h); }, []);
  useEffect(() => { if (open) setTimeout(()=>inputRef.current?.focus(), 100); }, [open]);
  return (
    <>
      <button onClick={()=>setOpen(true)} className="flex items-center gap-1.5 rounded border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-[12px] text-gray-400 transition hover:bg-gray-100">
        <Search size={13}/><span className="hidden sm:inline">Ara...</span><kbd className="hidden sm:inline rounded bg-gray-200 px-1 text-[10px] text-gray-500">Ctrl+K</kbd>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setOpen(false)} className="fixed inset-0 z-50 bg-black/25"/>
            <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} className="fixed inset-x-4 top-[15%] z-50 mx-auto max-w-lg">
              <div className="rounded-lg border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-gray-100 px-3.5">
                  <Search size={15} className="text-gray-400"/>
                  <input ref={inputRef} value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Hostname, IP, seri no, uretici..." className="flex-1 bg-transparent py-3 text-sm text-gray-800 outline-none placeholder-gray-400"/>
                  <button onClick={()=>setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={15}/></button>
                </div>
                <div className="max-h-72 overflow-y-auto p-1.5">
                  {loading && <p className="py-4 text-center text-xs text-gray-400">Araniyor...</p>}
                  {!loading && query.length >= 2 && results.length === 0 && <p className="py-4 text-center text-xs text-gray-400">Sonuc bulunamadi</p>}
                  {results.map((item)=>(
                    <button key={item._id} onClick={()=>setOpen(false)} className="flex w-full items-center gap-2.5 rounded px-3 py-2 text-left transition hover:bg-gray-50">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-gray-100 text-gray-500"><Server size={13}/></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-gray-800">{item.name}</p>
                        <p className="truncate text-[11px] text-gray-400">{[item.ipAddress,item.vendor,item.serialNumber,item.rack].filter(Boolean).join(' - ')}</p>
                      </div>
                      {typeof item.site === 'object' && item.site && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{(item.site as any).code}</span>}
                    </button>
                  ))}
                </div>
                {query.length < 2 && <p className="px-3.5 pb-2.5 text-[11px] text-gray-400">En az 2 karakter yazin</p>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

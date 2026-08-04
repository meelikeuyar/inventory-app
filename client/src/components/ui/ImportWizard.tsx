import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Check, AlertTriangle, X, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from './Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  apiPath: string;
  onSuccess: () => void;
}

type Step = 'upload' | 'preview' | 'mapping' | 'validation' | 'result';

const SYSTEM_FIELDS = ['name', 'ipAddress', 'serialNumber', 'vendor', 'model', 'cpu', 'ram', 'storage', 'os', 'rack', 'cabinet', 'rackPosition', 'status'];
const FIELD_LABELS: Record<string, string> = { name: 'Cihaz Adı*', ipAddress: 'IP Adresi', serialNumber: 'Seri No', vendor: 'Üretici', model: 'Model', cpu: 'CPU', ram: 'RAM', storage: 'Depolama', os: 'OS', rack: 'Raf', cabinet: 'Kabin', rackPosition: 'Raf Pozisyonu', status: 'Durum' };

export default function ImportWizard({ open, onClose, apiPath, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Array<{ row: number; field: string; msg: string }>>([]);
  const [validItems, setValidItems] = useState<Record<string, string>[]>([]);
  const [duplicates, setDuplicates] = useState<number>(0);
  const [result, setResult] = useState<{ total: number; success: number; failed: number; duplicates: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setStep('upload'); setRawData([]); setHeaders([]); setMapping({}); setErrors([]); setValidItems([]); setDuplicates(0); setResult(null); };
  const close = () => { reset(); onClose(); };

  // Step 1: Upload
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]!]!;
      const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
      if (data.length < 2) { toast.error('Dosyada yeterli veri yok'); return; }
      const hdrs = (data[0] || []).map(h => String(h).trim());
      setHeaders(hdrs);
      setRawData(data.slice(1).filter(r => r.some(c => c)));

      // Auto-map
      const autoMap: Record<string, string> = {};
      for (const sf of SYSTEM_FIELDS) {
        const match = hdrs.find(h => h.toLowerCase().replace(/[^a-z]/g, '') === sf.toLowerCase().replace(/[^a-z]/g, ''));
        if (match) autoMap[sf] = match;
        else {
          const partial = hdrs.find(h => h.toLowerCase().includes(sf.toLowerCase().slice(0, 4)));
          if (partial) autoMap[sf] = partial;
        }
      }
      setMapping(autoMap);
      setStep('preview');
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Step 3: Validate
  const validate = () => {
    const errs: typeof errors = [];
    const items: Record<string, string>[] = [];
    const seen = new Set<string>();
    let dupes = 0;

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i]!;
      const item: Record<string, string> = {};
      for (const [sysField, xlsCol] of Object.entries(mapping)) {
        const colIdx = headers.indexOf(xlsCol);
        item[sysField] = colIdx >= 0 ? String(row[colIdx] || '').trim() : '';
      }
      if (!item.name) { errs.push({ row: i + 2, field: 'name', msg: 'Cihaz adı boş' }); continue; }
      const key = `${item.name}-${item.serialNumber}`;
      if (seen.has(key)) { dupes++; continue; }
      seen.add(key);
      items.push(item);
    }
    setErrors(errs);
    setValidItems(items);
    setDuplicates(dupes);
    setStep('validation');
  };

  // Step 5: Import
  const doImport = async () => {
    setImporting(true);
    try {
      const { data } = await api.post(`${apiPath}/bulk`, { items: validItems });
      setResult({ total: rawData.length, success: data.count || validItems.length, failed: errors.length, duplicates });
      setStep('result');
      onSuccess();
    } catch { toast.error('Import başarısız'); }
    finally { setImporting(false); }
  };

  const STEPS: Array<{ key: Step; label: string; num: number }> = [
    { key: 'upload', label: 'Dosya', num: 1 }, { key: 'preview', label: 'Önizleme', num: 2 },
    { key: 'mapping', label: 'Eşleştirme', num: 3 }, { key: 'validation', label: 'Doğrulama', num: 4 },
    { key: 'result', label: 'Sonuç', num: 5 },
  ];
  const stepIdx = STEPS.findIndex(s => s.key === step);

  return (
    <Modal open={open} onClose={close} title="Excel Import Wizard">
      {/* Step indicators */}
      <div className="mb-5 flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${i <= stepIdx ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</div>
            <span className={`text-[11px] font-medium ${i <= stepIdx ? 'text-brand-700' : 'text-gray-400'}`}>{s.label}</span>
            {i < STEPS.length - 1 && <ChevronRight size={12} className="mx-1 text-gray-300" />}
          </div>
        ))}
      </div>

      <div className="min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

            {step === 'upload' && (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12">
                <Upload size={32} className="mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">Excel dosyası seçin</p>
                <p className="mt-1 text-xs text-gray-400">.xlsx veya .xls</p>
                <label className="btn-primary mt-4 cursor-pointer">
                  Dosya Seç
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
                </label>
              </div>
            )}

            {step === 'preview' && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-emerald-600" />
                  <span className="text-[13px] font-medium text-gray-800">{rawData.length} satır, {headers.length} kolon</span>
                </div>
                <div className="max-h-48 overflow-auto rounded-lg border border-gray-100">
                  <table className="w-full text-[11px]">
                    <thead><tr className="bg-gray-50">{headers.map(h => <th key={h} className="px-2 py-1.5 text-left font-semibold text-gray-500">{h}</th>)}</tr></thead>
                    <tbody>{rawData.slice(0, 5).map((r, i) => <tr key={i} className="border-t border-gray-50">{headers.map((_, j) => <td key={j} className="px-2 py-1 text-gray-600">{r[j] || ''}</td>)}</tr>)}</tbody>
                  </table>
                </div>
                {rawData.length > 5 && <p className="mt-1 text-[10px] text-gray-400">+{rawData.length - 5} satır daha</p>}
                <div className="mt-4 flex gap-2"><button onClick={() => setStep('mapping')} className="btn-primary flex-1">Devam</button><button onClick={close} className="btn-secondary">İptal</button></div>
              </div>
            )}

            {step === 'mapping' && (
              <div>
                <p className="mb-3 text-[12px] text-gray-500">Excel kolonlarını sistem alanlarıyla eşleştirin:</p>
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {SYSTEM_FIELDS.map(sf => (
                    <div key={sf} className="flex items-center gap-2">
                      <span className="w-28 text-[12px] font-medium text-gray-700">{FIELD_LABELS[sf]}</span>
                      <select className="input-base flex-1 text-[12px]" value={mapping[sf] || ''} onChange={e => setMapping(p => ({ ...p, [sf]: e.target.value }))}>
                        <option value="">— Seçin —</option>{headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2"><button onClick={validate} className="btn-primary flex-1" disabled={!mapping.name}>Doğrula</button><button onClick={() => setStep('preview')} className="btn-secondary">Geri</button></div>
              </div>
            )}

            {step === 'validation' && (
              <div>
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-emerald-50 p-3 text-center"><p className="text-lg font-bold text-emerald-700">{validItems.length}</p><p className="text-[10px] text-emerald-600">Geçerli</p></div>
                  <div className="rounded-lg bg-red-50 p-3 text-center"><p className="text-lg font-bold text-red-700">{errors.length}</p><p className="text-[10px] text-red-600">Hatalı</p></div>
                  <div className="rounded-lg bg-amber-50 p-3 text-center"><p className="text-lg font-bold text-amber-700">{duplicates}</p><p className="text-[10px] text-amber-600">Tekrar</p></div>
                </div>
                {errors.length > 0 && (
                  <div className="mb-3 max-h-32 overflow-y-auto rounded-lg border border-red-100 bg-red-50/50 p-2">
                    {errors.slice(0, 10).map((e, i) => <p key={i} className="text-[11px] text-red-600"><AlertTriangle size={10} className="mr-1 inline" />Satır {e.row}: {e.msg}</p>)}
                    {errors.length > 10 && <p className="text-[10px] text-red-400">+{errors.length - 10} hata daha</p>}
                  </div>
                )}
                <div className="flex gap-2"><button onClick={doImport} disabled={importing || validItems.length === 0} className="btn-primary flex-1">{importing ? 'İçe aktarılıyor...' : `${validItems.length} Kaydı İçe Aktar`}</button><button onClick={() => setStep('mapping')} className="btn-secondary">Geri</button></div>
              </div>
            )}

            {step === 'result' && result && (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50"><Check size={28} className="text-emerald-600" /></div>
                <h3 className="text-lg font-semibold text-gray-900">Import Tamamlandı</h3>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  <div className="rounded-lg bg-gray-50 p-2"><p className="text-sm font-bold text-gray-900">{result.total}</p><p className="text-[10px] text-gray-500">Toplam</p></div>
                  <div className="rounded-lg bg-emerald-50 p-2"><p className="text-sm font-bold text-emerald-700">{result.success}</p><p className="text-[10px] text-emerald-600">Başarılı</p></div>
                  <div className="rounded-lg bg-red-50 p-2"><p className="text-sm font-bold text-red-700">{result.failed}</p><p className="text-[10px] text-red-600">Başarısız</p></div>
                  <div className="rounded-lg bg-amber-50 p-2"><p className="text-sm font-bold text-amber-700">{result.duplicates}</p><p className="text-[10px] text-amber-600">Tekrar</p></div>
                </div>
                <button onClick={close} className="btn-primary mt-5 w-full">Kapat</button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  );
}

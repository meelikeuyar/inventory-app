import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { InventoryItem } from '../../types';

interface Props { items: InventoryItem[]; filename?: string; }

export default function ExportMenu({ items, filename = 'envanter' }: Props) {
  const [open, setOpen] = useState(false);

  const prepareData = () => items.map(i => ({
    Hostname: i.name, IP: i.ipAddress, 'Seri No': i.serialNumber, Üretici: i.vendor,
    Model: i.model, CPU: i.cpu, RAM: i.ram, Depolama: i.storage, OS: i.os,
    Raf: i.rack, Kabin: i.cabinet, 'Raf Poz.': i.rackPosition, Durum: i.status,
    'Garanti Tarihi': i.warrantyDate ? new Date(i.warrantyDate).toLocaleDateString('tr-TR') : '',
    Notlar: i.notes,
  }));

  const exportXlsx = () => {
    const ws = XLSX.utils.json_to_sheet(prepareData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Envanter');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    setOpen(false);
  };

  const exportCsv = () => {
    const ws = XLSX.utils.json_to_sheet(prepareData());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportPdf = () => {
    // Simple printable HTML table -> PDF
    const data = prepareData();
    const cols = Object.keys(data[0] || {});
    const html = `<!DOCTYPE html><html><head><title>${filename}</title><style>body{font-family:Arial,sans-serif;font-size:10px;margin:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:4px 6px;text-align:left}th{background:#f0f7ff;font-weight:bold}tr:nth-child(even){background:#f9fafb}h1{font-size:16px;color:#003d6e}</style></head><body><h1>Envanter Raporu</h1><p>Toplam: ${data.length} kayıt — ${new Date().toLocaleDateString('tr-TR')}</p><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${data.map(r=>`<tr>${cols.map(c=>`<td>${(r as any)[c]||''}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 transition hover:bg-gray-50">
        <Download size={14}/> Dışa Aktar
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}/>
            <motion.div initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}}
              className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button onClick={exportXlsx} className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><FileSpreadsheet size={14} className="text-emerald-600"/> Excel (.xlsx)</button>
              <button onClick={exportCsv} className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><FileText size={14} className="text-brand-600"/> CSV (.csv)</button>
              <button onClick={exportPdf} className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><File size={14} className="text-red-600"/> PDF (Yazdır)</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

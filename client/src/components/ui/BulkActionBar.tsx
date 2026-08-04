import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowRightLeft, RefreshCw, X } from 'lucide-react';
import Modal from './Modal';
import type { Site } from '../../types';

interface Props {
  selectedCount: number;
  onClear: () => void;
  onBulkDelete: () => void;
  onBulkUpdate: (updates: Record<string, string>) => void;
  onBulkMove: (targetSiteId: string) => void;
  sites: Site[];
  currentSiteId: string;
}

export default function BulkActionBar({
  selectedCount, onClear, onBulkDelete, onBulkUpdate, onBulkMove, sites, currentSiteId,
}: Props) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [updateField, setUpdateField] = useState('status');
  const [updateValue, setUpdateValue] = useState('');
  const [targetSiteId, setTargetSiteId] = useState('');

  const otherSites = sites.filter((s) => s._id !== currentSiteId);

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-xl">
              <div className="flex h-7 items-center rounded-lg bg-brand-50 px-2.5 text-[12px] font-semibold text-brand-700">
                {selectedCount} seçili
              </div>

              <div className="mx-1 h-5 w-px bg-gray-200" />

              <button
                onClick={() => setShowUpdateModal(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-gray-600 transition hover:bg-gray-50"
              >
                <RefreshCw size={13} /> Toplu Güncelle
              </button>

              {otherSites.length > 0 && (
                <button
                  onClick={() => setShowMoveModal(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  <ArrowRightLeft size={13} /> Taşı
                </button>
              )}

              <button
                onClick={onBulkDelete}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={13} /> Sil
              </button>

              <div className="mx-1 h-5 w-px bg-gray-200" />

              <button
                onClick={onClear}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Update Modal */}
      <Modal open={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="Toplu Güncelle">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Alan</label>
            <select className="input-base" value={updateField} onChange={(e) => setUpdateField(e.target.value)}>
              <option value="status">Durum</option>
              <option value="vendor">Üretici</option>
              <option value="os">İşletim Sistemi</option>
              <option value="rack">Raf</option>
              <option value="warrantyDate">Garanti Tarihi</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Yeni Değer</label>
            {updateField === 'status' ? (
              <select className="input-base" value={updateValue} onChange={(e) => setUpdateValue(e.target.value)}>
                <option value="">Seçin</option>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
                <option value="maintenance">Bakım</option>
                <option value="decommissioned">Devre Dışı</option>
              </select>
            ) : updateField === 'warrantyDate' ? (
              <input type="date" className="input-base" value={updateValue} onChange={(e) => setUpdateValue(e.target.value)} />
            ) : (
              <input className="input-base" placeholder="Yeni değer" value={updateValue} onChange={(e) => setUpdateValue(e.target.value)} />
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              className="btn-primary flex-1"
              disabled={!updateValue}
              onClick={() => { onBulkUpdate({ [updateField]: updateValue }); setShowUpdateModal(false); setUpdateValue(''); }}
            >
              {selectedCount} Kaydı Güncelle
            </button>
            <button className="btn-secondary" onClick={() => setShowUpdateModal(false)}>İptal</button>
          </div>
        </div>
      </Modal>

      {/* Bulk Move Modal */}
      <Modal open={showMoveModal} onClose={() => setShowMoveModal(false)} title="Siteye Taşı">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Hedef Site</label>
            <select className="input-base" value={targetSiteId} onChange={(e) => setTargetSiteId(e.target.value)}>
              <option value="">Seçin</option>
              {otherSites.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              className="btn-primary flex-1"
              disabled={!targetSiteId}
              onClick={() => { onBulkMove(targetSiteId); setShowMoveModal(false); setTargetSiteId(''); }}
            >
              {selectedCount} Kaydı Taşı
            </button>
            <button className="btn-secondary" onClick={() => setShowMoveModal(false)}>İptal</button>
          </div>
        </div>
      </Modal>
    </>
  );
}

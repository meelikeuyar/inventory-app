import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, HardDrive, Wifi, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import type { InventoryItem } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
  maintenance: 'bg-amber-500',
  decommissioned: 'bg-red-500',
};

const STATUS_BG: Record<string, string> = {
  active: 'bg-emerald-50 border-emerald-200',
  inactive: 'bg-gray-50 border-gray-200',
  maintenance: 'bg-amber-50 border-amber-200',
  decommissioned: 'bg-red-50 border-red-200',
};

interface RackData {
  [rackName: string]: InventoryItem[];
}

interface Props {
  apiPath: string;
  onSelectItem?: (item: InventoryItem) => void;
}

export default function RackView({ apiPath, onSelectItem }: Props) {
  const [racks, setRacks] = useState<RackData>({});
  const [loading, setLoading] = useState(true);
  const [selectedRack, setSelectedRack] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    api.get(`${apiPath}/rack-view`)
      .then(({ data }) => {
        setRacks(data);
        const names = Object.keys(data);
        if (names.length > 0) setSelectedRack(names[0]!);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500" />
      </div>
    );
  }

  const rackNames = Object.keys(racks);

  if (rackNames.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
        <Server size={32} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">Raf ataması yapılmış cihaz bulunamadı</p>
        <p className="mt-1 text-xs text-gray-400">Cihazlara rack ve rackPosition bilgisi ekleyerek bu görünümü kullanabilirsiniz</p>
      </div>
    );
  }

  const currentItems = selectedRack ? (racks[selectedRack] || []) : [];
  const maxU = 42;

  // Build rack slots
  const slots: (InventoryItem | null)[] = Array(maxU).fill(null);
  for (const item of currentItems) {
    const pos = (item.rackPosition || 1) - 1;
    if (pos >= 0 && pos < maxU) {
      slots[pos] = item;
    }
  }

  return (
    <div className="flex gap-6">
      {/* Rack selector */}
      <div className="w-48 shrink-0 space-y-1">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Raflar ({rackNames.length})</p>
        {rackNames.map((name) => {
          const items = racks[name] || [];
          const active = selectedRack === name;
          return (
            <button
              key={name}
              onClick={() => setSelectedRack(name)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] transition
                ${active
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <HardDrive size={14} />
              <div className="min-w-0 flex-1">
                <p className="truncate">{name}</p>
                <p className="text-[11px] text-gray-400">{items.length} cihaz</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Rack visualization */}
      <div className="flex-1">
        {selectedRack && (
          <motion.div
            key={selectedRack}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-gray-900">
                {selectedRack}
                <span className="ml-2 text-[12px] font-normal text-gray-400">({currentItems.length} / {maxU}U)</span>
              </h3>
              <div className="flex items-center gap-3 text-[11px]">
                {Object.entries({ active: 'Aktif', inactive: 'Pasif', maintenance: 'Bakım', decommissioned: 'Devre Dışı' }).map(([key, label]) => (
                  <span key={key} className="flex items-center gap-1 text-gray-500">
                    <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[key]}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Rack frame */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              {/* U number header */}
              <div className="flex items-center gap-1 border-b border-gray-200 pb-2 mb-2">
                <div className="w-8 text-center text-[10px] font-bold text-gray-400">U</div>
                <div className="flex-1 text-[10px] font-bold text-gray-400">DEVICE</div>
                <div className="w-24 text-center text-[10px] font-bold text-gray-400">IP</div>
                <div className="w-16 text-center text-[10px] font-bold text-gray-400">STATUS</div>
              </div>

              <div className="space-y-0.5">
                {slots.map((item, idx) => {
                  const uNum = idx + 1;
                  if (item) {
                    const isHovered = hoveredItem === item._id;
                    return (
                      <motion.div
                        key={item._id}
                        onHoverStart={() => setHoveredItem(item._id)}
                        onHoverEnd={() => setHoveredItem(null)}
                        onClick={() => onSelectItem?.(item)}
                        whileHover={{ scale: 1.01 }}
                        className={`flex cursor-pointer items-center gap-1 rounded-lg border p-2 transition ${STATUS_BG[item.status] || STATUS_BG.active}`}
                      >
                        <div className="w-8 text-center text-[11px] font-mono font-bold text-gray-400">{uNum}</div>
                        <div className="flex flex-1 items-center gap-2">
                          <Server size={14} className="text-gray-500" />
                          <div>
                            <p className="text-[12px] font-medium text-gray-800">{item.name}</p>
                            <p className="text-[10px] text-gray-400">{item.vendor} {item.model}</p>
                          </div>
                        </div>
                        <div className="w-24 text-center">
                          <span className="font-mono text-[11px] text-gray-500">{item.ipAddress || '—'}</span>
                        </div>
                        <div className="flex w-16 justify-center">
                          <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[item.status] || STATUS_COLORS.active}`} />
                        </div>

                        {/* Tooltip */}
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
                          >
                            <p className="text-xs font-semibold text-gray-900">{item.name}</p>
                            <div className="mt-2 space-y-1 text-[11px] text-gray-500">
                              {item.cpu && <p>CPU: {item.cpu}</p>}
                              {item.ram && <p>RAM: {item.ram}</p>}
                              {item.storage && <p>Storage: {item.storage}</p>}
                              {item.os && <p>OS: {item.os}</p>}
                              {item.serialNumber && <p>S/N: {item.serialNumber}</p>}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  }

                  // Empty slot
                  return (
                    <div key={`empty-${idx}`} className="flex items-center gap-1 rounded-lg border border-transparent px-2 py-1.5">
                      <div className="w-8 text-center text-[10px] font-mono text-gray-300">{uNum}</div>
                      <div className="h-px flex-1 border-b border-dashed border-gray-200" />
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

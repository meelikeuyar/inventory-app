import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
interface Props { icon: LucideIcon; title: string; description: string; action?: { label: string; onClick: () => void }; }
export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg border border-dashed border-gray-300 py-14 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">
        <Icon size={20} className="text-gray-400" />
      </div>
      <p className="font-medium text-gray-700">{title}</p>
      <p className="mt-1 text-[13px] text-gray-400">{description}</p>
      {action && <button onClick={action.onClick} className="btn-primary mt-4">{action.label}</button>}
    </motion.div>
  );
}

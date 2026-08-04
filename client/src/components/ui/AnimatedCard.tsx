import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
interface Props { children: ReactNode; index?: number; className?: string; }
export default function AnimatedCard({ children, index = 0, className = '' }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -2, boxShadow: '0 8px 20px -4px rgba(0,0,0,0.08)' }}
      className={className}>{children}</motion.div>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100"><SearchX size={24} className="text-gray-400" /></div>
        <h1 className="text-3xl font-semibold text-gray-900">404</h1>
        <p className="mt-1.5 text-gray-400">Aradiginiz sayfa bulunamadi.</p>
        <Link to="/" className="btn-primary mt-5 inline-block">Dashboard'a Don</Link>
      </motion.div>
    </div>
  );
}

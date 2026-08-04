import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
const LABELS: Record<string, string> = { '': 'Dashboard', projects: 'Projeler', sites: 'Siteler', inventory: 'Envanter', users: 'Kullanicilar', activity: 'Aktivite', notifications: 'Bildirimler' };
export default function Breadcrumb() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return <span className="text-[13px] font-medium text-gray-800">Dashboard</span>;
  const crumbs: Array<{ label: string; path: string }> = [];
  let path = '';
  for (const part of parts) { path += `/${part}`; crumbs.push({ label: LABELS[part] || (part.length === 24 ? '...' : part), path }); }
  return (
    <nav className="flex items-center gap-1 text-[13px]">
      <Link to="/" className="text-gray-400 hover:text-gray-600 transition"><Home size={13} /></Link>
      {crumbs.map((c, i) => (
        <span key={c.path} className="flex items-center gap-1">
          <ChevronRight size={11} className="text-gray-300" />
          {i === crumbs.length - 1 ? <span className="font-medium text-gray-700">{c.label}</span> : <Link to={c.path} className="text-gray-400 hover:text-gray-600 transition">{c.label}</Link>}
        </span>
      ))}
    </nav>
  );
}

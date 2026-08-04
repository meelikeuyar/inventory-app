import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, FolderKanban, LogOut, Box, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import ThemeToggle from '../ui/ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount, clearNotifications } = useSocket();
  const location = useLocation();

  const links = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projeler', icon: FolderKanban },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 text-gray-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Box size={18} strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Inventory<span className="text-brand-600">Pro</span></span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map((link) => {
              const active = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link key={link.path} to={link.path}
                  className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition ${active ? 'text-brand-700' : 'text-gray-500 hover:text-gray-800'}`}>
                  {active && (
                    <motion.div layoutId="nav-indicator" className="absolute inset-0 rounded-lg bg-brand-50"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                  <Icon size={16} className="relative z-10" />
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <Link to="/notifications" onClick={clearNotifications} className="relative flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100 transition">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <ThemeToggle />
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-800">{user.fullName}</p>
                <p className="text-[11px] text-gray-400">{user.role}</p>
              </div>
            </div>
            <button onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700">
              <LogOut size={14} /> Çıkış
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

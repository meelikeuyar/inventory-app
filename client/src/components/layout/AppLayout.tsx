import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FolderKanban, Package, Users, Bell, ChevronLeft, LogOut, Menu, Activity, X, Building2, Wrench, TrendingUp } from 'lucide-react';
import Breadcrumb from '../ui/Breadcrumb';
import GlobalSearch from '../ui/GlobalSearch';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projeler', icon: FolderKanban },
  { path: '/inventory', label: 'Tum Envanter', icon: Package },
  { path: '/departments', label: 'Departmanlar', icon: Building2 },
  { path: '/users', label: 'Kullanici Yonetimi', icon: Users, roles: ['admin'] },
  { path: '/maintenance', label: 'Bakim Merkezi', icon: Wrench },
  { path: '/insights', label: 'Smart Insights', icon: TrendingUp },
  { path: '/activity', label: 'Aktivite', icon: Activity },
  { path: '/notifications', label: 'Bildirimler', icon: Bell },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator', project_manager: 'Proje Yoneticisi', engineer: 'Muhendis', viewer: 'Izleyici', department_manager: 'Departman Yoneticisi', technician: 'Teknisyen', auditor: 'Denetci'
};

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return (
    <span className="hidden lg:block text-[11px] text-slate-400 tabular-nums">
      {now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })} {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function AppLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#74BCC8]" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const filteredNav = NAV_ITEMS.filter((n) => !n.roles || n.roles.includes(user.role));
  const initials = getInitials(user.fullName);

  const sidebarContent = (
    <div className={`flex h-full flex-col bg-white border-r border-slate-200/80 transition-all duration-250 ease-in-out ${collapsed ? 'w-[68px]' : 'w-[260px]'}`}>
      {/* Logo */}
      <div className={`flex h-[60px] items-center shrink-0 ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
        {!collapsed ? (
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-[12px] font-bold" style={{ backgroundColor: '#74BCC8' }}>I</div>
            <span className="text-[16px] font-bold text-slate-800 tracking-tight">Iventra</span>
          </Link>
        ) : (
          <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-[12px] font-bold" style={{ backgroundColor: '#74BCC8' }}>I</Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
          <ChevronLeft size={14} className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150
                ${active
                  ? 'text-[#4FAFC0]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                ${collapsed ? 'justify-center px-0' : ''}`}
              style={active ? { backgroundColor: 'rgba(116,188,200,0.08)' } : undefined}
              title={collapsed ? item.label : undefined}>
              {active && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ backgroundColor: '#74BCC8' }} />
              )}
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={`border-t border-slate-100 p-3 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!collapsed ? (
          <div className="mb-2.5 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white" style={{ backgroundColor: '#74BCC8' }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-800">{user.fullName}</p>
              <span className="inline-block mt-0.5 text-[10px] font-medium rounded-full px-2 py-0.5" style={{ backgroundColor: 'rgba(116,188,200,0.1)', color: '#4FAFC0' }}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold text-white mb-1" style={{ backgroundColor: '#74BCC8' }}>
            {initials}
          </div>
        )}
        <button onClick={logout}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-slate-400 transition hover:bg-red-50 hover:text-red-500 ${collapsed ? 'w-full justify-center' : 'w-full'}`}>
          <LogOut size={16} />
          {!collapsed && <span>Cikis Yap</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" />
        )}
      </AnimatePresence>

      {/* Sidebar desktop */}
      <div className="hidden lg:block shrink-0">{sidebarContent}</div>

      {/* Sidebar mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 lg:hidden"
            style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.08)' }}>
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 z-10 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"><X size={16} /></button>
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-slate-600 lg:hidden transition"><Menu size={20} /></button>
            <Breadcrumb />
          </div>
          <div className="flex items-center gap-2.5">
            <LiveClock />
            <GlobalSearch />
            <Link to="/notifications" className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </Link>
            <div className="hidden sm:flex items-center gap-2.5 ml-1 pl-3 border-l border-slate-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: '#74BCC8' }}>
                {initials}
              </div>
              <div className="hidden lg:block">
                <p className="text-[12px] font-semibold text-slate-700 leading-tight">{user.fullName}</p>
                <p className="text-[10px] leading-tight" style={{ color: '#74BCC8' }}>{ROLE_LABELS[user.role] || user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-[1360px]">
            <AnimatePresence mode="wait"><Outlet /></AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

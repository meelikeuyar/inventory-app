import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, UserX, KeyRound } from 'lucide-react';
import api from '../services/api';
import type { UserAdmin } from '../types';
import toast from 'react-hot-toast';
import PageTransition from '../components/ui/PageTransition';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  project_manager: 'Proje Yöneticisi',
  engineer: 'Mühendis',
  viewer: 'İzleyici',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<UserAdmin[]>('/users')
      .then(({ data }) => setUsers(data))
      .catch(() => toast.error('Kullanıcılar yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (id: string, role: string) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      setUsers((p) => p.map((u) => (u._id === id ? { ...u, role } : u)));
      toast.success('Rol güncellendi');
    } catch {
      toast.error('Rol güncellenemedi');
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const { data } = await api.patch(`/users/${id}/toggle-active`);
      setUsers((p) => p.map((u) => (u._id === id ? { ...u, isActive: data.isActive } : u)));
      toast.success('Durum güncellendi');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const resetPw = async (id: string) => {
    const newPassword = prompt('Yeni şifre girin (en az 6 karakter):');
    if (!newPassword) return;
    if (newPassword.length < 6) { toast.error('Şifre en az 6 karakter olmalıdır'); return; }
    try {
      await api.post(`/users/${id}/reset-password`, { password: newPassword });
      toast.success('Şifre başarıyla sıfırlandı');
    } catch {
      toast.error('Şifre sıfırlanamadı');
    }
  };

  const getStatusClass = (isActive: boolean) => {
    if (isActive) return 'bg-emerald-50 text-emerald-700';
    return 'bg-red-50 text-red-600';
  };

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Kullanıcı Yönetimi</h1>
        <p className="mt-1 text-sm text-gray-500">{users.length} kullanıcı</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Kullanıcı', 'E-posta', 'Rol', 'Durum', 'Kayıt Tarihi', 'İşlemler'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <motion.tr
                key={u._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50 transition hover:bg-gray-50/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {u.fullName.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{u.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    className="rounded-lg border-0 bg-transparent text-[12px] font-medium focus:ring-0"
                  >
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClass(u.isActive)}`}>
                    {u.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleActive(u._id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                      title={u.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                    >
                      {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    <button
                      onClick={() => resetPw(u._id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                      title="Şifre Sıfırla"
                    >
                      <KeyRound size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageTransition>
  );
}
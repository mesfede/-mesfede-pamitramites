import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { subscribeToUsers, setUserRole, deleteUser, toggleUserStatus } from '../services/firestore';
import { UserPlus, Trash2, Shield, User as UserIcon, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, UserX, UserCheck, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import firebaseConfig from '../../firebase-applet-config.json';

// Secondary app to create users without signing out the current admin
const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToUsers(setUsers);
    return () => unsubscribe();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Create user in Firebase Auth using the secondary app
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUser = userCredential.user;

      // 2. Save role and password in Firestore
      await setUserRole(newUser.uid, email, role, password);

      // 3. Sign out from secondary app immediately (it doesn't affect main app)
      await secondaryAuth.signOut();

      setSuccess(`Usuario ${email} creado con éxito.`);
      setEmail('');
      setPassword('');
      setRole('viewer');
    } catch (err: any) {
      console.error("Error creating user:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está en uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil (mínimo 6 caracteres).');
      } else {
        setError('Error al crear el usuario. Verifique los permisos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (uid: string, userEmail: string) => {
    if (auth.currentUser?.uid === uid) {
      setError('No puedes eliminar tu propio usuario.');
      return;
    }

    setDeletingIds(prev => ({ ...prev, [uid]: true }));
    setError(null);
    setSuccess(null);
    try {
      await deleteUser(uid);
      setSuccess(`Usuario ${userEmail} eliminado correctamente.`);
    } catch (err) {
      console.error("Error deleting user record:", err);
      setError('Error al eliminar el usuario. Verifique los permisos.');
    } finally {
      setDeletingIds(prev => ({ ...prev, [uid]: false }));
    }
  };

  const [togglingIds, setTogglingIds] = useState<Record<string, boolean>>({});

  const handleToggleStatus = async (uid: string, userEmail: string, currentStatus: boolean | undefined) => {
    if (auth.currentUser?.uid === uid) {
      setError('No puedes inhabilitar tu propio usuario.');
      return;
    }
    
    const newStatus = !currentStatus;
    const actionText = newStatus ? 'inhabilitar' : 'habilitar';
    
    setTogglingIds(prev => ({ ...prev, [uid]: true }));
    setError(null);
    setSuccess(null);
    try {
      await toggleUserStatus(uid, newStatus);
      setSuccess(`Usuario ${userEmail} ${newStatus ? 'inhabilitado' : 'habilitado'} correctamente.`);
    } catch (err) {
      console.error(`Error toggling user status for ${uid}:`, err);
      setError(`Error al ${actionText} el usuario. Verifique los permisos.`);
    } finally {
      setTogglingIds(prev => ({ ...prev, [uid]: false }));
    }
  };

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-pami-blue/10 rounded-lg text-pami-blue">
            <UserPlus size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-pami-text">Crear Nuevo Usuario</h3>
            <p className="text-sm text-pami-muted">Agrega un nuevo usuario con acceso restringido</p>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pami-cyan"
              placeholder="usuario@pami.org.ar"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pami-cyan"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'viewer')}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pami-cyan bg-white"
            >
              <option value="viewer">Solo Lectura (Viewer)</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-pami-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-pami-blue/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 h-[42px]"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            Crear Usuario
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              {success}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-pami-text">Usuarios Registrados</h3>
          <span className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
            {users.length} usuarios
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm font-semibold text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Conexión</th>
                <th className="px-6 py-4">Password</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${u.isDisabled ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <UserIcon size={16} />
                      </div>
                      <span className="font-medium text-gray-700">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Shield size={12} />
                      {u.role === 'admin' ? 'Administrador' : 'Solo Lectura'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {(() => {
                        if (!u.lastSeen) return <span className="text-gray-400 italic text-xs">Nunca</span>;
                        const date = u.lastSeen.toDate ? u.lastSeen.toDate() : new Date(u.lastSeen);
                        const now = new Date();
                        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
                        let statusElement = null;
                        
                        if (diffMinutes < 5) {
                          statusElement = (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              En línea
                            </span>
                          );
                        } else if (diffMinutes < 60) {
                          statusElement = <span className="text-gray-500 text-xs">Hace {diffMinutes} min</span>;
                        } else if (diffMinutes < 1440) {
                          statusElement = <span className="text-gray-500 text-xs">Hace {Math.floor(diffMinutes / 60)} hs</span>;
                        } else {
                          statusElement = <span className="text-gray-500 text-xs">{date.toLocaleDateString()}</span>;
                        }

                        return statusElement;
                      })()}
                      
                      {u.devices && Object.keys(u.devices).length > 0 && (
                        <div className="flex flex-col gap-1 mt-1 border-t border-gray-100 pt-1.5">
                          {Object.entries(u.devices).map(([deviceId, d]: [string, any]) => {
                            const dDate = d.lastSeen?.toDate ? d.lastSeen.toDate() : new Date();
                            const dDiff = Math.floor((new Date().getTime() - dDate.getTime()) / 60000);
                            const isOnline = dDiff < 5;
                            return (
                              <div key={deviceId} className="flex items-center gap-1.5 text-[10px]" title={`ID: ${deviceId}`}>
                                <Monitor size={10} className={isOnline ? "text-emerald-500" : "text-gray-400"} />
                                <span className={isOnline ? "text-gray-700 font-medium" : "text-gray-500"}>{d.info || "Dispositivo"}</span>
                                {isOnline && <span className="text-emerald-600 font-bold ml-auto">•</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {u.creds_pw || u.password ? (
                        <>
                          <span className="font-mono text-sm text-gray-600 bg-gray-50 px-2.5 py-1 rounded border border-gray-100 min-w-[110px] inline-block">
                            {showPasswords[u.id] ? (u.creds_pw || u.password) : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePassword(u.id)}
                            className="p-1.5 text-gray-400 hover:text-pami-blue hover:bg-pami-blue/5 rounded-md transition-all"
                            title={showPasswords[u.id] ? "Ocultar" : "Mostrar"}
                          >
                            {showPasswords[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic bg-gray-50 px-2 py-1 rounded border border-dashed border-gray-200">
                          Google Login / No Pw
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      u.isDisabled 
                        ? 'bg-red-100 text-red-700 border border-red-200' 
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {u.isDisabled ? 'Inactivo' : 'Activo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.email, u.isDisabled)}
                        disabled={togglingIds[u.id]}
                        className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                          u.isDisabled 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-amber-500 hover:bg-amber-50'
                        }`}
                        title={u.isDisabled ? "Habilitar acceso" : "Inhabilitar acceso"}
                      >
                        {togglingIds[u.id] ? <Loader2 size={18} className="animate-spin" /> : (u.isDisabled ? <UserCheck size={18} /> : <UserX size={18} />)}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        disabled={deletingIds[u.id]}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title="Eliminar usuario"
                      >
                        {deletingIds[u.id] ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                    No hay usuarios registrados manualmente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

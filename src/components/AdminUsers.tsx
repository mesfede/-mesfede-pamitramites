import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { subscribeToUsers, setUserRole, deleteUser } from '../services/firestore';
import { UserPlus, Trash2, Shield, User as UserIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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

      // 2. Save role in Firestore
      await setUserRole(newUser.uid, email, role);

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
    if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${userEmail}?`)) {
      try {
        await deleteUser(uid);
        // Note: This only deletes the Firestore record. 
        // Deleting from Auth requires Admin SDK or the user to be signed in.
        // For this demo, deleting the Firestore record is enough to revoke access via Rules.
      } catch (err) {
        console.error("Error deleting user record:", err);
      }
    }
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
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
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
                    <button
                      onClick={() => handleDeleteUser(u.id, u.email)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar acceso"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">
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

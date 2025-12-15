import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Trash2, UserCog, Shield, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user: currentUser } = useAuth();

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users`);
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. You might not have permission.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (id, username) => {
        if (window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
            try {
                await axios.delete(`${API_BASE_URL}/api/users/${id}`);
                setUsers(users.filter(u => u.id !== id));
            } catch (err) {
                alert('Failed to delete user: ' + (err.response?.data?.error || err.message));
            }
        }
    };

    const handleRoleChange = async (id, currentRole) => {
        const newRole = currentRole === 'admin' ? 'staff' : 'admin';
        if (window.confirm(`Change role to ${newRole.toUpperCase()}?`)) {
            try {
                await axios.put(`${API_BASE_URL}/api/users/${id}/role`, { role: newRole });
                setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
            } catch (err) {
                alert('Failed to update role: ' + (err.response?.data?.error || err.message));
            }
        }
    };

    if (loading) return <div className="p-8 text-center">Loading users...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <p className="text-gray-500 text-sm">Manage system users and access roles</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 font-semibold text-gray-600 text-sm">User</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Role</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Created</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{u.username}</div>
                                        <div className="text-xs text-gray-500">{u.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${u.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {u.role === 'admin' ? <Shield size={12} /> : <UserCog size={12} />}
                                            {u.role ? u.role.toUpperCase() : 'STAFF'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {u.email_verified ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                                <CheckCircle size={14} /> Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                                                <ShieldAlert size={14} /> Unverified
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        {currentUser.id !== u.id && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleRoleChange(u.id, u.role || 'staff')}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Change Role"
                                                >
                                                    <UserCog size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                        {currentUser.id === u.id && (
                                            <span className="text-xs text-gray-400 italic">Current User</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default UserManagement;

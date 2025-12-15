import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { Plus, LayoutDashboard, List, Package, LogOut, X, Menu, FileSpreadsheet, Users } from 'lucide-react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import AssetForm from './components/AssetForm';
import AssetDetail from './components/AssetDetail';
import Login from './components/Login';
import Register from './components/Register';
import EmailVerification from './components/EmailVerification';
import DevVerificationHelper from './components/DevVerificationHelper';
import PublicAssetView from './components/PublicAssetView';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';

function Layout() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [assets, setAssets] = useState([]);

    const fetchAssets = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/assets`);
            setAssets(response.data);
        } catch (error) {
            console.error('Error fetching assets:', error);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    // Close sidebar when route changes (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    const handleAddAsset = () => {
        setEditingAsset(null);
        setIsFormOpen(true);
    };

    const handleEditAsset = (asset) => {
        setEditingAsset(asset);
        setIsFormOpen(true);
    };

    const handleDeleteAsset = async (id) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            try {
                await axios.delete(`${API_BASE_URL}/api/assets/${id}`);
                fetchAssets();
            } catch (error) {
                console.error('Error deleting asset:', error);
            }
        }
    };

    const handleFormSubmit = async () => {
        await fetchAssets();
        setIsFormOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans text-gray-900">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 bg-white border-r border-gray-200 flex flex-col h-screen z-30
                fixed lg:sticky top-0
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">GIMS Assets</h1>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <Link
                        to="/"
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${location.pathname === '/'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>
                    <Link
                        to="/list"
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${location.pathname === '/list'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <List size={20} />
                        Asset List
                    </Link>
                    <Link
                        to="/reports"
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${location.pathname === '/reports'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <FileSpreadsheet size={20} />
                        Reports
                    </Link>

                    {/* Admin Only Link */}
                    {user?.role === 'admin' && (
                        <Link
                            to="/users"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${location.pathname === '/users'
                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Users size={20} />
                            Users
                        </Link>
                    )}
                </nav>

                {/* User info and logout */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                                {user?.username?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-lg font-bold">GIMS Assets</h1>
                        <div className="w-10" /> {/* Spacer for centering */}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Only show header on Dashboard and List pages */}
                        {(location.pathname === '/' || location.pathname === '/list') && (
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                        {location.pathname === '/' ? 'Overview' : 'Assets'}
                                    </h2>
                                    <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage and track your company assets</p>
                                </div>
                                <button
                                    onClick={handleAddAsset}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 font-medium"
                                >
                                    <Plus size={20} />
                                    Add New Asset
                                </button>
                            </div>
                        )}

                        <div className="transition-all duration-300">
                            <Routes>
                                <Route path="/" element={<Dashboard assets={assets} />} />
                                <Route path="/list" element={<AssetList assets={assets} onEdit={handleEditAsset} onDelete={handleDeleteAsset} />} />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/users" element={user?.role === 'admin' ? <UserManagement /> : <Navigate to="/" />} />
                            </Routes>
                        </div>
                    </div>
                </main>
            </div>

            {/* Asset Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden scale-100 transition-all">
                        <AssetForm
                            asset={editingAsset}
                            onClose={() => setIsFormOpen(false)}
                            onSubmit={handleFormSubmit}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email/:token" element={<EmailVerification />} />
                    <Route path="/dev-verify" element={<DevVerificationHelper />} />
                    <Route path="/public/assets/:id" element={<PublicAssetView />} />

                    {/* Protected routes */}
                    <Route path="/assets/:id" element={
                        <ProtectedRoute>
                            <AssetDetail />
                        </ProtectedRoute>
                    } />

                    <Route path="/*" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    } />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

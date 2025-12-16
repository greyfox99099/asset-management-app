import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ArrowLeft, Package, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils';

const AssetDetail = () => {
    const { id } = useParams();
    // Removed useNavigate as per instruction, using Link for navigation
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAsset = async () => {
            try {
                // Using the full URL or relative path if proxy is set up
                // Assuming same backend URL as App.jsx
                const response = await axios.get(`${API_BASE_URL} /api/assets / ${id} `);
                setAsset(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching asset:', err);
                setError('Asset not found or server error');
                setLoading(false);
            }
        };

        if (id) {
            fetchAsset();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Loading asset details...</p>
                </div>
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                    <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-500 mb-6">{error || 'Asset not found'}</p>
                    <Link
                        to="/"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition w-full"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-y-auto bg-gray-100 font-sans text-gray-900 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        >
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="text-xl font-bold tracking-tight">Asset Details</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Hero / Header Section */}
                    <div className="p-8 pb-0 flex flex-col items-center text-center">
                        <div className="bg-blue-50 p-4 rounded-2xl mb-4">
                            <Package className="w-12 h-12 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{asset.name}</h2>
                        <span className={`mt - 2 px - 3 py - 1 rounded - full text - sm font - medium ${asset.status === 'In Use' ? 'bg-green-100 text-green-700' :
                            asset.status === 'Maintenance' ? 'bg-orange-100 text-orange-700' :
                                asset.status === 'Retired' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                            } `}>
                            {asset.status}
                        </span>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Key Value Table */}
                            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-gray-200">
                                        {/* General */}
                                        <tr className="flex flex-col sm:flex-row">
                                            <td className="p-4 font-medium text-gray-500 sm:w-1/3 bg-gray-100/50">Serial Number</td>
                                            <td className="p-4 text-gray-900 sm:w-2/3 font-mono">{asset.asset_id || '-'}</td>
                                        </tr>
                                        <tr className="flex flex-col sm:flex-row">
                                            <td className="p-4 font-medium text-gray-500 sm:w-1/3 bg-gray-100/50">Description</td>
                                            <td className="p-4 text-gray-900 sm:w-2/3 break-words whitespace-pre-wrap">{asset.description || '-'}</td>
                                        </tr>
                                        <tr className="flex flex-col sm:flex-row">
                                            <td className="p-4 font-medium text-gray-500 sm:w-1/3 bg-gray-100/50">Category</td>
                                            <td className="p-4 text-gray-900 sm:w-2/3">{asset.category || '-'} / {asset.sub_category || '-'}</td>
                                        </tr>
                                        <tr className="flex flex-col sm:flex-row">
                                            <td className="p-4 font-medium text-gray-500 sm:w-1/3 bg-gray-100/50">Quantity / Unit</td>
                                            <td className="p-4 text-gray-900 sm:w-2/3">{asset.quantity || '-'} {asset.unit}</td>
                                        </tr>

                                        {/* Location */}
                                        <tr className="flex flex-col sm:flex-row">
                                            <td className="p-4 font-medium text-gray-500 sm:w-1/3 bg-gray-100/50">Location / Dept</td>
                                            <td className="p-4 text-gray-900 sm:w-2/3">{asset.location || '-'} / {asset.department || '-'}</td>
                                        </tr>

                                        {/* Financials */}
                                        <tr className="flex flex-col sm:flex-row">
                                            <td className="p-4 font-medium text-gray-500 sm:w-1/3 bg-gray-100/50">Purchase Price</td>
                                            <td className="p-4 text-gray-900 sm:w-2/3">{asset.purchase_price ? formatCurrency(asset.purchase_price) : '-'}</td>
                                        </tr>
                                        <tr className="flex flex-col sm:flex-row">
                                            <td className="p-4 font-medium text-gray-500 sm:w-1/3 bg-gray-100/50">Purchase Date</td>
                                            <td className="p-4 text-gray-900 sm:w-2/3">{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}</td>
                                        </tr>
                                        <tr className="flex flex-col sm:flex-row">
                                            <td className="p-4 font-medium text-gray-500 sm:w-1/3 bg-gray-100/50">Date of Use</td>
                                            <td className="p-4 text-gray-900 sm:w-2/3">{asset.date_of_use ? new Date(asset.date_of_use).toLocaleDateString() : '-'}</td>
                                        </tr>
                                        <tr className="flex flex-col sm:flex-row">
                                            <td className="p-4 font-medium text-gray-500 sm:w-1/3 bg-gray-100/50">Expected Life</td>
                                            <td className="p-4 text-gray-900 sm:w-2/3">{asset.expected_life_years ? `${asset.expected_life_years} Years` : '-'}</td>
                                        </tr>
                                        <tr className="flex flex-col sm:flex-row">
                                            <td className="p-4 font-medium text-gray-500 sm:w-1/3 bg-gray-100/50">Warranty Exp</td>
                                            <td className="p-4 text-gray-900 sm:w-2/3">{asset.warranty_expiry_date ? new Date(asset.warranty_expiry_date).toLocaleDateString() : '-'}</td>
                                        </tr>

                                        {/* Depreciation */}
                                        <tr className="flex flex-col sm:flex-row">
                                            <td className="p-4 font-medium text-gray-500 sm:w-1/3 bg-gray-100/50">Depreciation</td>
                                            <td className="p-4 text-gray-900 sm:w-2/3">
                                                Annual: {asset.depreciation_annual ? formatCurrency(asset.depreciation_annual) : '-'} <br />
                                                Monthly: {asset.depreciation_monthly ? formatCurrency(asset.depreciation_monthly) : '-'}
                                            </td>
                                        </tr>

                                        {/* Maintenance */}
                                        <tr className="flex flex-col sm:flex-row">
                                            <td className="p-4 font-medium text-gray-500 sm:w-1/3 bg-gray-100/50">Calibration</td>
                                            <td className="p-4 text-gray-900 sm:w-2/3">
                                                Last: {asset.last_calibrated_date ? new Date(asset.last_calibrated_date).toLocaleDateString() : '-'} <br />
                                                Next: {asset.next_calibration_date ? new Date(asset.next_calibration_date).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Attachments Section */}
                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Attachments</h3>
                                {asset.attachments && asset.attachments.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {asset.attachments.map((file) => (
                                            <div key={file.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                                {file.file_type && file.file_type.startsWith('image/') ? (
                                                    <div className="relative group">
                                                        <img
                                                            src={`${API_BASE_URL}${file.file_url}`}
                                                            alt={file.file_name}
                                                            className="w-full h-48 object-cover"
                                                        />
                                                        <a
                                                            href={`${API_BASE_URL}${file.file_url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 text-white font-medium"
                                                        >
                                                            View Image
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <div className="p-6 flex flex-col items-center justify-center text-center h-48 bg-gray-50">
                                                        <Package className="w-12 h-12 text-blue-500 mb-3" />
                                                        <p className="text-sm font-medium text-gray-900 mb-2 truncate max-w-full px-4">{file.file_name}</p>
                                                        <a
                                                            href={`${API_BASE_URL}${file.file_url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                                                        >
                                                            Download / View
                                                        </a>
                                                    </div>
                                                )}
                                                <div className="bg-white p-3 border-t border-gray-100 flex justify-between items-center">
                                                    <span className="text-xs text-gray-500 truncate max-w-[150px]">{file.file_name}</span>
                                                    <span className="text-xs text-gray-400">{new Date(file.uploaded_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No attachments available for this asset.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AssetDetail;

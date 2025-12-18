import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Package, MapPin, Calendar, AlertCircle, Wrench } from 'lucide-react';

const PublicAssetView = () => {
    const { id } = useParams();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAsset = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/public/assets/${id}`);
                setAsset(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.error || 'Asset not found');
                setLoading(false);
            }
        };

        fetchAsset();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading asset information...</p>
                </div>
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Asset Not Found</h2>
                    <p className="text-gray-600">{error || 'The requested asset could not be found.'}</p>
                </div>
            </div>
        );
    }

    const InfoRow = ({ label, value, icon: Icon }) => {
        if (!value || value === '-') return null;

        return (
            <div className="border-b border-gray-100 py-4 last:border-0">
                <div className="flex items-start gap-3">
                    {Icon && (
                        <div className="mt-1">
                            <Icon size={18} className="text-blue-600" />
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                        <p className="text-base text-gray-900 font-medium">{value}</p>
                    </div>
                </div>
            </div>
        );
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            'In Use': 'bg-green-100 text-green-700',
            'In Storage': 'bg-gray-100 text-gray-700',
            'Maintenance': 'bg-orange-100 text-orange-700',
            'Retired': 'bg-red-100 text-red-700'
        };

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-t-2xl shadow-xl p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-600 p-3 rounded-xl">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">GIMS Asset Information</p>
                            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <StatusBadge status={asset.status} />
                    </div>
                </div>

                {/* Asset Information */}
                <div className="bg-white shadow-xl p-6 mt-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                        Asset Details
                    </h2>

                    <div className="space-y-0">
                        <InfoRow label="Serial Number" value={asset.asset_id} />
                        <InfoRow label="Description" value={asset.description} />
                        <InfoRow label="Category" value={asset.category} />
                        <InfoRow label="Sub Category" value={asset.sub_category} />
                        <InfoRow label="Quantity" value={asset.quantity ? `${asset.quantity} ${asset.unit || ''}`.trim() : null} />
                        <InfoRow label="Location" value={asset.location} icon={MapPin} />
                        <InfoRow label="Department" value={asset.department} />
                        <InfoRow label="Purchase Date" value={asset.purchase_date} icon={Calendar} />
                        <InfoRow label="Date of Use" value={asset.date_of_use} icon={Calendar} />
                        <InfoRow label="Expected Life" value={asset.expected_life_years ? `${asset.expected_life_years} years` : null} />
                        <InfoRow label="Last Calibrated" value={asset.last_calibrated_date} icon={Wrench} />
                        <InfoRow label="Next Calibration" value={asset.next_calibration_date} icon={Wrench} />
                        <InfoRow label="Warranty Expiry" value={asset.warranty_expiry_date} icon={Calendar} />
                    </div>
                </div>

                {/* Attachments Section */}
                <div className="bg-white rounded-b-2xl shadow-xl p-6 mt-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                        Attachments
                    </h2>

                    {asset.attachments && asset.attachments.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {asset.attachments.map((file) => (
                                <div key={file.id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                                    {file.file_type && file.file_type.startsWith('image/') ? (
                                        <div className="relative group">
                                            <img
                                                src={`${API_BASE_URL}${file.file_path || file.file_url}`}
                                                alt={file.file_name}
                                                className="w-full h-48 object-cover"
                                            />
                                            <a
                                                href={`${API_BASE_URL}${file.file_path || file.file_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 text-white font-medium"
                                            >
                                                View Image
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="p-6 flex flex-col items-center justify-center text-center h-48">
                                            <Package className="w-12 h-12 text-blue-500 mb-3" />
                                            <p className="text-sm font-medium text-gray-900 mb-2 truncate max-w-full px-4">{file.file_name}</p>
                                            <a
                                                href={`${API_BASE_URL}${file.file_path || file.file_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                                            >
                                                Download / View
                                            </a>
                                        </div>
                                    )}
                                    <div className="bg-white p-3 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 truncate">{file.file_name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-center py-4">No attachments available.</p>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        © 2025 GIMS Assets Manager
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicAssetView;

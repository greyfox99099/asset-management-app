import { Edit2, Trash2, Search, QrCode, Upload } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency, calculateCurrentValue } from '../utils';
import QRCodeModal from './QRCodeModal';
import ImportModal from './ImportModal';

const AssetList = ({ assets, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedAssetForQR, setSelectedAssetForQR] = useState(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const handleOpenQR = (asset) => {
        setSelectedAssetForQR(asset);
        setIsQRModalOpen(true);
    };

    const handleCloseQR = () => {
        setIsQRModalOpen(false);
        setSelectedAssetForQR(null);
    };



    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.assigned_to && asset.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-900">All Assets</h3>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors border border-green-200"
                    >
                        <Upload size={16} />
                        Import
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar pb-4">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty / Unit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Use</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exp. Life</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depr. (Yr/Mo)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty Exp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Calib.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Calib.</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredAssets.map((asset) => {
                            const currentValue = calculateCurrentValue(asset);
                            return (
                                <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{asset.asset_id || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{asset.name}</span>
                                            <span className="text-xs text-gray-500 truncate max-w-[200px]">{asset.description}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {asset.attachment_count > 0 ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {asset.attachment_count}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.category || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.sub_category || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.quantity || '-'} {asset.unit}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.location || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.department || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${asset.status === 'In Use' ? 'bg-green-100 text-green-800' :
                                            asset.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                                asset.status === 'Retired' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {asset.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.purchase_price ? formatCurrency(asset.purchase_price) : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.date_of_use ? new Date(asset.date_of_use).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.expected_life_years ? `${asset.expected_life_years} Yrs` : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col">
                                            <span>{asset.depreciation_annual ? formatCurrency(asset.depreciation_annual) : '-'}</span>
                                            <span className="text-xs text-gray-400">{asset.depreciation_monthly ? formatCurrency(asset.depreciation_monthly) : '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-l border-gray-100 bg-gray-50/50">
                                        {currentValue !== null ? formatCurrency(currentValue) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.warranty_expiry_date ? new Date(asset.warranty_expiry_date).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.last_calibrated_date ? new Date(asset.last_calibrated_date).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {asset.next_calibration_date ? new Date(asset.next_calibration_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenQR(asset)}
                                                className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="Generate QR"
                                            >
                                                <QrCode size={18} />
                                            </button>
                                            <button
                                                onClick={() => onEdit(asset)}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(asset.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredAssets.length === 0 && (
                            <tr>
                                <td colSpan="18" className="px-6 py-12 text-center text-gray-500">
                                    No assets found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <QRCodeModal
                isOpen={isQRModalOpen}
                onClose={handleCloseQR}
                asset={selectedAssetForQR}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    // Trigger a refresh indirectly or directly if possible
                    // Ideally pass a refreshAssets prop from DashboardParent
                    window.location.reload(); // Simple refresh for now
                }}
            />
        </div >
    );
};

export default AssetList;

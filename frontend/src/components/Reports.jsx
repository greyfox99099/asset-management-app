import { useState } from 'react';
import { FileSpreadsheet, Download, FileText } from 'lucide-react';
import { API_BASE_URL } from '../config';
import axios from 'axios';

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleExport = async (format) => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/api/reports/assets/export?format=${format}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    responseType: 'blob' // Important for file download
                }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `Asset_Report_${timestamp}.${format}`;

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setSuccess(`Report exported successfully as ${format.toUpperCase()}!`);
        } catch (err) {
            console.error('Export error:', err);
            setError(err.response?.data?.error || 'Failed to export report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-blue-100 p-3 rounded-xl">
                        <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Asset Reports</h1>
                        <p className="text-gray-500 mt-1">Export comprehensive asset data</p>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                        {success}
                    </div>
                )}

                {/* Export Options */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Formats</h2>

                    {/* Excel Export */}
                    <div className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <FileSpreadsheet className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">Excel Format (.xlsx)</h3>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Best for Google Sheets, Microsoft Excel, and data analysis
                                    </p>
                                    <ul className="text-sm text-gray-500 mt-2 space-y-1">
                                        <li>• Formatted columns with proper widths</li>
                                        <li>• All asset data including financial information</li>
                                        <li>• Ready to upload to Google Drive</li>
                                    </ul>
                                </div>
                            </div>
                            <button
                                onClick={() => handleExport('xlsx')}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                <Download size={20} />
                                {loading ? 'Exporting...' : 'Export Excel'}
                            </button>
                        </div>
                    </div>

                    {/* CSV Export */}
                    <div className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">CSV Format (.csv)</h3>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Universal format compatible with all spreadsheet applications
                                    </p>
                                    <ul className="text-sm text-gray-500 mt-2 space-y-1">
                                        <li>• Simple text-based format</li>
                                        <li>• Smaller file size</li>
                                        <li>• Easy to import into databases</li>
                                    </ul>
                                </div>
                            </div>
                            <button
                                onClick={() => handleExport('csv')}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                <Download size={20} />
                                {loading ? 'Exporting...' : 'Export CSV'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">📊 Report Contents</h4>
                    <p className="text-sm text-blue-800 mb-2">The exported report includes:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-700">
                        <div>
                            <p>• Serial Number</p>
                            <p>• Asset Name & Description</p>
                            <p>• Category & Sub Category</p>
                            <p>• Quantity & Unit</p>
                            <p>• Location & Department</p>
                        </div>
                        <div>
                            <p>• Purchase Date & Price</p>
                            <p>• Depreciation Data</p>
                            <p>• Current Value</p>
                            <p>• Calibration Dates</p>
                            <p>• Warranty Information</p>
                        </div>
                    </div>
                </div>

                {/* Usage Instructions */}
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">💡 How to use in Google Sheets</h4>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                        <li>Click "Export Excel" or "Export CSV"</li>
                        <li>Go to Google Drive (drive.google.com)</li>
                        <li>Click "New" → "File upload"</li>
                        <li>Select the downloaded file</li>
                        <li>Right-click the file → "Open with" → "Google Sheets"</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default Reports;

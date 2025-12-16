import { useState, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { X, Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const ImportModal = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Basic validation
            if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
                setError('Please upload a valid Excel or CSV file.');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/assets/import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult(response.data);
            setUploading(false);
            if (response.data.success && response.data.imported > 0) {
                // Delay notify success to let user see the result
                setTimeout(() => {
                    onSuccess && onSuccess();
                }, 2000); // Optional: Trigger refresh after 2s
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to import file. Please check the server logs.');
            setUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/assets/import-template`, {
                responseType: 'blob', // Important
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Asset_Import_Template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Download template error:', err);
            console.log('Error details:', err.response?.data);
            alert(`Failed to download template: ${err.message}`);
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <FileSpreadsheet className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Import Assets</h2>
                            <p className="text-sm text-gray-500">Upload Excel/CSV from Google Sheets</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { reset(); onClose(); }}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Step 1: Template */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-blue-900">Step 1: Get the Template</p>
                            <p className="text-xs text-blue-700 mt-1">Download, fill data, then upload.</p>
                        </div>
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors shadow-sm"
                        >
                            <Download size={16} />
                            Download Template
                        </button>
                    </div>

                    {/* Step 2: Upload Area */}
                    {!result ? (
                        <div className="space-y-4">
                            <p className="text-sm font-semibold text-gray-900">Step 2: Upload File</p>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileChange}
                                />
                                {file ? (
                                    <>
                                        <FileSpreadsheet className="w-12 h-12 text-green-500 mb-3" />
                                        <p className="font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                                        <p className="font-medium text-gray-600">Click to Select File</p>
                                        <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv</p>
                                    </>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${!file || uploading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20'
                                    }`}
                            >
                                {uploading ? (
                                    <>
                                        <Loader className="animate-spin" size={20} />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        Start Import
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* Result View */
                        <div className="space-y-6 text-center animate-in zoom-in duration-200">
                            <div className="flex justify-center">
                                {result.imported > 0 ? (
                                    <div className="bg-green-100 p-4 rounded-full">
                                        <CheckCircle className="w-12 h-12 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="bg-orange-100 p-4 rounded-full">
                                        <AlertCircle className="w-12 h-12 text-orange-600" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {result.imported > 0 ? 'Import Complete!' : 'Import Finished'}
                                </h3>
                                <p className="text-gray-600 mt-1">
                                    Successfully imported <span className="font-bold text-gray-900">{result.imported}</span> out of {result.total} rows.
                                </p>
                            </div>

                            {result.errors && result.errors.length > 0 && (
                                <div className="bg-red-50 rounded-xl p-4 text-left max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                                    <p className="text-xs font-bold text-red-800 uppercase mb-2">Errors / Warnings:</p>
                                    <ul className="space-y-1">
                                        {result.errors.map((err, idx) => (
                                            <li key={idx} className="text-xs text-red-600 flex items-start gap-1">
                                                <span>•</span> {err}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { reset(); }}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Import Another
                                </button>
                                <button
                                    onClick={() => { reset(); onClose(); onSuccess(); }}
                                    className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ImportModal;

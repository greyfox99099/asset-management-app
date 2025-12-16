import { X, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
import { formatCurrency } from '../utils';
import { useState } from 'react';

const QRCodeModal = ({ isOpen, onClose, asset }) => {
    const [qrSize, setQrSize] = useState('medium'); // small, medium, large, xlarge

    if (!isOpen || !asset) return null;

    // Get the current host - will use network IP when accessed from network
    // For mobile access, use the local network IP instead of localhost
    const getAccessibleUrl = () => {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;

        // If running on localhost, try to use network IP
        // You can also hardcode your IP here: const host = '192.168.18.32:5173';
        const host = hostname === 'localhost' ? `${hostname}:${port}` : window.location.host;

        // Use public route for QR code (no authentication required)
        return `${protocol}//${host}/public/assets/${asset.id}`;
    };

    const qrData = getAccessibleUrl();

    // QR Code size mapping
    const sizeMap = {
        small: { size: 150, label: 'Small (5x5 cm)' },
        medium: { size: 200, label: 'Medium (7x7 cm)' },
        large: { size: 300, label: 'Large (10x10 cm)' },
        xlarge: { size: 400, label: 'Extra Large (14x14 cm)' }
    };

    const handlePrint = () => {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        const qrSvg = document.getElementById('qr-code-svg');

        if (!qrSvg || !printWindow) return;

        const svgData = new XMLSerializer().serializeToString(qrSvg);
        const currentSize = sizeMap[qrSize].size;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print QR Code - ${asset.name}</title>
                <style>
                    @media print {
                        @page {
                            size: auto;
                            margin: 10mm;
                        }
                        body {
                            margin: 0;
                            padding: 20px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                        }
                    }
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 20px;
                    }
                    .qr-container {
                        border: 2px solid #e5e7eb;
                        padding: 20px;
                        border-radius: 8px;
                        background: white;
                        display: inline-block;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        max-width: 100%;
                    }
                    .qr-wrapper {
                        position: relative;
                        display: flex;
                        justify-content: center;
                        margin-bottom: 20px;
                    }
                    .qr-code {
                        display: block;
                        max-width: 100%;
                        height: auto;
                    }
                    .logo-overlay {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: white;
                        padding: 4px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        z-index: 9999;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .logo-overlay img {
                        width: 40px;
                        height: 40px;
                        object-fit: contain;
                    }
                    .asset-info {
                        text-align: center;
                        padding-top: 15px;
                        border-top: 1px solid #e5e7eb;
                    }
                    .asset-name {
                        font-size: 16px;
                        font-weight: bold;
                        color: #111827;
                        margin-bottom: 5px;
                        word-break: break-word;
                    }
                    .asset-id {
                        font-size: 12px;
                        color: #6b7280;
                        font-family: monospace;
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <div class="qr-wrapper">
                        <div class="qr-code">
                            ${svgData}
                        </div>
                        <div class="logo-overlay">
                            <img src="${window.location.origin}/logo-gims.jpeg" alt="GIMS Logo" />
                        </div>
                    </div>
                    <div class="asset-info">
                        <div class="asset-name">${asset.name}</div>
                        <div class="asset-id">ID: ${asset.asset_id || asset.id}</div>
                    </div>
                </div>
                <script>
                    // Wait for image to load before printing
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);

        printWindow.document.close();


    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative transition-all my-8">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Asset QR Code</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center gap-6">
                    {/* Size Selector */}
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            QR Code Size
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(sizeMap).map(([key, { label }]) => (
                                <button
                                    key={key}
                                    onClick={() => setQrSize(key)}
                                    className={`px-3 py-3 rounded-lg text-sm font-medium transition h-auto whitespace-normal leading-tight ${qrSize === key
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                        <QRCode
                            id="qr-code-svg"
                            value={qrData}
                            size={sizeMap[qrSize].size}
                            level="H"
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                        {/* Logo Overlay */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full">
                            <img
                                src="/logo-gims.jpeg"
                                alt="Logo"
                                className="w-10 h-10 object-contain"
                            />
                        </div>
                    </div>

                    {/* Display URL for debugging */}
                    <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-900 mb-1">QR Code URL:</p>
                        <p className="text-xs text-blue-700 break-all font-mono">{qrData}</p>
                    </div>

                    <div className="w-full">
                        <h4 className="font-bold text-gray-900 mb-4 text-center">Asset Details</h4>
                        {/* Details Table */}
                        <div className="mt-6 border-t border-gray-100 pt-4 w-full text-left">
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-100">
                                    <tr className="grid grid-cols-3 gap-2 py-1">
                                        <td className="font-medium text-gray-500">Name</td>
                                        <td className="col-span-2 text-gray-900">{asset.name}</td>
                                    </tr>
                                    <tr className="grid grid-cols-3 gap-2 py-1">
                                        <td className="font-medium text-gray-500">Loc/Dept</td>
                                        <td className="col-span-2 text-gray-900 font-mono">{asset.location} / {asset.department}</td>
                                    </tr>
                                    <tr className="grid grid-cols-3 gap-2 py-1">
                                        <td className="font-medium text-gray-500">Status</td>
                                        <td className="col-span-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${asset.status === 'In Use' ? 'bg-green-100 text-green-800' :
                                                asset.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                                    asset.status === 'Retired' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="grid grid-cols-3 gap-2 py-1">
                                        <td className="font-medium text-gray-500">Next Calib.</td>
                                        <td className="col-span-2 text-gray-900">{asset.next_calibration_date ? new Date(asset.next_calibration_date).toLocaleDateString() : '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                        >
                            <Printer size={18} />
                            Print QR Code
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-600 text-white py-2.5 rounded-lg font-medium hover:bg-gray-700 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRCodeModal;

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
                            <img src="data:image/jpeg;base64,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" alt="GIMS Logo" />
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden scale-100 transition-all my-8">
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
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${qrSize === key
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

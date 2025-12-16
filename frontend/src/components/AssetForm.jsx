import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { X } from 'lucide-react';

const InputField = ({ label, name, type = "text", placeholder, required = false, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            required={required}
            value={value}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
    </div>
);

const AssetForm = ({ asset, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        asset_id: '',
        name: '',
        description: '',
        quantity: '',
        unit: '',
        location: '',
        department: '',
        category: '',
        sub_category: '',
        purchase_date: '',
        date_of_use: '',
        status: 'In Storage',
        purchase_price: '',
        expected_life_years: '',
        depreciation_annual: '',
        depreciation_monthly: '',
        last_calibrated_date: '',
        next_calibration_date: '',
        warranty_expiry_date: '',
        photo: null,
        document: null
    });

    useEffect(() => {
        const loadAssetDetails = async () => {
            if (asset) {
                try {
                    // Fetch full details including attachments
                    const response = await axios.get(`${API_BASE_URL}/api/assets/${asset.id}`);
                    const fullAsset = response.data;

                    setFormData({
                        asset_id: fullAsset.asset_id || '',
                        name: fullAsset.name || '',
                        description: fullAsset.description || '',
                        quantity: fullAsset.quantity || '',
                        unit: fullAsset.unit || '',
                        location: fullAsset.location || '',
                        department: fullAsset.department || '',
                        category: fullAsset.category || '',
                        sub_category: fullAsset.sub_category || '',
                        purchase_date: fullAsset.purchase_date ? fullAsset.purchase_date.split('T')[0] : '',
                        date_of_use: fullAsset.date_of_use ? fullAsset.date_of_use.split('T')[0] : '',
                        status: fullAsset.status || 'In Storage',
                        purchase_price: fullAsset.purchase_price || '',
                        expected_life_years: fullAsset.expected_life_years || '',
                        depreciation_annual: fullAsset.depreciation_annual || '',
                        depreciation_monthly: fullAsset.depreciation_monthly || '',
                        last_calibrated_date: fullAsset.last_calibrated_date ? fullAsset.last_calibrated_date.split('T')[0] : '',
                        next_calibration_date: fullAsset.next_calibration_date ? fullAsset.next_calibration_date.split('T')[0] : '',
                        warranty_expiry_date: fullAsset.warranty_expiry_date ? fullAsset.warranty_expiry_date.split('T')[0] : '',
                        attachments: fullAsset.attachments || [], // Existing attachments
                        photo: null,
                        document: null
                    });
                } catch (error) {
                    console.error("Error fetching asset details:", error);
                    // Fallback to basic data if fetch fails
                    setFormData(prev => ({
                        ...prev,
                        asset_id: asset.asset_id || '',
                        name: asset.name || '',
                        // ... ensure critical fields are set even if fetch fails
                    }));
                }
            }
        };

        loadAssetDetails();
    }, [asset]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        let newFormData = { ...formData };

        if (files) {
            newFormData[name] = files[0];
        } else {
            newFormData[name] = value;
        }

        // Auto-calculate depreciation
        if (name === 'purchase_price' || name === 'expected_life_years') {
            const price = parseFloat(name === 'purchase_price' ? value : formData.purchase_price);
            const years = parseFloat(name === 'expected_life_years' ? value : formData.expected_life_years);

            if (price && years && years > 0) {
                const annual = price / years;
                const monthly = annual / 12;
                newFormData.depreciation_annual = annual.toFixed(2);
                newFormData.depreciation_monthly = monthly.toFixed(2);
            }
        }

        setFormData(newFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'attachments') {
                if (formData.attachments && formData.attachments.length > 0) {
                    formData.attachments.forEach(file => {
                        data.append('attachments', file);
                    });
                }
            } else if (formData[key] !== null && formData[key] !== '' && formData[key] !== undefined) {
                data.append(key, formData[key]);
            }
        });

        try {
            if (asset) {
                await axios.put(`${API_BASE_URL}/api/assets/${asset.id}`, data);
            } else {
                await axios.post(`${API_BASE_URL}/api/assets`, data);
            }
            onSubmit();
        } catch (error) {
            console.error('Error saving asset:', error);
            alert('Error saving asset');
        }
    };



    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full w-full bg-white min-h-0">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <h2 className="text-xl font-bold text-gray-900">
                    {asset ? 'Edit Asset' : 'Add New Asset'}
                </h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* General Information */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">General Information</h3>
                    </div>

                    <div className="md:col-span-2">
                        <InputField label="Serial Number" name="asset_id" placeholder="Enter Serial Number" value={formData.asset_id} onChange={handleChange} />
                    </div>

                    <div className="md:col-span-2">
                        <InputField label="Item Name / Description" name="name" required={true} placeholder="Asset Name" value={formData.name} onChange={handleChange} />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                        <textarea
                            name="description"
                            rows="2"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Detailed description..."
                        />
                    </div>

                    <InputField label="Category" name="category" value={formData.category} onChange={handleChange} />
                    <InputField label="Sub Category" name="sub_category" value={formData.sub_category} onChange={handleChange} />
                    <InputField label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} />
                    <InputField label="Unit" name="unit" placeholder="e.g. Unit, Set, Pcs" value={formData.unit} onChange={handleChange} />

                    {/* Location & Assignment */}
                    <div className="md:col-span-2 mt-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Location & Assignment</h3>
                    </div>

                    <InputField label="Location" name="location" value={formData.location} onChange={handleChange} />
                    <InputField label="Department" name="department" value={formData.department} onChange={handleChange} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="In Storage">In Storage</option>
                            <option value="In Use">In Use</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Retired">Retired</option>
                        </select>
                    </div>

                    {/* Financials & Dates */}
                    <div className="md:col-span-2 mt-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Financials & Dates</h3>
                    </div>

                    <InputField label="Purchase Price" name="purchase_price" type="number" value={formData.purchase_price} onChange={handleChange} />
                    <InputField label="Date of Purchase" name="purchase_date" type="date" value={formData.purchase_date} onChange={handleChange} />
                    <InputField label="Date of Use" name="date_of_use" type="date" value={formData.date_of_use} onChange={handleChange} />
                    <InputField label="Expected Life (Years)" name="expected_life_years" type="number" value={formData.expected_life_years} onChange={handleChange} />
                    <InputField label="Depreciation (Annual)" name="depreciation_annual" type="number" value={formData.depreciation_annual} onChange={handleChange} />
                    <InputField label="Depreciation (Monthly)" name="depreciation_monthly" type="number" value={formData.depreciation_monthly} onChange={handleChange} />
                    <InputField label="Warranty Exp Date" name="warranty_expiry_date" type="date" value={formData.warranty_expiry_date} onChange={handleChange} />

                    {/* Maintenance */}
                    <div className="md:col-span-2 mt-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Maintenance</h3>
                    </div>

                    <InputField label="Last Calibrated Date" name="last_calibrated_date" type="date" value={formData.last_calibrated_date} onChange={handleChange} />
                    <InputField label="Next To Calibrate Date" name="next_calibration_date" type="date" value={formData.next_calibration_date} onChange={handleChange} />


                    {/* Attachments */}
                    <div className="md:col-span-2 mt-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Attachments</h3>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Files</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-gray-500">Photos, Documents, PDF (Max 10MB each)</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    name="attachments"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files);
                                        setFormData(prev => ({
                                            ...prev,
                                            attachments: [...(prev.attachments || []), ...files]
                                        }));
                                    }}
                                />
                            </label>
                        </div>

                        {/* Staged Files List */}
                        {formData.attachments && formData.attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase">To be Uploaded:</p>
                                {formData.attachments.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newAttachments = [...formData.attachments];
                                                newAttachments.splice(index, 1);
                                                setFormData(prev => ({ ...prev, attachments: newAttachments }));
                                            }}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Existing Attachments List */}
                        {formData.attachments && formData.attachments.some(f => f.id) && (
                            <div className="mt-6 space-y-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Existing Attachments:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {formData.attachments.filter(f => f.id).map((file) => (
                                        <div key={file.id} className="flex items-center p-3 border border-gray-200 rounded-lg bg-white">
                                            <div className="flex-1 min-w-0 mr-3">
                                                <p className="text-sm font-medium text-gray-900 truncate">{file.file_name}</p>
                                                <p className="text-xs text-gray-500">{new Date(file.uploaded_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`${API_BASE_URL}${file.file_url}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                                                    title="View"
                                                >
                                                    View
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (confirm('Delete this attachment?')) {
                                                            try {
                                                                await axios.delete(`${API_BASE_URL}/api/assets/attachments/${file.id}`);

                                                                // Remove from view immediately
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    attachments: prev.attachments.filter(a => a.id !== file.id)
                                                                }));

                                                            } catch (err) {
                                                                console.error("Error deleting file:", err);
                                                                alert('Failed to delete file');
                                                            }
                                                        }
                                                    }}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                                                    title="Delete"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-lg">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
                >
                    {asset ? 'Update Asset' : 'Create Asset'}
                </button>
            </div>
        </form>
    );
};

export default AssetForm;

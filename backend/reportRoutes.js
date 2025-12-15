const express = require('express');
const router = express.Router();
const { query } = require('./db');
const XLSX = require('xlsx');

// Export assets to Excel/CSV
router.get('/assets/export', async (req, res) => {
    try {
        const { format = 'xlsx' } = req.query;

        // Fetch all assets
        const result = await query('SELECT * FROM assets ORDER BY id');
        const assets = result.rows;

        if (assets.length === 0) {
            return res.status(404).json({ error: 'No assets found to export' });
        }

        // Prepare data for export
        const exportData = assets.map(asset => ({
            'Serial Number': asset.asset_id || '',
            'Asset Name': asset.name || '',
            'Description': asset.description || '',
            'Category': asset.category || '',
            'Sub Category': asset.sub_category || '',
            'Quantity': asset.quantity || 0,
            'Unit': asset.unit || '',
            'Location': asset.location || '',
            'Department': asset.department || '',
            'Status': asset.status || '',
            'Purchase Date': asset.purchase_date || '',
            'Purchase Price': asset.purchase_price || 0,
            'Date of Use': asset.date_of_use || '',
            'Expected Life (Years)': asset.expected_life_years || 0,
            'Depreciation (Annual)': asset.depreciation_annual || 0,
            'Depreciation (Monthly)': asset.depreciation_monthly || 0,
            'Current Value': asset.current_value || 0,
            'Last Calibrated Date': asset.last_calibrated_date || '',
            'Next Calibration Date': asset.next_calibration_date || '',
            'Warranty Expiry Date': asset.warranty_expiry_date || ''
        }));

        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        const colWidths = [
            { wch: 15 }, // Serial Number
            { wch: 25 }, // Asset Name
            { wch: 30 }, // Description
            { wch: 15 }, // Category
            { wch: 15 }, // Sub Category
            { wch: 10 }, // Quantity
            { wch: 10 }, // Unit
            { wch: 15 }, // Location
            { wch: 15 }, // Department
            { wch: 12 }, // Status
            { wch: 12 }, // Purchase Date
            { wch: 15 }, // Purchase Price
            { wch: 12 }, // Date of Use
            { wch: 18 }, // Expected Life
            { wch: 18 }, // Depreciation Annual
            { wch: 18 }, // Depreciation Monthly
            { wch: 15 }, // Current Value
            { wch: 18 }, // Last Calibrated
            { wch: 18 }, // Next Calibration
            { wch: 18 }  // Warranty Expiry
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Assets');

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `Asset_Report_${timestamp}`;

        if (format === 'csv') {
            // Export as CSV
            const csv = XLSX.utils.sheet_to_csv(ws);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            res.send(csv);
        } else {
            // Export as Excel
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
            res.send(buffer);
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export assets' });
    }
});

module.exports = router;

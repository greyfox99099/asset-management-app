const express = require('express');
const router = express.Router();
const pool = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// Helper to insert attachments
const insertAttachments = async (assetId, files) => {
    if (!files || files.length === 0) return;

    const query = `INSERT INTO asset_attachments (asset_id, file_url, file_name, file_type) VALUES ($1, $2, $3, $4)`;

    for (const file of files) {
        const fileUrl = `/uploads/${file.filename}`;
        await pool.query(query, [assetId, fileUrl, file.originalname, file.mimetype]);
    }
};

// IMPORT TEMPLATE (unchanged logic)
router.get('/import-template', (req, res) => {
    try {
        const headers = [
            'Serial Number', 'Asset Name', 'Description', 'Quantity', 'Unit',
            'Location', 'Department', 'Category', 'Sub Category',
            'Purchase Price', 'Purchase Date (YYYY-MM-DD)', 'Date of Use (YYYY-MM-DD)', 'Status',
            'Expected Life (Years)', 'Warranty Expiry (YYYY-MM-DD)'
        ];

        // Sample data row to guide user
        const sampleData = [
            'SN-001', 'Sample Laptop', 'Dell Latitude', 1, 'Unit',
            'Office 1', 'IT', 'Electronics', 'Computer',
            15000000, '2024-01-01', '2024-01-02', 'In Use',
            5, '2025-01-01'
        ];

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet([headers, sampleData]);

        // Adjust column widths
        const wscols = headers.map(() => ({ wch: 20 }));
        ws['!cols'] = wscols;

        xlsx.utils.book_append_sheet(wb, ws, 'Template');

        const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Asset_Import_Template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (err) {
        console.error('Error generating template:', err);
        res.status(500).send('Server Error');
    }
});

// IMPORT ASSETS
// Using upload.single('file') to accept one excel file
router.post('/import', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        let successCount = 0;
        let errors = [];

        // Helper to parse date from Excel serial or string
        const parseDate = (val) => {
            if (!val) return null;
            if (typeof val === 'number') {
                // Excel serial date
                const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                return date.toISOString().split('T')[0];
            }
            // String YYYY-MM-DD
            return val;
        };

        for (const [index, row] of data.entries()) {
            const rowNum = index + 2; // +2 because header is 1-based and index 0 is row 2

            // Map columns (Flexible matching)
            const name = row['Asset Name'];

            if (!name) {
                errors.push(`Row ${rowNum}: Asset Name is required`);
                continue;
            }

            // Extract values
            const asset_id = row['Serial Number'] || null;
            const description = row['Description'] || null;
            const quantity = parseInt(row['Quantity']) || 1;
            const unit = row['Unit'] || 'Pcs';
            const location = row['Location'] || null;
            const department = row['Department'] || null;
            const category = row['Category'] || null;
            const sub_category = row['Sub Category'] || null;
            const purchase_price = parseFloat(row['Purchase Price']) || 0;
            const purchase_date = parseDate(row['Purchase Date (YYYY-MM-DD)']);
            const date_of_use = parseDate(row['Date of Use (YYYY-MM-DD)']);
            const status = row['Status'] || 'In Storage';
            const expected_life_years = parseFloat(row['Expected Life (Years)']) || 0;
            const warranty_expiry_date = parseDate(row['Warranty Expiry (YYYY-MM-DD)']);

            // Calculate depreciation if possible
            let depreciation_annual = 0;
            let depreciation_monthly = 0;
            if (purchase_price > 0 && expected_life_years > 0) {
                depreciation_annual = (purchase_price / expected_life_years).toFixed(2);
                depreciation_monthly = (depreciation_annual / 12).toFixed(2);
            }

            try {
                await pool.query(
                    `INSERT INTO assets (
                        asset_id, name, description, quantity, unit, location, department, 
                        category, sub_category, purchase_date, date_of_use, status, 
                        purchase_price, expected_life_years, depreciation_annual, 
                        depreciation_monthly, warranty_expiry_date
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                    [
                        asset_id, name, description, quantity, unit, location, department,
                        category, sub_category, purchase_date, date_of_use, status,
                        purchase_price, expected_life_years, depreciation_annual,
                        depreciation_monthly, warranty_expiry_date
                    ]
                );
                successCount++;
            } catch (dbErr) {
                console.error(`Row ${rowNum} Insert Error:`, dbErr);
                errors.push(`Row ${rowNum}: Database error (${dbErr.message})`);
            }
        }

        // Clean up file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            success: true,
            imported: successCount,
            total: data.length,
            errors: errors
        });

    } catch (err) {
        console.error('Import Error:', err);
        res.status(500).json({ error: 'Failed to process import file' });
    }
});

// GET all assets (with attachment count)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, 
            (SELECT COUNT(*) FROM asset_attachments WHERE asset_id = a.id) as attachment_count
            FROM assets a 
            ORDER BY a.id ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET single asset with attachments
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get asset details
        const assetResult = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
        if (assetResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        const asset = assetResult.rows[0];

        // Get attachments
        const attachmentsResult = await pool.query('SELECT * FROM asset_attachments WHERE asset_id = $1', [id]);
        asset.attachments = attachmentsResult.rows;

        res.json(asset);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// CREATE asset
router.post('/', upload.array('attachments'), async (req, res) => {
    try {
        console.log('POST /api/assets received');
        console.log('Body:', req.body);
        console.log('Files:', req.files);

        const {
            asset_id, name, description, quantity, unit, location, department,
            category, sub_category, purchase_date, date_of_use, status,
            purchase_price, expected_life_years, depreciation_annual,
            depreciation_monthly, last_calibrated_date, next_calibration_date,
            warranty_expiry_date
        } = req.body;

        const result = await pool.query(
            `INSERT INTO assets (
                asset_id, name, description, quantity, unit, location, department, 
                category, sub_category, purchase_date, date_of_use, status, 
                purchase_price, expected_life_years, depreciation_annual, 
                depreciation_monthly, last_calibrated_date, next_calibration_date, 
                warranty_expiry_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id`,
            [
                asset_id, name, description,
                parseInt(quantity) || 1,
                unit, location, department,
                category, sub_category,
                toNull(purchase_date),
                toNull(date_of_use),
                status,
                parseFloat(purchase_price) || 0,
                parseFloat(expected_life_years) || 0,
                parseFloat(depreciation_annual) || 0,
                parseFloat(depreciation_monthly) || 0,
                toNull(last_calibrated_date),
                toNull(next_calibration_date),
                toNull(warranty_expiry_date)
            ]
        );

        const assetId = result.rows[0].id;

        // Handle attachments
        if (req.files) {
            await insertAttachments(assetId, req.files);
        }

        const newAsset = await pool.query('SELECT * FROM assets WHERE id = $1', [assetId]);
        console.log('Asset created successfully:', newAsset.rows[0]);
        res.json(newAsset.rows[0]);
    } catch (err) {
        console.error('Error creating asset:', err);
        console.error('Stack:', err.stack);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// UPDATE asset
router.put('/:id', upload.array('attachments'), async (req, res) => {
    try {
        console.log('PUT /api/assets/:id received');
        console.log('Params:', req.params);
        console.log('Files:', req.files);
        const { id } = req.params;
        const {
            asset_id, name, description, quantity, unit, location, department,
            category, sub_category, purchase_date, date_of_use, status,
            purchase_price, expected_life_years, depreciation_annual,
            depreciation_monthly, last_calibrated_date, next_calibration_date,
            warranty_expiry_date
        } = req.body;

        const result = await pool.query(
            `UPDATE assets SET 
                asset_id = $1, name = $2, description = $3, quantity = $4, unit = $5, location = $6, 
                department = $7, category = $8, sub_category = $9, purchase_date = $10, 
                date_of_use = $11, status = $12, purchase_price = $13, expected_life_years = $14, 
                depreciation_annual = $15, depreciation_monthly = $16, last_calibrated_date = $17, 
                next_calibration_date = $18, warranty_expiry_date = $19
            WHERE id = $20 RETURNING id`,
            [
                asset_id, name, description,
                parseInt(quantity) || 0,
                unit, location, department,
                category, sub_category,
                toNull(purchase_date),
                toNull(date_of_use),
                status,
                parseFloat(purchase_price) || 0,
                parseFloat(expected_life_years) || 0,
                parseFloat(depreciation_annual) || 0,
                parseFloat(depreciation_monthly) || 0,
                toNull(last_calibrated_date),
                toNull(next_calibration_date),
                toNull(warranty_expiry_date),
                id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ msg: 'Asset not found' });
        }

        // Handle new attachments
        if (req.files) {
            await insertAttachments(id, req.files);
        }

        const updatedAssetResult = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
        const updatedAsset = updatedAssetResult.rows[0];
        // Fetch attachments to include in response
        const attachmentsResult = await pool.query('SELECT * FROM asset_attachments WHERE asset_id = $1', [id]);
        updatedAsset.attachments = attachmentsResult.rows;

        console.log('Asset updated successfully');
        res.json(updatedAsset);
    } catch (err) {
        console.error('Error updating asset:', err);
        console.error('Stack:', err.stack);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// Helper to sanitize inputs (Postgres doesn't like empty strings for dates/numbers)
const toNull = (val) => (val === '' || val === 'null' || val === undefined ? null : val);

// DELETE asset
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        res.json({ msg: 'Asset deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE single attachment
router.delete('/attachments/:attachmentId', async (req, res) => {
    try {
        const { attachmentId } = req.params;

        // Get file info first to delete from disk
        const fileResult = await pool.query('SELECT * FROM asset_attachments WHERE id = $1', [attachmentId]);
        if (fileResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Attachment not found' });
        }

        const fileData = fileResult.rows[0];
        const filePath = path.join(__dirname, '..', fileData.file_url);

        // Delete from DB
        await pool.query('DELETE FROM asset_attachments WHERE id = $1', [attachmentId]);

        // Delete from Disk (if exists)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ msg: 'Attachment deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// IMPORT TEMPLATE
router.get('/import-template', (req, res) => {
    try {
        const headers = [
            'Serial Number', 'Asset Name', 'Description', 'Quantity', 'Unit',
            'Location', 'Department', 'Category', 'Sub Category',
            'Purchase Price', 'Purchase Date (YYYY-MM-DD)', 'Date of Use (YYYY-MM-DD)', 'Status',
            'Expected Life (Years)', 'Warranty Expiry (YYYY-MM-DD)'
        ];

        // Sample data row to guide user
        const sampleData = [
            'SN-001', 'Sample Laptop', 'Dell Latitude', 1, 'Unit',
            'Office 1', 'IT', 'Electronics', 'Computer',
            15000000, '2024-01-01', '2024-01-02', 'In Use',
            5, '2025-01-01'
        ];

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet([headers, sampleData]);

        // Adjust column widths
        const wscols = headers.map(() => ({ wch: 20 }));
        ws['!cols'] = wscols;

        xlsx.utils.book_append_sheet(wb, ws, 'Template');

        const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Asset_Import_Template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (err) {
        console.error('Error generating template:', err);
        res.status(500).send('Server Error');
    }
});

// IMPORT ASSETS
// Using upload.single('file') to accept one excel file
router.post('/import', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        let successCount = 0;
        let errors = [];

        // Helper to parse date from Excel serial or string
        const parseDate = (val) => {
            if (!val) return null;
            if (typeof val === 'number') {
                // Excel serial date
                const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                return date.toISOString().split('T')[0];
            }
            // String YYYY-MM-DD
            return val;
        };

        for (const [index, row] of data.entries()) {
            const rowNum = index + 2; // +2 because header is 1-based and index 0 is row 2

            // Map columns (Flexible matching)
            const name = row['Asset Name'];

            if (!name) {
                errors.push(`Row ${rowNum}: Asset Name is required`);
                continue;
            }

            // Extract values
            const asset_id = row['Serial Number'] || null;
            const description = row['Description'] || null;
            const quantity = parseInt(row['Quantity']) || 1;
            const unit = row['Unit'] || 'Pcs';
            const location = row['Location'] || null;
            const department = row['Department'] || null;
            const category = row['Category'] || null;
            const sub_category = row['Sub Category'] || null;
            const purchase_price = parseFloat(row['Purchase Price']) || 0;
            const purchase_date = parseDate(row['Purchase Date (YYYY-MM-DD)']);
            const date_of_use = parseDate(row['Date of Use (YYYY-MM-DD)']);
            const status = row['Status'] || 'In Storage';
            const expected_life_years = parseFloat(row['Expected Life (Years)']) || 0;
            const warranty_expiry_date = parseDate(row['Warranty Expiry (YYYY-MM-DD)']);

            // Calculate depreciation if possible
            let depreciation_annual = 0;
            let depreciation_monthly = 0;
            if (purchase_price > 0 && expected_life_years > 0) {
                depreciation_annual = (purchase_price / expected_life_years).toFixed(2);
                depreciation_monthly = (depreciation_annual / 12).toFixed(2);
            }

            try {
                await pool.run(
                    `INSERT INTO assets(
                asset_id, name, description, quantity, unit, location, department,
                category, sub_category, purchase_date, date_of_use, status,
                purchase_price, expected_life_years, depreciation_annual,
                depreciation_monthly, warranty_expiry_date
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        asset_id, name, description, quantity, unit, location, department,
                        category, sub_category, purchase_date, date_of_use, status,
                        purchase_price, expected_life_years, depreciation_annual,
                        depreciation_monthly, warranty_expiry_date
                    ]
                );
                successCount++;
            } catch (dbErr) {
                console.error(`Row ${rowNum} Insert Error: `, dbErr);
                errors.push(`Row ${rowNum}: Database error(${dbErr.message})`);
            }
        }

        // Clean up file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            success: true,
            imported: successCount,
            total: data.length,
            errors: errors
        });

    } catch (err) {
        console.error('Import Error:', err);
        res.status(500).json({ error: 'Failed to process import file' });
    }
});

module.exports = router;

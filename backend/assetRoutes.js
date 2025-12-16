const express = require('express');
const router = express.Router();
const pool = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

    const query = `INSERT INTO asset_attachments (asset_id, file_url, file_name, file_type) VALUES (?, ?, ?, ?)`;

    for (const file of files) {
        const fileUrl = `/uploads/${file.filename}`;
        await pool.query(query, [assetId, fileUrl, file.originalname, file.mimetype]);
    }
};

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
        const assetResult = await pool.query('SELECT * FROM assets WHERE id = ?', [id]);
        if (assetResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        const asset = assetResult.rows[0];

        // Get attachments
        const attachmentsResult = await pool.query('SELECT * FROM asset_attachments WHERE asset_id = ?', [id]);
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [
                asset_id, name, description, quantity, unit, location, department,
                category, sub_category, purchase_date, date_of_use, status,
                purchase_price, expected_life_years, depreciation_annual,
                depreciation_monthly, last_calibrated_date, next_calibration_date,
                warranty_expiry_date
            ]
        );

        const assetId = result.rows[0].id;

        // Handle attachments
        if (req.files) {
            await insertAttachments(assetId, req.files);
        }

        const newAsset = await pool.query('SELECT * FROM assets WHERE id = ?', [assetId]);
        res.json(newAsset.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// UPDATE asset
router.put('/:id', upload.array('attachments'), async (req, res) => {
    try {
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
                asset_id = ?, name = ?, description = ?, quantity = ?, unit = ?, location = ?, 
                department = ?, category = ?, sub_category = ?, purchase_date = ?, 
                date_of_use = ?, status = ?, purchase_price = ?, expected_life_years = ?, 
                depreciation_annual = ?, depreciation_monthly = ?, last_calibrated_date = ?, 
                next_calibration_date = ?, warranty_expiry_date = ?
            WHERE id = ?`,
            [
                asset_id, name, description, quantity, unit, location, department,
                category, sub_category, purchase_date, date_of_use, status,
                purchase_price, expected_life_years, depreciation_annual,
                depreciation_monthly, last_calibrated_date, next_calibration_date,
                warranty_expiry_date, id
            ]
        );

        if (result.changes === 0) {
            return res.status(404).json({ msg: 'Asset not found' });
        }

        // Handle new attachments
        if (req.files) {
            await insertAttachments(id, req.files);
        }

        const updatedAsset = await pool.query('SELECT * FROM assets WHERE id = ?', [id]);
        res.json(updatedAsset.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE asset
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM assets WHERE id = ? RETURNING *', [id]);
        if (result.rows.length === 0) {
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
        const fileResult = await pool.query('SELECT * FROM asset_attachments WHERE id = ?', [attachmentId]);
        if (fileResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Attachment not found' });
        }

        const fileData = fileResult.rows[0];
        const filePath = path.join(__dirname, '..', fileData.file_url);

        // Delete from DB
        await pool.query('DELETE FROM asset_attachments WHERE id = ?', [attachmentId]);

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

module.exports = router;

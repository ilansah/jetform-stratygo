const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database Connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stratygo_fiber',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Unique filename: timestamp-field-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept images and PDF
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDF are allowed!'), false);
        }
    }
});

// Routes

// 1. Submit Accreditation Request
const cpUpload = upload.fields([
    { name: 'id_card_front', maxCount: 1 },
    { name: 'id_card_back', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 } // Signature might come as a file or base64. Handling file here.
]);

app.post('/api/submissions', cpUpload, async (req, res) => {
    try {
        const data = req.body;
        const files = req.files;

        // Extract file paths
        const id_card_front_path = files['id_card_front'] ? files['id_card_front'][0].filename : null;
        const id_card_back_path = files['id_card_back'] ? files['id_card_back'][0].filename : null;
        const photo_path = files['photo'] ? files['photo'][0].filename : null;
        
        // Handle signature. If it's a file upload (from blob), use filename. 
        // If it was sent as base64 string in body (which is common for canvas), we might need to save it. 
        // For this implementation, I'll assume the frontend converts canvas to blob and appends to formData.
        const signature_path = files['signature'] ? files['signature'][0].filename : null;

        const query = `
            INSERT INTO accreditations 
            (full_name, phone, email, address, start_date, manager_name, team_code, manager_email, hr_email, tshirt_size, fiber_test_done, proxy_name, terms_accepted, id_card_front_path, id_card_back_path, photo_path, signature_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.full_name,
            data.phone,
            data.email,
            data.address,
            data.start_date,
            data.manager_name,
            data.team_code,
            data.manager_email,
            data.hr_email,
            data.tshirt_size,
            data.fiber_test_done === 'true' || data.fiber_test_done === '1',
            data.proxy_name || null,
            data.terms_accepted === 'true' || data.terms_accepted === '1',
            id_card_front_path,
            id_card_back_path,
            photo_path,
            signature_path
        ];

        const [result] = await pool.execute(query, values);
        
        res.status(201).json({ message: 'Submission successful', id: result.insertId });

    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// 2. Get All Submissions (Admin)
app.get('/api/submissions', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM accreditations ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Update Status (Admin)
app.patch('/api/submissions/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['En Cours', 'Approuvé'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await pool.execute('UPDATE accreditations SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Status updated successfully' });

    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Serve client public files (for PDF and other static assets)
app.use('/documents', express.static(path.join(__dirname, '../client/public/documents')));

// Serve React Frontend (Static Files)
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Routes should be defined above this catch-all
// ... (API routes are defined below in the original file, we will move the catch-all to the end)

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

// Test Database Connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Connected to MySQL Database');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database Connection Error:', err.message);
    });

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
app.post('/api/submissions', upload.fields([
    { name: 'id_card_front', maxCount: 1 },
    { name: 'id_card_back', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'signed_pdf', maxCount: 1 }
]), async (req, res) => {
    try {
        const data = req.body;
        const files = req.files;

        // File paths
        const id_card_front_path = files['id_card_front'] ? files['id_card_front'][0].filename : null;
        const id_card_back_path = files['id_card_back'] ? files['id_card_back'][0].filename : null;
        const photo_path = files['photo'] ? files['photo'][0].filename : null;
        // If it was sent as base64 string in body (which is common for canvas), we might need to save it. 
        // For this implementation, I'll assume the frontend converts canvas to blob and appends to formData.
        const signature_path = files['signature'] ? files['signature'][0].filename : null;
        const signed_pdf_path = files['signed_pdf'] ? files['signed_pdf'][0].filename : null;

        const query = `
            INSERT INTO accreditations 
            (full_name, phone, email, address, role, agency_city, direct_manager_name, director_name, network_animator_name, 
             start_date, team_code, manager_email, hr_email, tshirt_size, fiber_test_done, proxy_name, terms_accepted, 
             id_card_front_path, id_card_back_path, photo_path, signature_path, signed_pdf_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.full_name,
            data.phone,
            data.email,
            data.address,
            data.role,
            data.agency_city,
            data.direct_manager_name || null,
            data.director_name || null,
            data.network_animator_name || null,
            data.start_date,
            data.team_code,
            data.manager_email,
            data.hr_email,
            data.tshirt_size,
            data.fiber_test_done === 'true' || data.fiber_test_done === true,
            data.proxy_name || null,
            data.terms_accepted === 'true' || data.terms_accepted === true,
            id_card_front_path,
            id_card_back_path,
            photo_path,
            signature_path,
            signed_pdf_path
        ];

        const [result] = await pool.execute(query, values);

        res.status(201).json({ message: 'Submission successful', id: result.insertId });

    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// 2. Update Accreditation (for inline editing in admin)
app.put('/api/submissions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Build dynamic update query
        const allowedFields = [
            'full_name', 'phone', 'email', 'address', 'start_date',
            'manager_name', 'team_code', 'manager_email', 'hr_email',
            'tshirt_size', 'fiber_test_done', 'proxy_name', 'terms_accepted', 'status'
        ];

        const updateFields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                // Handle boolean fields
                if (key === 'fiber_test_done' || key === 'terms_accepted') {
                    values.push(updates[key] === 'true' || updates[key] === true || updates[key] === 1);
                } else {
                    values.push(updates[key]);
                }
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(id);
        const query = `UPDATE accreditations SET ${updateFields.join(', ')} WHERE id = ?`;

        await pool.execute(query, values);

        // Fetch updated record
        const [rows] = await pool.execute('SELECT * FROM accreditations WHERE id = ?', [id]);

        res.json({ message: 'Updated successfully', data: rows[0] });
    } catch (error) {
        console.error('Error updating submission:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// 3. Get All Accreditations (Admin)
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

        if (!['En Cours', 'Approuvé', 'Refusé'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await pool.execute('UPDATE accreditations SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Status updated successfully' });

    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Delete Submission (Admin)
app.delete('/api/submissions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get file paths before deleting
        const [rows] = await pool.query('SELECT * FROM accreditations WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const submission = rows[0];

        // Delete associated files
        const filePaths = [
            submission.id_card_front_path,
            submission.id_card_back_path,
            submission.photo_path,
            submission.signature_path,
            submission.signed_pdf_path
        ].filter(Boolean);

        filePaths.forEach(filePath => {
            const fullPath = path.join(__dirname, '../uploads', filePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        });

        // Delete from database
        await pool.execute('DELETE FROM accreditations WHERE id = ?', [id]);

        res.json({ message: 'Submission deleted successfully' });

    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Export to CSV (Admin)
app.get('/api/submissions/export/csv', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM accreditations ORDER BY created_at DESC');

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No data to export' });
        }

        // CSV Headers
        const headers = [
            'ID', 'Date de création', 'Statut', 'Nom complet', 'Téléphone', 'Email',
            'Rôle', 'Ville Agence', 'Manager Direct', 'Directeur', 'Animateur Réseau',
            'Date de début', 'Code équipe', 'Email gestionnaire', 'Email RH',
            'Taille T-shirt', 'Test fibre effectué', 'Nom du mandataire', 'Conditions acceptées'
        ];

        // Convert rows to CSV format
        const csvRows = [headers.join(',')];

        rows.forEach(row => {
            const values = [
                row.id,
                new Date(row.created_at).toLocaleDateString('fr-FR'),
                row.status,
                `"${row.full_name}"`,
                row.phone,
                row.email,
                row.role,
                `"${row.agency_city}"`,
                `"${row.direct_manager_name || '-'}"`,
                `"${row.director_name || '-'}"`,
                `"${row.network_animator_name || '-'}"`,
                new Date(row.start_date).toLocaleDateString('fr-FR'),
                row.team_code,
                row.manager_email,
                row.hr_email,
                row.tshirt_size,
                row.fiber_test_done ? 'Oui' : 'Non',
                `"${row.proxy_name || ''}"`,
                row.terms_accepted ? 'Oui' : 'Non'
            ];
            csvRows.push(values.join(','));
        });

        const csv = csvRows.join('\n');

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=accreditations_${Date.now()}.csv`);
        res.send('\uFEFF' + csv); // Add BOM for Excel compatibility

    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 5. Export to Excel (Admin)
app.get('/api/submissions/export/excel', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM accreditations ORDER BY created_at DESC');

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No data to export' });
        }

        // Prepare data for Excel
        const excelData = rows.map(row => ({
            'ID': row.id,
            'Date de création': new Date(row.created_at).toLocaleDateString('fr-FR'),
            'Statut': row.status,
            'Nom complet': row.full_name,
            'Téléphone': row.phone,
            'Email': row.email,
            'Rôle': row.role,
            'Ville Agence': row.agency_city,
            'Manager Direct': row.direct_manager_name || '-',
            'Directeur': row.director_name || '-',
            'Animateur Réseau': row.network_animator_name || '-',
            'Date de début': new Date(row.start_date).toLocaleDateString('fr-FR'),
            'Code équipe': row.team_code,
            'Email gestionnaire': row.manager_email,
            'Email RH': row.hr_email,
            'Taille T-shirt': row.tshirt_size,
            'Test fibre effectué': row.fiber_test_done ? 'Oui' : 'Non',
            'Nom du mandataire': row.proxy_name || '',
            'Conditions acceptées': row.terms_accepted ? 'Oui' : 'Non'
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        ws['!cols'] = [
            { wch: 5 },  // ID
            { wch: 15 }, // Date de création
            { wch: 12 }, // Statut
            { wch: 25 }, // Nom complet
            { wch: 15 }, // Téléphone
            { wch: 30 }, // Email
            { wch: 40 }, // Adresse
            { wch: 15 }, // Date de début
            { wch: 25 }, // Nom du gestionnaire
            { wch: 15 }, // Code équipe
            { wch: 30 }, // Email gestionnaire
            { wch: 30 }, // Email RH
            { wch: 12 }, // Taille T-shirt
            { wch: 20 }, // Test fibre effectué
            { wch: 25 }, // Nom du mandataire
            { wch: 20 }  // Conditions acceptées
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Accréditations');

        // Generate buffer
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=accreditations_${Date.now()}.xlsx`);
        res.send(excelBuffer);

    } catch (error) {
        console.error('Error exporting Excel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start Server
// Catch-all route for React (Must be last)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

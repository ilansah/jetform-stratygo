const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const envPath = path.join(__dirname, '../.env');
const dotenvResult = require('dotenv').config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory log storage
let lastServerError = null;
let lastRequestLog = null;

// Request Logger
app.use((req, res, next) => {
    lastRequestLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        body_keys: req.body ? Object.keys(req.body) : 'null'
    };
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

console.log('🔍 SYSTEM DEBUG:');
console.log('👉 Environment File Path:', envPath);
console.log('👉 Dotenv Result:', dotenvResult.error ? 'Error loading' : 'Success');
if (dotenvResult.error) console.error(dotenvResult.error);

console.log('👉 DB_USER from env:', process.env.DB_USER);
console.log('👉 DB_HOST from env:', process.env.DB_HOST);
console.log('👉 DB_NAME from env:', process.env.DB_NAME);

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Fix: If file not found in uploads, return 404 instead of falling through to React index.html
app.use('/uploads', (req, res) => {
    res.status(404).send('File not found');
});
// Serve client public files (for PDF and other static assets)
app.use('/documents', express.static(path.join(__dirname, '../client/public/documents')));
// Fix: If file not found in documents, return 404 instead of falling through to React index.html
app.use('/documents', (req, res) => {
    res.status(404).send('File not found');
});

// Serve React Frontend (Static Files)
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Routes should be defined above this catch-all
// ... (API routes are defined below in the original file, we will move the catch-all to the end)

// Database Connection
const dbConfig = {
    host: (process.env.DB_HOST || 'localhost').trim(),
    user: (process.env.DB_USER || 'root').trim(),
    password: (process.env.DB_PASSWORD || '').trim(),
    database: (process.env.DB_NAME || 'stratygo_fiber').trim(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.error('👉 DEBUG CREDENTIALS (STDERR):');
console.error('   User Length:', dbConfig.user.length);
console.error('   Pass Length:', dbConfig.password.length);
if (dbConfig.password.length > 2) {
    console.error('   Pass Start/End:', dbConfig.password[0] + '...' + dbConfig.password[dbConfig.password.length - 1]);
} else {
    console.error('   Pass Start/End: too short');
}
console.error('   Host:', dbConfig.host);


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
        // Allow PDF for documents
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        // Allow Images for signature and photo (if the user uploads an image for photo)
        else if ((file.fieldname === 'signature' || file.fieldname === 'photo' || file.fieldname === 'id_card_front' || file.fieldname === 'id_card_back') && (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg')) {
            cb(null, true);
        }
        else {
            cb(new Error(`Le fichier ${file.fieldname} doit être un PDF (ou une image pour signature/photo/CNI) !`), false);
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
    { name: 'signed_pdf', maxCount: 1 },
    { name: 'signed_charte', maxCount: 1 }
]), async (req, res) => {
    console.log('📌 POST /api/submissions received');
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

        const validTypes = ['Fibre', 'Energie'];
        const submissionType = validTypes.includes(data.type) ? data.type : 'Fibre';
        const signed_charte_path = files['signed_charte'] ? files['signed_charte'][0].filename : null;

        const query = `
            INSERT INTO accreditations 
            (full_name, phone, email, address, role, contract_type, agency_city, direct_manager_name, director_name, network_animator_name, 
             start_date, team_code, manager_email, hr_email, fiber_test_done, proxy_name, terms_accepted, 
             id_card_front_path, id_card_back_path, photo_path, signature_path, signed_pdf_path, type, signed_charte_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Apply business rule: If team_code is GVD, hr_email MUST be accredgovad@ikmail.com
        if (data.team_code && data.team_code.toUpperCase() === 'GVD') {
            data.hr_email = 'accredgovad@ikmail.com';
        }

        const values = [
            data.full_name,
            data.phone,
            data.email,
            data.address,
            data.role,
            data.contract_type, // Added contract_type
            data.agency_city,
            data.direct_manager_name || null,
            data.director_name || null,
            data.network_animator_name || null,
            data.start_date,
            data.team_code,
            data.manager_email,
            data.hr_email,
            data.fiber_test_done || false, // Default to false if missing
            data.proxy_name || null,
            data.terms_accepted === 'true' || data.terms_accepted === true,
            id_card_front_path,
            id_card_back_path,
            photo_path,
            signature_path,
            signed_pdf_path,
            submissionType,
            signed_charte_path
        ];

        try {
            const [result] = await pool.query(query, values);

            // Send Email Notifications
            if (data.email) {
                // Send confirmation email to applicant, simple version for now or use existing logic if any
            }

            res.status(201).json({ message: 'Submission successful', id: result.insertId });
        } catch (err) {
            console.error('❌ Database Insertion Error:', err);
            // Store error in memory
            lastServerError = {
                timestamp: new Date().toISOString(),
                message: err.message,
                stack: err.stack,
                values: values,
                type: 'DB_INSERT_ERROR'
            };
            res.status(500).json({ error: 'Internal Server Error', details: err.message, sqlMessage: err.sqlMessage });
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        // Store error in memory
        lastServerError = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            type: 'POST_ROUTE_OUTER_ERROR'
        };
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
            'direct_manager_name', 'director_name', 'network_animator_name',
            'team_code', 'manager_email', 'hr_email',
            'fiber_test_done', 'proxy_name', 'terms_accepted', 'status',
            'role', 'contract_type', 'agency_city'
        ];

        const updateFields = [];
        const values = [];

        // Apply business rule: If team_code is GVD, hr_email MUST be accredgovad@ikmail.com
        if (updates.team_code && updates.team_code.toUpperCase() === 'GVD') {
            updates.hr_email = 'accredgovad@ikmail.com';
        }

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
        console.error('Query Values:', values); // Helpful for debugging
        res.status(500).json({ error: 'Internal server error', details: error.message, sqlMessage: error.sqlMessage });
    }
});

// 3. Get All Accreditations (Admin) - Paginated & Filtered
app.get('/api/submissions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const type = req.query.type; // 'Fibre' or 'Energie'
        const search = req.query.search;
        const status = req.query.status;
        const offset = (page - 1) * limit;

        console.log('GET /api/submissions Params:', { page, limit, type, search, status });

        let countQuery = 'SELECT COUNT(*) as total FROM accreditations WHERE 1=1';
        let dataQuery = 'SELECT * FROM accreditations WHERE 1=1';
        const queryParams = [];

        if (type && ['Fibre', 'Energie'].includes(type)) {
            countQuery += ' AND type = ?';
            dataQuery += ' AND type = ?';
            queryParams.push(type);
        }

        if (status && status !== 'all') {
            countQuery += ' AND status = ?';
            dataQuery += ' AND status = ?';
            queryParams.push(status);
        }

        if (search) {
            const searchTerm = `%${search}%`;
            const searchClause = ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
            countQuery += searchClause;
            dataQuery += searchClause;

            // We need to push search term 3 times
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        dataQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

        // Get total count (Running query with same params)
        const [countResult] = await pool.query(countQuery, queryParams);
        const total = countResult[0].total;

        // Get paginated data (Running query with params + limit/offset)
        const [rows] = await pool.query(dataQuery, [...queryParams, limit, offset]);

        // Helper to sanitize paths (fix Windows backslashes and absolute paths)
        const sanitizePath = (p) => {
            if (!p) return null;
            // Get just the filename (handle both / and \ separators)
            return p.split(/[/\\]/).pop();
        };

        const sanitizedRows = rows.map(row => ({
            ...row,
            id_card_front_path: sanitizePath(row.id_card_front_path),
            id_card_back_path: sanitizePath(row.id_card_back_path),
            photo_path: sanitizePath(row.photo_path),
            signature_path: sanitizePath(row.signature_path),
            signed_pdf_path: sanitizePath(row.signed_pdf_path),
            signed_charte_path: sanitizePath(row.signed_charte_path)
        }));

        res.json({
            data: sanitizedRows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Update Status (Admin)
const { sendApprovalEmail, sendRefusalEmail } = require('./emailService');

// ... (existing code)

// 3. Update Status (Admin)
app.patch('/api/submissions/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, motif } = req.body;

        if (!['En Cours', 'Approuvé', 'Refusé'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Fetch user details for email (including manager and HR emails)
        const [rows] = await pool.query('SELECT email, full_name, status, manager_email, hr_email FROM accreditations WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        const user = rows[0];
        const oldStatus = user.status;

        await pool.execute('UPDATE accreditations SET status = ? WHERE id = ?', [status, id]);

        // Send email notification if status changed
        if (oldStatus !== status) {
            // Prepare CC list (Manager + HR)
            const ccList = [user.manager_email, user.hr_email].filter(email => email && email.trim() !== '');

            if (status === 'Approuvé') {
                await sendApprovalEmail(user.email, user.full_name, ccList);
            } else if (status === 'Refusé') {
                await sendRefusalEmail(user.email, user.full_name, motif, ccList);
            }
        }

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
            submission.signed_pdf_path,
            submission.signed_charte_path
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

// 4.5 Bulk Delete by Type (Admin)
app.delete('/api/submissions/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { password } = req.body;

        // Security Check
        if (password !== '03071982') {
            return res.status(403).json({ error: 'Mot de passe incorrect' });
        }

        // Validation
        if (!['Fibre', 'Energie'].includes(type)) {
            return res.status(400).json({ error: 'Invalid type' });
        }

        // Get all files to delete first
        const [rows] = await pool.query('SELECT * FROM accreditations WHERE type = ?', [type]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No submissions found for this type' });
        }

        // Delete files
        rows.forEach(submission => {
            const filePaths = [
                submission.id_card_front_path,
                submission.id_card_back_path,
                submission.photo_path,
                submission.signature_path,
                submission.signed_pdf_path,
                submission.signed_charte_path
            ].filter(Boolean);

            filePaths.forEach(filePath => {
                const fullPath = path.join(__dirname, '../uploads', filePath);
                if (fs.existsSync(fullPath)) {
                    // Use try-catch for individual file deletion to not break the loop
                    try {
                        fs.unlinkSync(fullPath);
                    } catch (err) {
                        console.warn(`Could not delete file: ${fullPath}`);
                    }
                }
            });
        });

        // Delete from database
        await pool.execute('DELETE FROM accreditations WHERE type = ?', [type]);

        res.json({ message: `All ${type} submissions and files have been deleted.` });

    } catch (error) {
        console.error('Error in bulk delete:', error);
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
            'Test fibre effectué', 'Nom du mandataire', 'Conditions acceptées',
            'id_card_front_path', 'id_card_back_path', 'photo_path', 'signature_path', 'signed_pdf_path', 'signed_charte_path'
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
                row.fiber_test_done ? 'Oui' : 'Non',
                `"${row.proxy_name || ''}"`,
                row.terms_accepted ? 'Oui' : 'Non',
                row.id_card_front_path || '',
                row.id_card_back_path || '',
                row.photo_path || '',
                row.signature_path || '',
                row.signed_pdf_path || '',
                row.signed_charte_path || ''
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
            'Test fibre effectué': row.fiber_test_done ? 'Oui' : 'Non',
            'Nom du mandataire': row.proxy_name || '',
            'Conditions acceptées': row.terms_accepted ? 'Oui' : 'Non',
            'id_card_front_path': row.id_card_front_path || '',
            'id_card_back_path': row.id_card_back_path || '',
            'photo_path': row.photo_path || '',
            'signature_path': row.signature_path || '',
            'signed_pdf_path': row.signed_pdf_path || '',
            'signed_charte_path': row.signed_charte_path || ''
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

// 6. Import from CSV/Excel (Admin)
const importUpload = multer({ storage: multer.memoryStorage() });

app.post('/api/submissions/import', importUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('📂 Processing Import File:', req.file.originalname);

        // Read file from buffer
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 Found ${rawData.length} rows`);

        if (rawData.length === 0) {
            return res.status(400).json({ error: 'File is empty' });
        }

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Mapping function helper
        const getValue = (row, ...keys) => {
            for (const key of keys) {
                if (row[key] !== undefined) return row[key];
            }
            return null;
        };

        for (const [index, row] of rawData.entries()) {
            try {
                // Map fields - support both English from DB and French from Export
                const full_name = getValue(row, 'full_name', 'Nom complet', 'Nom Complet', 'Nom');
                const email = getValue(row, 'email', 'Email', 'E-mail');
                const phone = getValue(row, 'phone', 'Téléphone', 'Telephone', 'Tel');
                const role = getValue(row, 'role', 'Rôle', 'Role');
                const agency_city = getValue(row, 'agency_city', 'Ville Agence', 'Ville');
                const team_code = getValue(row, 'team_code', 'Code équipe', 'Code Equipe');
                const start_date_raw = getValue(row, 'start_date', 'Date de début', 'Date Debut');

                // Determine type: Explicit in CSV > Dashboard Context > Default Fibre
                let type = getValue(row, 'type', 'Type');
                if (!type && req.body.type) {
                    type = req.body.type;
                }
                type = type || 'Fibre';

                // Essential validation
                if (!full_name || !email) {
                    throw new Error('Nom et Email obligatoires');
                }

                // Handle Date Parsing (Excel uses numbers often)
                let start_date = new Date(); // Default to now if invalid
                if (start_date_raw) {
                    if (typeof start_date_raw === 'number') {
                        // Excel serial date
                        start_date = new Date(Math.round((start_date_raw - 25569) * 86400 * 1000));
                    } else {
                        // String date (DD/MM/YYYY or similar)
                        // Try standard constructor first
                        const parsed = new Date(start_date_raw);
                        if (!isNaN(parsed)) {
                            start_date = parsed;
                        } else if (typeof start_date_raw === 'string' && start_date_raw.includes('/')) {
                            // Handle French format DD/MM/YYYY
                            const parts = start_date_raw.split('/');
                            if (parts.length === 3) {
                                start_date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                            }
                        }
                    }
                }

                // Apply GVD Rule
                let hr_email = getValue(row, 'hr_email', 'Email RH') || '';
                if (team_code && String(team_code).toUpperCase() === 'GVD') {
                    hr_email = 'accredgovad@ikmail.com';
                }

                // Sanitize paths from import (fix Windows backslashes and absolute paths)
                const sanitizeImportPath = (p) => {
                    if (!p) return null;
                    // Get just the filename (handle both / and \ separators)
                    return p.split(/[/\\]/).pop();
                };

                const id_card_front_path = sanitizeImportPath(getValue(row, 'id_card_front_path'));
                const id_card_back_path = sanitizeImportPath(getValue(row, 'id_card_back_path'));
                const photo_path = sanitizeImportPath(getValue(row, 'photo_path'));
                const signature_path = sanitizeImportPath(getValue(row, 'signature_path'));
                const signed_pdf_path = sanitizeImportPath(getValue(row, 'signed_pdf_path'));
                const signed_charte_path = sanitizeImportPath(getValue(row, 'signed_charte_path'));

                // Insert into Query
                const query = `
                    INSERT INTO accreditations 
                    (full_name, phone, email, address, role, agency_city, 
                    direct_manager_name, director_name, network_animator_name, 
                    start_date, team_code, manager_email, hr_email, 
                    fiber_test_done, terms_accepted, type, status,
                    id_card_front_path, id_card_back_path, photo_path, signature_path, signed_pdf_path, signed_charte_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const values = [
                    full_name,
                    phone || '',
                    email,
                    getValue(row, 'address', 'Adresse') || '', // Address might be missing
                    role || 'Vendeur',
                    agency_city || '',
                    getValue(row, 'direct_manager_name', 'Manager Direct', 'Manager'),
                    getValue(row, 'director_name', 'Directeur'),
                    getValue(row, 'network_animator_name', 'Animateur Réseau', 'Animateur'),
                    start_date,
                    team_code || '',
                    getValue(row, 'manager_email', 'Email gestionnaire', 'Email Manager') || '',
                    hr_email,
                    0, // fiber_test_done
                    1, // terms_accepted (Assume yes for import?) - keeping it safe or 0
                    ['Fibre', 'Energie'].includes(type) ? type : 'Fibre',
                    'En Cours',
                    id_card_front_path,
                    id_card_back_path,
                    photo_path,
                    signature_path,
                    signed_pdf_path,
                    signed_charte_path
                ];

                // Adjust terms_accepted based on data
                values[14] = getValue(row, 'terms_accepted', 'Conditions acceptées') === 'Oui' ? 1 : 0;
                // Also check fiber test
                values[13] = getValue(row, 'fiber_test_done', 'Test fibre effectué') === 'Oui' ? 1 : 0;


                await pool.execute(query, values);
                successCount++;

            } catch (err) {
                console.error(`Row ${index + 2} error:`, err.message);
                errorCount++;
                errors.push(`Ligne ${index + 2}: ${err.message}`);
            }
        }

        res.json({
            message: 'Import terminé',
            success: successCount,
            failed: errorCount,
            errors: errors
        });

    } catch (error) {
        console.error('Error importing file:', error);
        res.status(500).json({ error: 'Erreur lors de l\'importation', details: error.message });
    }
});

// --- Remote Database Maintenance (Run this to fix schema) ---
app.get('/api/maintenance/migrate', async (req, res) => {
    const results = [];

    // Helper to run query and catch error
    const runMigration = async (label, query) => {
        try {
            await pool.query(query);
            results.push(`✅ ${label}: Success`);
        } catch (err) {
            // Ignore "Duplicate column name" error (code 1060)
            if (err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060) {
                results.push(`ℹ️ ${label}: Already exists`);
            } else {
                results.push(`❌ ${label}: Failed - ${err.message}`);
            }
        }
    };

    try {
        await runMigration('Add type column', "ALTER TABLE accreditations ADD COLUMN type ENUM('Fibre', 'Energie') DEFAULT 'Fibre' AFTER status");
        await runMigration('Add contract_type column', "ALTER TABLE accreditations ADD COLUMN contract_type VARCHAR(50) AFTER role");
        await runMigration('Add signed_charte_path column', "ALTER TABLE accreditations ADD COLUMN signed_charte_path VARCHAR(255) AFTER signed_pdf_path");
        await runMigration('Set fiber_test_done default', "ALTER TABLE accreditations MODIFY COLUMN fiber_test_done BOOLEAN NOT NULL DEFAULT 0");

        res.json({
            message: 'Migration attempted',
            results
        });
    } catch (error) {
        res.status(500).json({ error: 'Migration script error', details: error.message });
    }
});

// Debug Route - REMOVE IN PRODUCTION AFTER FIXING
const debugLogsHandler = (req, res) => {
    res.json({
        lastServerError,
        lastRequestLog,
        env_check: {
            DB_HOST: process.env.DB_HOST ? 'Set' : 'Missing',
            DB_USER: process.env.DB_USER ? 'Set' : 'Missing'
        }
    });
};

app.get('/api/debug-logs', debugLogsHandler);
app.get('/api/debug-log', debugLogsHandler); // Handle typo

// Start Server
// Catch-all route for React (Must be last)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 Global Error Handler Triggered:', err.message);

    // Store error in memory
    lastServerError = {
        timestamp: new Date().toISOString(),
        message: err.message,
        stack: err.stack,
        type: 'GLOBAL_HANDLER'
    };

    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'Multer Error', details: err.message });
    }
    if (err.message === 'Seuls les fichiers PDF sont autorisés !' || err.message.includes('doit être un PDF')) {
        return res.status(400).json({ error: 'Validation Error', details: err.message });
    }
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

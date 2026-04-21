const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Database = require('better-sqlite3');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Make uploads dir if not exists. On Vercel, use /tmp
const isVercel = process.env.VERCEL === '1';
const uploadsDir = isVercel ? '/tmp/images' : path.join(__dirname, 'public/images');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/images', express.static(uploadsDir));
// Also serve the parent images folder statically if requested since original used "images/..."
const parentImagesDir = path.join(__dirname, '../images');
app.use('/original_images', express.static(parentImagesDir));

// Serve the actual frontend static files from the root directory so the Admin panel can preview it securely!
const rootWebDir = path.join(__dirname, '../');
app.use('/', express.static(rootWebDir));


const dbPath = isVercel ? '/tmp/database.sqlite' : 'database.sqlite';
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize DB schema
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        header_color TEXT,
        theme TEXT,
        primary_color TEXT,
        secondary_color TEXT
    );
    CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content_type TEXT,
        content TEXT
    );
    CREATE TABLE IF NOT EXISTS slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_index INTEGER,
        is_active INTEGER DEFAULT 1,
        bg_color TEXT,
        font_family TEXT,
        text_color TEXT
    );
    CREATE TABLE IF NOT EXISTS instructions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slide_id INTEGER,
        text TEXT,
        icon_path TEXT,
        icon_position TEXT DEFAULT 'left',
        FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_index INTEGER DEFAULT 0,
        type TEXT DEFAULT 'text',
        title TEXT,
        content TEXT,
        image_path TEXT,
        font_family TEXT,
        font_size TEXT,
        text_color TEXT,
        bg_color TEXT
    );
`);

// Apply schema migrations (ignore if columns already exist)
const migrations = [
    'ALTER TABLE settings ADD COLUMN clock_format TEXT DEFAULT "12"',
    'ALTER TABLE settings ADD COLUMN clock_font TEXT DEFAULT ""',
    'ALTER TABLE settings ADD COLUMN clock_size TEXT DEFAULT ""',
    'ALTER TABLE settings ADD COLUMN clock_color TEXT DEFAULT ""',
    'ALTER TABLE settings ADD COLUMN header_text TEXT DEFAULT "جوتا جمع کروانے والے بھائیوں کے لیے اہم ہدایات"',
    'ALTER TABLE settings ADD COLUMN header_font TEXT DEFAULT ""',
    'ALTER TABLE settings ADD COLUMN header_size TEXT DEFAULT ""',
    'ALTER TABLE settings ADD COLUMN header_text_color TEXT DEFAULT ""',
    
    'ALTER TABLE instructions ADD COLUMN font_size TEXT DEFAULT ""',
    'ALTER TABLE instructions ADD COLUMN font_family TEXT DEFAULT ""',
    'ALTER TABLE instructions ADD COLUMN is_bold INTEGER DEFAULT 0',
    'ALTER TABLE instructions ADD COLUMN is_italic INTEGER DEFAULT 0',
    'ALTER TABLE instructions ADD COLUMN is_underline INTEGER DEFAULT 0',
    'ALTER TABLE instructions ADD COLUMN alignment TEXT DEFAULT "right"',
    'ALTER TABLE instructions ADD COLUMN text_color TEXT DEFAULT ""',
    'ALTER TABLE instructions ADD COLUMN bg_color TEXT DEFAULT ""',

    'ALTER TABLE settings ADD COLUMN master_point_font TEXT DEFAULT ""',
    'ALTER TABLE settings ADD COLUMN master_point_size TEXT DEFAULT ""',
    'ALTER TABLE settings ADD COLUMN master_point_color TEXT DEFAULT "#ffffff"',
    'ALTER TABLE settings ADD COLUMN master_point_bg TEXT DEFAULT "transparent"',
    'ALTER TABLE settings ADD COLUMN master_point_bold INTEGER DEFAULT 0',
    'ALTER TABLE settings ADD COLUMN master_point_italic INTEGER DEFAULT 0',
    'ALTER TABLE settings ADD COLUMN master_point_underline INTEGER DEFAULT 0',
    'ALTER TABLE settings ADD COLUMN master_point_align TEXT DEFAULT "right"',
    'ALTER TABLE settings ADD COLUMN global_bg_color TEXT DEFAULT ""',
    'ALTER TABLE settings ADD COLUMN global_header_bg TEXT DEFAULT ""',
    'ALTER TABLE settings ADD COLUMN global_footer_bg TEXT DEFAULT ""',
    'ALTER TABLE settings ADD COLUMN global_button_bg TEXT DEFAULT ""',
    'ALTER TABLE settings ADD COLUMN notes_board_active INTEGER DEFAULT 0',
    'ALTER TABLE notes ADD COLUMN width INTEGER DEFAULT 0',
    'ALTER TABLE notes ADD COLUMN height INTEGER DEFAULT 0'
];
for(let sql of migrations) {
    try { db.exec(sql); } catch(e) { /* Column likely exists */ }
}

// Insert default user if none
const adminCheck = db.prepare('SELECT * FROM users LIMIT 1').get();
if (!adminCheck) {
    const hash = bcrypt.hashSync('PakistanA381', 10);
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('shoerack381@gmail.com', hash);
}

// Insert default settings
const settingsCheck = db.prepare('SELECT * FROM settings WHERE id = 1').get();
if (!settingsCheck) {
    db.prepare("INSERT INTO settings (id, header_color, theme, header_text) VALUES (1, 'green', 'light', 'جوتا جمع کروانے والے بھائیوں کے لیے اہم ہدایات')").run();
}

// Seed default points if empty
const slideCount = db.prepare('SELECT COUNT(*) as count FROM slides').get().count;
if (slideCount === 0) {
    const slideResult = db.prepare('INSERT INTO slides (order_index) VALUES (?)').run(0);
    const slideId = slideResult.lastInsertRowid;
    const defaultPoints = [
        'برائے مہربانی اپنا جوتا خود سنبھال کر رکھیں۔',
        'جوتوں کے ساتھ کوئی بھی قیمتی چیز نہ رکھیں بلکہ خود سنبھال کر رکھیں۔',
        'سامان کے غائب ہونے کی صورت میں انتظامیہ ذمہ دار نہ ہوگی۔',
        'جوتے جوڑوں کی شکل میں ترتیب سے رکھیں۔',
        'رش سے بچنے کے لیے قطار بنائیں۔',
        'ٹوکن یا پرچی سنبھال کر رکھیں۔',
        'واپسی پر ٹوکن دکھانا لازمی ہے۔',
        'جوتا وصول کرتے وقت اچھی طرح تسلی فرما لیں۔',
        'انتظامیہ کی ہدایات پر عمل کریں۔',
        'ٹوکن گم ہونے کی صورت میں متبادل ثبوت فراہم کرنا ہوگا۔',
        '24 گھنٹے کے بعد جوتا ہماری ذمہ داری نہ ہوگی۔',
        'لوگوں کے ساتھ بھرپور تعاون کریں۔'
    ];
    const insertPoint = db.prepare('INSERT INTO instructions (slide_id, text, icon_path) VALUES (?, ?, ?)');
    defaultPoints.forEach(p => insertPoint.run(slideId, p, ''));
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, 'secret_key_admin_panel_2026', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Login Route
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    if (bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ username: user.username }, 'secret_key_admin_panel_2026', { expiresIn: '24h' });
        res.json({ token });
    } else {
        res.status(403).json({ error: 'Incorrect password' });
    }
});

// Settings config
app.get('/api/settings', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.json(db.prepare('SELECT * FROM settings WHERE id = 1').get());
});

app.put('/api/settings', authenticateToken, (req, res) => {
    const { 
        header_color, theme, primary_color, secondary_color,
        clock_format, clock_font, clock_size, clock_color,
        header_text, header_font, header_size, header_text_color,
        master_point_font, master_point_size, master_point_color, master_point_bg,
        master_point_bold, master_point_italic, master_point_underline, master_point_align,
        global_bg_color, global_header_bg, global_footer_bg, global_button_bg
    } = req.body;
    
    const stmt = db.prepare(`
        UPDATE settings SET 
            header_color = ?, theme = ?, primary_color = ?, secondary_color = ?,
            clock_format = ?, clock_font = ?, clock_size = ?, clock_color = ?,
            header_text = ?, header_font = ?, header_size = ?, header_text_color = ?,
            master_point_font = ?, master_point_size = ?, master_point_color = ?, master_point_bg = ?,
            master_point_bold = ?, master_point_italic = ?, master_point_underline = ?, master_point_align = ?,
            global_bg_color = ?, global_header_bg = ?, global_footer_bg = ?, global_button_bg = ?
        WHERE id = 1
    `);

    stmt.run(
        header_color, theme, primary_color, secondary_color,
        clock_format || '12', clock_font || '', clock_size || '', clock_color || '',
        header_text || 'جوتا جمع کروانے والے بھائیوں کے لیے اہم ہدایات', header_font || '', header_size || '', header_text_color || '',
        master_point_font || '', master_point_size || '', master_point_color || '#ffffff', master_point_bg || 'transparent',
        master_point_bold || 0, master_point_italic || 0, master_point_underline || 0, master_point_align || 'right',
        global_bg_color || '', global_header_bg || '', global_footer_bg || '', global_button_bg || ''
    );
    res.json({ success: true });
});

// Toggle Notes Board Active/Inactive
app.post('/api/settings/toggle-notes', authenticateToken, (req, res) => {
    const { active } = req.body;
    db.prepare('UPDATE settings SET notes_board_active = ? WHERE id = 1').run(active ? 1 : 0);
    res.json({ success: true, notes_board_active: active ? 1 : 0 });
});

// Slides
app.get('/api/slides', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const slides = db.prepare('SELECT * FROM slides ORDER BY order_index').all();
    for (let s of slides) {
        s.instructions = db.prepare('SELECT * FROM instructions WHERE slide_id = ?').all(s.id);
    }
    res.json(slides);
});

app.post('/api/slides', authenticateToken, (req, res) => {
    const result = db.prepare('INSERT INTO slides (order_index) VALUES (?)').run(req.body.order_index || 0);
    res.json({ id: result.lastInsertRowid });
});

app.post('/api/slides/seed', authenticateToken, (req, res) => {
    let slideId;
    const firstSlide = db.prepare('SELECT * FROM slides ORDER BY order_index LIMIT 1').get();
    
    if (!firstSlide) {
        const slideResult = db.prepare('INSERT INTO slides (order_index) VALUES (?)').run(0);
        slideId = slideResult.lastInsertRowid;
    } else {
        slideId = firstSlide.id;
    }

    const pointCount = db.prepare('SELECT COUNT(*) as count FROM instructions WHERE slide_id = ?').get(slideId).count;
    
    if (pointCount === 0) {
        const defaultPoints = [
            'برائے مہربانی اپنا جوتا خود سنبھال کر رکھیں۔',
            'جوتوں کے ساتھ کوئی بھی قیمتی چیز نہ رکھیں بلکہ خود سنبھال کر رکھیں۔',
            'سامان کے غائب ہونے کی صورت میں انتظامیہ ذمہ دار نہ ہوگی۔',
            'جوتے جوڑوں کی شکل میں ترتیب سے رکھیں۔',
            'رش سے بچنے کے لیے قطار بنائیں۔',
            'ٹوکن یا پرچی سنبھال کر رکھیں۔',
            'واپسی پر ٹوکن دکھانا لازمی ہے۔',
            'جوتا وصول کرتے وقت اچھی طرح تسلی فرما لیں۔',
            'انتظامیہ کی ہدایات پر عمل کریں۔',
            'ٹوکن گم ہونے کی صورت میں متبادل ثبوت فراہم کرنا ہوگا۔',
            '24 گھنٹے کے بعد جوتا ہماری ذمہ داری نہ ہوگی۔',
            'لوگوں کے ساتھ بھرپور تعاون کریں۔'
        ];
        const insertPoint = db.prepare('INSERT INTO instructions (slide_id, text, icon_path) VALUES (?, ?, ?)');
        defaultPoints.forEach(p => insertPoint.run(slideId, p, ''));
        res.json({ success: true, message: 'Seeded default points into Layer 1' });
    } else {
        res.status(400).json({ error: 'Layer 1 already has points. Cannot seed.' });
    }
});

app.put('/api/slides/:id', authenticateToken, (req, res) => {
    const { order_index, is_active, bg_color, font_family, text_color } = req.body;
    db.prepare('UPDATE slides SET order_index = ?, is_active = ?, bg_color = ?, font_family = ?, text_color = ? WHERE id = ?')
        .run(order_index, is_active, bg_color, font_family, text_color, req.params.id);
    res.json({ success: true });
});

app.delete('/api/slides/:id', authenticateToken, (req, res) => {
    db.prepare('DELETE FROM slides WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Instructions (inside slides)
app.post('/api/instructions', authenticateToken, (req, res) => {
    const { slide_id, text, icon_path, icon_position } = req.body;
    const result = db.prepare('INSERT INTO instructions (slide_id, text, icon_path, icon_position) VALUES (?, ?, ?, ?)')
      .run(slide_id, text, icon_path, icon_position || 'left');
    res.json({ id: result.lastInsertRowid, success: true });
});

app.put('/api/instructions/:id', authenticateToken, (req, res) => {
    const { 
        text, icon_path, icon_position,
        font_size, font_family, is_bold, is_italic, is_underline, alignment, text_color, bg_color
    } = req.body;
    db.prepare(`
        UPDATE instructions SET 
            text = ?, icon_path = ?, icon_position = ?,
            font_size = ?, font_family = ?, is_bold = ?, is_italic = ?, is_underline = ?, 
            alignment = ?, text_color = ?, bg_color = ?
        WHERE id = ?
    `).run(
        text, icon_path, icon_position,
        font_size || '', font_family || '', is_bold || 0, is_italic || 0, is_underline || 0,
        alignment || 'right', text_color || '', bg_color || '',
        req.params.id
    );
    res.json({ success: true });
});
app.delete('/api/instructions/:id', authenticateToken, (req, res) => {
    db.prepare('DELETE FROM instructions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Notes Board
app.get('/api/notes', (req, res) => {
    const notes = db.prepare('SELECT * FROM notes ORDER BY order_index ASC, id DESC').all();
    res.json(notes);
});

app.post('/api/notes', authenticateToken, (req, res) => {
    const { type, title, content, image_path, font_family, font_size, text_color, bg_color } = req.body;
    const result = db.prepare(`
        INSERT INTO notes (type, title, content, image_path, font_family, font_size, text_color, bg_color, width, height) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        type || 'text', title || 'New Note', content || '', image_path || '', 
        font_family || '', font_size || '', text_color || '', bg_color || '',
        req.body.width || 0, req.body.height || 0
    );
    res.json({ id: result.lastInsertRowid });
});

app.put('/api/notes/:id', authenticateToken, (req, res) => {
    const { 
        order_index, type, title, content, image_path, 
        font_family, font_size, text_color, bg_color, 
        width, height 
    } = req.body;
    db.prepare(`
        UPDATE notes SET 
            order_index = ?, type = ?, title = ?, content = ?, image_path = ?,
            font_family = ?, font_size = ?, text_color = ?, bg_color = ?,
            width = ?, height = ?
        WHERE id = ?
    `).run(
        order_index || 0, type || 'text', title || '', content || '', image_path || '',
        font_family || '', font_size || '', text_color || '', bg_color || '',
        width || 0, height || 0,
        req.params.id
    );
    res.json({ success: true });
});

app.delete('/api/notes/:id', authenticateToken, (req, res) => {
    db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// File upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, 'upl_' + Date.now() + ext)
    }
});
const upload = multer({ storage: storage });

app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    try {
        const base64 = fs.readFileSync(req.file.path, { encoding: 'base64' });
        const mime = req.file.mimetype;
        const dataUrl = `data:${mime};base64,${base64}`;
        // Clean up tmp file
        fs.unlinkSync(req.file.path);
        res.json({ path: dataUrl });
    } catch (err) {
        res.status(500).json({ error: 'Failed to process image' });
    }
});

app.get('/api/backup-db', (req, res) => {
    res.download(dbPath, 'database_backup.sqlite');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('Backend running on http://localhost:' + PORT);
});

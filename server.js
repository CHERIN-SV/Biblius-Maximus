const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// 📂 Base assets folder
const assetsPath = path.join(__dirname, 'public', 'assets');
if (!fs.existsSync(assetsPath)) fs.mkdirSync(assetsPath, { recursive: true });

/* ✅ Create category folder */
app.post('/create-category', (req, res) => {
  const { categoryName } = req.body;
  if (!categoryName) return res.status(400).json({ error: 'Category name required' });

  const categoryPath = path.join(assetsPath, categoryName);
  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
    console.log('📂 Created folder:', categoryPath);
  }

  res.json({ message: 'Category folder ready', path: categoryPath });
});

/* ✅ Multer storage setup */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || req.query.category;
    if (!category) return cb(new Error('Category missing'), '');

    const uploadPath = path.join(assetsPath, category);
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

/* ✅ Upload book image */
app.post('/upload-book-image', upload.fields([{ name: 'file' }, { name: 'category' }]), (req, res) => {
  const category = req.query.category;
  if (!req.file && !req.files?.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!category) return res.status(400).json({ error: 'No category provided' });

  const file = req.file || req.files.file[0];
  const filePath = `assets/${category}/${file.filename}`;

  console.log('✅ File uploaded:', filePath);
  res.json({ message: 'File uploaded', filePath });
});

/* ✅ Serve static assets */
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

/* ✅ Start server */
app.listen(3000, () => console.log('🚀 Server running at http://localhost:3000'));

const express    = require('express');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const cloudinary = require('cloudinary').v2;
const db         = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxu7syqi9',
  api_key:    process.env.CLOUDINARY_API_KEY    || '548712824149351',
  api_secret: process.env.CLOUDINARY_API_SECRET || '_RRUizDN57in8kTBL1ygro7npx4',
});

// Multer lưu tạm vào memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50*1024*1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.pdf','.doc','.docx','.ppt','.pptx','.xls','.xlsx','.txt','.zip','.rar'];
    ok.includes(path.extname(file.originalname).toLowerCase()) ? cb(null,true) : cb(new Error('Định dạng không hỗ trợ'));
  }
});

function getFiletype(ext) {
  ext = ext.replace('.','').toLowerCase();
  if (ext==='pdf') return 'pdf';
  if (['doc','docx'].includes(ext)) return 'doc';
  if (['ppt','pptx'].includes(ext)) return 'ppt';
  if (['xls','xlsx'].includes(ext)) return 'xls';
  if (['zip','rar'].includes(ext))  return 'zip';
  return 'txt';
}

// Upload lên Cloudinary
async function uploadToCloudinary(buffer, originalname) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(originalname).toLowerCase();
    const publicId = `tailieu/${Date.now()}-${Math.round(Math.random()*1e6)}`;
    cloudinary.uploader.upload_stream(
      { resource_type: 'raw', public_id: publicId, format: ext.replace('.','') },
      (err, result) => err ? reject(err) : resolve(result)
    ).end(buffer);
  });
}

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const { subject, q, page=1, limit=50 } = req.query;
    let sql = 'SELECT d.*,u.username as uploader_name FROM documents d JOIN users u ON d.uploader_id=u.id WHERE 1=1';
    let cntSql = 'SELECT COUNT(*) as cnt FROM documents d WHERE 1=1';
    const params=[], cntP=[];
    if (subject && subject!=='all') { sql+=' AND d.subject=?'; cntSql+=' AND subject=?'; params.push(subject); cntP.push(subject); }
    if (q) { sql+=' AND (d.title LIKE ? OR d.subject LIKE ?)'; cntSql+=' AND (title LIKE ? OR subject LIKE ?)'; params.push(`%${q}%`,`%${q}%`); cntP.push(`%${q}%`,`%${q}%`); }
    sql += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (page-1)*limit);
    const [docs, cnt] = await Promise.all([db.all2(sql,params), db.get2(cntSql,cntP)]);
    res.json({ docs, total: cnt.cnt, page: Number(page) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/documents/:id/download
router.get('/:id/download', async (req, res) => {
  try {
    const doc = await db.get2('SELECT * FROM documents WHERE id=?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Không tìm thấy' });
    await db.run2('UPDATE documents SET downloads=downloads+1 WHERE id=?', [doc.id]);

    const token = req.cookies?.token;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');
        const decoded = jwt.verify(token, JWT_SECRET);
        await db.run2('INSERT INTO download_history (user_id,doc_id) VALUES (?,?)', [decoded.id, doc.id]);
      } catch {}
    }

    // Nếu có cloudinary_url thì redirect
    if (doc.cloudinary_url) return res.redirect(doc.cloudinary_url);

    // Fallback: file local
    const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
    const fp = path.join(UPLOAD_DIR, doc.filename);
    if (fs.existsSync(fp)) return res.download(fp, doc.original_name);
    res.status(404).json({ error: 'File không tồn tại' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.get2('SELECT d.*,u.username as uploader_name FROM documents d JOIN users u ON d.uploader_id=u.id WHERE d.id=?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(doc);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/documents — Upload lên Cloudinary
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file' });
    const { title, subject } = req.body;
    if (!title)   return res.status(400).json({ error: 'Vui lòng nhập tên tài liệu' });
    if (!subject) return res.status(400).json({ error: 'Vui lòng chọn môn học' });

    // Upload lên Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    const filetype = getFiletype(path.extname(req.file.originalname));
    const r = await db.run2(
      'INSERT INTO documents (title,subject,filename,original_name,size,filetype,uploader_id,cloudinary_url,cloudinary_id) VALUES (?,?,?,?,?,?,?,?,?)',
      [title, subject, result.public_id, req.file.originalname, req.file.size, filetype, req.user.id, result.secure_url, result.public_id]
    );
    res.json({ success: true, id: r.lastID });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/documents/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await db.get2('SELECT * FROM documents WHERE id=?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Không tìm thấy' });
    if (req.user.role !== 'admin' && doc.uploader_id !== req.user.id)
      return res.status(403).json({ error: 'Không có quyền' });

    // Xóa trên Cloudinary
    if (doc.cloudinary_id) {
      await cloudinary.uploader.destroy(doc.cloudinary_id, { resource_type: 'raw' }).catch(()=>{});
    }
    // Xóa file local nếu có
    const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
    const fp = path.join(UPLOAD_DIR, doc.filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);

    await db.run2('DELETE FROM download_history WHERE doc_id=?', [doc.id]);
    await db.run2('DELETE FROM documents WHERE id=?', [doc.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Admin: users
router.get('/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await db.all2(`
      SELECT u.id,u.username,u.full_name,u.role,u.created_at, COUNT(d.id) as doc_count
      FROM users u LEFT JOIN documents d ON d.uploader_id=u.id
      GROUP BY u.id ORDER BY u.created_at DESC`);
    res.json(users);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/admin/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    if (req.params.id == req.user.id) return res.status(400).json({ error: 'Không thể xóa chính mình' });
    await db.run2('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
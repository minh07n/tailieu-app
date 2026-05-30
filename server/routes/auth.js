const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();
const COOKIE_OPTS = { httpOnly: true, maxAge: 7*24*60*60*1000, sameSite: 'lax' };

router.post('/register', async (req, res) => {
  try {
    const { username, password, full_name } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Thiếu thông tin' });
    if (username.length < 4)    return res.status(400).json({ error: 'Tên đăng nhập tối thiểu 4 ký tự' });
    if (password.length < 6)    return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' });

    const exists = await db.get2('SELECT id FROM users WHERE username=?', [username]);
    if (exists) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });

    const hash = bcrypt.hashSync(password, 10);
    const r    = await db.run2("INSERT INTO users (username,password,role,full_name) VALUES (?,?,'user',?)", [username, hash, full_name||'']);
    const token = jwt.sign({ id: r.lastID, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTS);
    res.json({ success: true, user: { id: r.lastID, username, role: 'user', full_name: full_name||'' } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Thiếu thông tin' });
    const user = await db.get2('SELECT * FROM users WHERE username=?', [username]);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTS);
    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name||'' } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/logout', (req, res) => { res.clearCookie('token'); res.json({ success: true }); });

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.get2('SELECT id,username,full_name,email,phone,bio,avatar_url,role,created_at FROM users WHERE id=?', [req.user.id]);
    res.json(user);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { full_name, email, phone, bio, avatar_url } = req.body;
    await db.run2('UPDATE users SET full_name=?, email=?, phone=?, bio=?, avatar_url=? WHERE id=?',
      [full_name||'', email||'', phone||'', bio||'', avatar_url||'', req.user.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) return res.status(400).json({ error: 'Thiếu thông tin' });
    if (new_password.length < 6) return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' });
    
    const user = await db.get2('SELECT password FROM users WHERE id=?', [req.user.id]);
    if (!bcrypt.compareSync(old_password, user.password))
      return res.status(401).json({ error: 'Mật khẩu hiện tại không chính xác' });
    
    const hash = bcrypt.hashSync(new_password, 10);
    await db.run2('UPDATE users SET password=? WHERE id=?', [hash, req.user.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/profile/stats', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const [uploaded, totalDl, history] = await Promise.all([
      db.get2('SELECT COUNT(*) as cnt, COALESCE(SUM(downloads),0) as total_dl FROM documents WHERE uploader_id=?', [uid]),
      db.get2('SELECT COUNT(*) as cnt FROM download_history WHERE user_id=?', [uid]),
      db.all2(`SELECT d.title, d.subject, d.filetype, dh.downloaded_at
              FROM download_history dh JOIN documents d ON dh.doc_id=d.id
              WHERE dh.user_id=? ORDER BY dh.downloaded_at DESC LIMIT 10`, [uid]),
    ]);
    const myDocs = await db.all2(
      'SELECT id,title,subject,filetype,size,downloads,created_at FROM documents WHERE uploader_id=? ORDER BY created_at DESC',
      [uid]
    );
    res.json({
      uploaded: uploaded.cnt,
      my_docs_total_downloads: uploaded.total_dl,
      downloaded: totalDl.cnt,
      recent_downloads: history,
      my_docs: myDocs,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
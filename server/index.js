const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const path         = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));

const db = require('./db');
app.get('/api/stats', async (req, res) => {
  try {
    const [docs, users, subjects, dl] = await Promise.all([
      db.get2('SELECT COUNT(*) as cnt FROM documents'),
      db.get2('SELECT COUNT(*) as cnt FROM users'),
      db.get2('SELECT COUNT(DISTINCT subject) as cnt FROM documents'),
      db.get2('SELECT SUM(downloads) as total FROM documents'),
    ]);
    res.json({ docs: docs.cnt, users: users.cnt, subjects: subjects.cnt, downloads: dl.total||0 });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Lỗi server' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📁 Database: data/tailieu.db`);
  console.log(`📂 Uploads:  public/uploads/\n`);
});

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

app.get('/api/stats/overview', async (req, res) => {
  try {
    const [docs, users, subjects, downloads, daily] = await Promise.all([
      db.get2('SELECT COUNT(*) as cnt FROM documents'),
      db.get2('SELECT COUNT(*) as cnt FROM users'),
      db.get2('SELECT COUNT(DISTINCT subject) as cnt FROM documents'),
      db.get2('SELECT COALESCE(SUM(downloads),0) as total FROM documents'),
      db.all2(`
        SELECT DATE(downloaded_at) as day, COUNT(*) as cnt
        FROM download_history
        WHERE downloaded_at >= DATE('now','localtime','-13 days')
        GROUP BY day
        ORDER BY day ASC
      `),
    ]);

    const subjectRows = await db.all2(`
      SELECT subject, COALESCE(SUM(downloads),0) as total
      FROM documents
      GROUP BY subject ORDER BY total DESC LIMIT 5
    `);

    const topDocs = await db.all2(`
      SELECT d.id, d.title, d.subject, d.downloads, u.username as uploader_name
      FROM documents d JOIN users u ON d.uploader_id=u.id
      ORDER BY d.downloads DESC LIMIT 5
    `);

    const dayMap = {};
    daily.forEach(row => { dayMap[row.day] = row.cnt; });

    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0,10);
      days.push({ date: iso, count: dayMap[iso] || 0 });
    }

    const prevWeek = days.slice(0, 7);
    const lastWeek = days.slice(7, 14);
    const prev7Total = prevWeek.reduce((sum, item) => sum + item.count, 0);
    const last7Total = lastWeek.reduce((sum, item) => sum + item.count, 0);
    const delta = last7Total - prev7Total;
    const pct = prev7Total > 0 ? Math.round((delta / prev7Total) * 100) : null;

    res.json({
      docs: docs.cnt,
      users: users.cnt,
      subjects: subjects.cnt,
      downloads: downloads.total || 0,
      downloads_last_7_days: last7Total,
      downloads_prev_7_days: prev7Total,
      downloads_week_change: delta,
      downloads_week_change_pct: pct,
      downloads_trend: lastWeek,
      top_subjects: subjectRows,
      top_downloads: topDocs,
    });
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

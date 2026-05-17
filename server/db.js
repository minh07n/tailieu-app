const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');
const bcrypt  = require('bcryptjs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(path.join(dataDir, 'tailieu.db'));

db.run2 = (sql, p=[]) => new Promise((res,rej) => db.run(sql,p,function(e){e?rej(e):res(this)}));
db.get2 = (sql, p=[]) => new Promise((res,rej) => db.get(sql,p,(e,r)=>e?rej(e):res(r)));
db.all2 = (sql, p=[]) => new Promise((res,rej) => db.all(sql,p,(e,r)=>e?rej(e):res(r)));

const SEED_USERS = [
  'nguyenvana','tranthib','levanc','phamthid','hoangvane','vuthif','dinhvang','buithih'
];

const SEED_DOCS = [
  { title:'Giáo trình Lập Trình Web - HTML CSS JavaScript', subject:'CNTT', filetype:'pdf', size:4520000, downloads:342 },
  { title:'Tài liệu ReactJS cơ bản đến nâng cao', subject:'CNTT', filetype:'pdf', size:3100000, downloads:289 },
  { title:'Bài giảng Cơ sở dữ liệu - SQL Server', subject:'CNTT', filetype:'pdf', size:5800000, downloads:415 },
  { title:'Đề cương ôn tập Lập Trình Hướng Đối Tượng Java', subject:'CNTT', filetype:'doc', size:980000, downloads:521 },
  { title:'Bài tập Python từ cơ bản đến nâng cao có lời giải', subject:'CNTT', filetype:'pdf', size:2300000, downloads:634 },
  { title:'Tài liệu NodeJS + Express REST API', subject:'CNTT', filetype:'pdf', size:1800000, downloads:256 },
  { title:'Giáo trình Toán Cao Cấp A1', subject:'Toán học', filetype:'pdf', size:8900000, downloads:487 },
  { title:'Bài tập Giải tích có lời giải chi tiết', subject:'Toán học', filetype:'pdf', size:6700000, downloads:392 },
  { title:'Đề thi Toán Rời Rạc các năm kèm đáp án', subject:'Toán học', filetype:'pdf', size:2100000, downloads:318 },
  { title:'Tài liệu Xác suất thống kê ứng dụng', subject:'Toán học', filetype:'pdf', size:4400000, downloads:276 },
  { title:'Giáo trình Vật Lý Đại Cương 1', subject:'Vật lý', filetype:'pdf', size:9200000, downloads:356 },
  { title:'Đề thi Vật Lý Đại Cương các học kỳ', subject:'Vật lý', filetype:'pdf', size:1900000, downloads:445 },
  { title:'Giáo trình Hóa Đại Cương - Liên kết hóa học', subject:'Hóa học', filetype:'pdf', size:7600000, downloads:223 },
  { title:'Bài tập Hóa Hữu Cơ có đáp án', subject:'Hóa học', filetype:'pdf', size:4100000, downloads:187 },
  { title:'Tài liệu TOEIC 900+ - Listening & Reading', subject:'Ngoại ngữ', filetype:'pdf', size:15600000, downloads:712 },
  { title:'Grammar in Use - Ngữ pháp tiếng Anh đầy đủ', subject:'Ngoại ngữ', filetype:'pdf', size:11200000, downloads:589 },
  { title:'1000 từ vựng tiếng Anh chuyên ngành CNTT', subject:'Ngoại ngữ', filetype:'doc', size:890000, downloads:334 },
  { title:'Đề thi tiếng Anh B1 các trường đại học', subject:'Ngoại ngữ', filetype:'pdf', size:3200000, downloads:478 },
  { title:'Giáo trình Kinh tế Vi mô - Cung cầu thị trường', subject:'Kinh tế', filetype:'pdf', size:6800000, downloads:264 },
  { title:'Tài liệu Kế toán Tài chính cơ bản', subject:'Kinh tế', filetype:'pdf', size:5300000, downloads:198 },
  { title:'Tài liệu Triết học Mác-Lênin đầy đủ', subject:'Chính trị', filetype:'pdf', size:4200000, downloads:389 },
  { title:'Đề cương Tư tưởng Hồ Chí Minh ôn thi', subject:'Chính trị', filetype:'doc', size:1100000, downloads:512 },
  { title:'Câu hỏi trắc nghiệm Đường lối Cách mạng', subject:'Chính trị', filetype:'pdf', size:2400000, downloads:445 },
  { title:'Giáo trình Văn học Việt Nam hiện đại', subject:'Văn học', filetype:'pdf', size:7100000, downloads:156 },
  { title:'Phân tích tác phẩm văn học lớp 12 đầy đủ', subject:'Văn học', filetype:'doc', size:2800000, downloads:234 },
];

const DATES = [
  '2025-01-15','2025-02-03','2025-02-18','2025-03-07','2025-03-22',
  '2025-04-01','2025-04-14','2025-04-28','2025-05-05','2025-05-10',
  '2025-06-02','2025-06-19','2025-07-08','2025-08-12','2025-09-05',
];

async function seedData() {
  const UPLOAD_DIR = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const userIds = [];
  for (const username of SEED_USERS) {
    let row = await db.get2('SELECT id FROM users WHERE username=?', [username]);
    if (!row) {
      const hash = bcrypt.hashSync('123456', 10);
      const r = await db.run2("INSERT INTO users (username,password,role,full_name) VALUES (?,?,'user',?)", [username, hash, username]);
      userIds.push(r.lastID);
    } else {
      userIds.push(row.id);
    }
  }

  for (let i = 0; i < SEED_DOCS.length; i++) {
    const d = SEED_DOCS[i];
    const exists = await db.get2('SELECT id FROM documents WHERE title=?', [d.title]);
    if (exists) continue;
    const ext = d.filetype === 'doc' ? 'docx' : d.filetype;
    const filename = `seed-${Date.now()}-${i}.${ext}`;
    const fp = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(fp, `[Tài liệu mẫu: ${d.title}]`);
    const uploaderId = userIds[i % userIds.length];
    const createdAt  = DATES[i % DATES.length] + ' 09:00:00';
    await db.run2(
      'INSERT INTO documents (title,subject,filename,original_name,size,filetype,uploader_id,downloads,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [d.title, d.subject, filename, `${d.title}.${ext}`, d.size, d.filetype, uploaderId, d.downloads, createdAt]
    );
  }
  console.log('✅ Seed data hoàn tất!');
}

async function init() {
  await db.run2(`PRAGMA foreign_keys = ON`);
  await db.run2(`PRAGMA journal_mode = WAL`);

  await db.run2(`CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    UNIQUE NOT NULL,
    full_name   TEXT    DEFAULT '',
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'user',
    created_at  TEXT    DEFAULT (datetime('now','localtime'))
  )`);

  await db.run2(`CREATE TABLE IF NOT EXISTS documents (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    title          TEXT    NOT NULL,
    subject        TEXT    NOT NULL,
    filename       TEXT    NOT NULL,
    original_name  TEXT    NOT NULL,
    size           INTEGER NOT NULL,
    filetype       TEXT    NOT NULL,
    uploader_id    INTEGER NOT NULL,
    downloads      INTEGER DEFAULT 0,
    cloudinary_url TEXT    DEFAULT NULL,
    cloudinary_id  TEXT    DEFAULT NULL,
    created_at     TEXT    DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (uploader_id) REFERENCES users(id)
  )`);

  await db.run2(`CREATE TABLE IF NOT EXISTS download_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    doc_id        INTEGER NOT NULL,
    downloaded_at TEXT    DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (doc_id)  REFERENCES documents(id)
  )`);

  await db.run2(`ALTER TABLE users ADD COLUMN full_name TEXT DEFAULT ''`).catch(()=>{});
  await db.run2(`ALTER TABLE documents ADD COLUMN cloudinary_url TEXT DEFAULT NULL`).catch(()=>{});
  await db.run2(`ALTER TABLE documents ADD COLUMN cloudinary_id TEXT DEFAULT NULL`).catch(()=>{});

  const admin = await db.get2('SELECT id FROM users WHERE username=?', ['admin']);
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.run2("INSERT INTO users (username,password,role,full_name) VALUES (?,?,'admin','Quản Trị Viên')", ['admin', hash]);
    console.log('✅ Đã tạo tài khoản admin (admin / admin123)');
  }

  // Tự động seed nếu chưa có tài liệu
  const docCount = await db.get2('SELECT COUNT(*) as cnt FROM documents');
  if (docCount.cnt === 0) await seedData();
}

init().catch(console.error);
module.exports = db;
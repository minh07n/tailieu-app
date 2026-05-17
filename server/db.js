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

  // Migrate: thêm cột nếu chưa có
  await db.run2(`ALTER TABLE users ADD COLUMN full_name TEXT DEFAULT ''`).catch(()=>{});
  await db.run2(`ALTER TABLE documents ADD COLUMN cloudinary_url TEXT DEFAULT NULL`).catch(()=>{});
  await db.run2(`ALTER TABLE documents ADD COLUMN cloudinary_id TEXT DEFAULT NULL`).catch(()=>{});

  const admin = await db.get2('SELECT id FROM users WHERE username=?', ['admin']);
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.run2("INSERT INTO users (username,password,role,full_name) VALUES (?,?,'admin','Quản Trị Viên')", ['admin', hash]);
    console.log('✅ Đã tạo tài khoản admin (admin / admin123)');
  }
}

init().catch(console.error);
module.exports = db;
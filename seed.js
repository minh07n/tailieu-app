// seed.js — Chạy 1 lần để thêm data mẫu: node seed.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt  = require('bcryptjs');
const path    = require('path');
const fs      = require('fs');

const DB_PATH = path.join(__dirname, 'data/tailieu.db');
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync('data');

const db = new sqlite3.Database(DB_PATH);
db.run2 = (sql, p=[]) => new Promise((res,rej) => db.run(sql,p,function(e){e?rej(e):res(this)}));
db.get2 = (sql, p=[]) => new Promise((res,rej) => db.get(sql,p,(e,r)=>e?rej(e):res(r)));

const USERS = [
  { username: 'nguyenvana',   password: '123456', role: 'user' },
  { username: 'tranthib',     password: '123456', role: 'user' },
  { username: 'levanc',       password: '123456', role: 'user' },
  { username: 'phamthid',     password: '123456', role: 'user' },
  { username: 'hoangvane',    password: '123456', role: 'user' },
  { username: 'vuthif',       password: '123456', role: 'user' },
  { username: 'dinhvang',     password: '123456', role: 'user' },
  { username: 'buithih',      password: '123456', role: 'user' },
  { username: 'ngothii',      password: '123456', role: 'user' },
  { username: 'lydangj',      password: '123456', role: 'user' },
];

const DOCS = [
  // CNTT
  { title: 'Giáo trình Lập Trình Web - HTML CSS JavaScript', subject: 'CNTT', filetype: 'pdf', size: 4520000, downloads: 342 },
  { title: 'Tài liệu ReactJS cơ bản đến nâng cao', subject: 'CNTT', filetype: 'pdf', size: 3100000, downloads: 289 },
  { title: 'Bài giảng Cơ sở dữ liệu - SQL Server', subject: 'CNTT', filetype: 'pdf', size: 5800000, downloads: 415 },
  { title: 'Lab thực hành Mạng máy tính - Cisco Packet Tracer', subject: 'CNTT', filetype: 'zip', size: 12400000, downloads: 198 },
  { title: 'Đề cương ôn tập Lập Trình Hướng Đối Tượng Java', subject: 'CNTT', filetype: 'docx', size: 980000, downloads: 521 },
  { title: 'Slide bài giảng Hệ điều hành - Process & Thread', subject: 'CNTT', filetype: 'ppt', size: 7200000, downloads: 177 },
  { title: 'Bài tập Python từ cơ bản đến nâng cao có lời giải', subject: 'CNTT', filetype: 'pdf', size: 2300000, downloads: 634 },
  { title: 'Tài liệu NodeJS + Express REST API', subject: 'CNTT', filetype: 'pdf', size: 1800000, downloads: 256 },

  // Toán học
  { title: 'Giáo trình Toán Cao Cấp A1 - Đại học', subject: 'Toán học', filetype: 'pdf', size: 8900000, downloads: 487 },
  { title: 'Bài tập Giải tích có lời giải chi tiết', subject: 'Toán học', filetype: 'pdf', size: 6700000, downloads: 392 },
  { title: 'Đề thi Toán Rời Rạc các năm kèm đáp án', subject: 'Toán học', filetype: 'pdf', size: 2100000, downloads: 318 },
  { title: 'Tài liệu Xác suất thống kê ứng dụng', subject: 'Toán học', filetype: 'pdf', size: 4400000, downloads: 276 },
  { title: 'Slide Đại số tuyến tính - Ma trận & Định thức', subject: 'Toán học', filetype: 'ppt', size: 5500000, downloads: 203 },

  // Vật lý
  { title: 'Giáo trình Vật Lý Đại Cương 1', subject: 'Vật lý', filetype: 'pdf', size: 9200000, downloads: 356 },
  { title: 'Bài tập Vật Lý có lời giải - Cơ học & Nhiệt học', subject: 'Vật lý', filetype: 'pdf', size: 3800000, downloads: 291 },
  { title: 'Đề thi Vật Lý Đại Cương các học kỳ', subject: 'Vật lý', filetype: 'pdf', size: 1900000, downloads: 445 },

  // Hóa học
  { title: 'Giáo trình Hóa Đại Cương - Liên kết hóa học', subject: 'Hóa học', filetype: 'pdf', size: 7600000, downloads: 223 },
  { title: 'Bài tập Hóa Hữu Cơ có đáp án', subject: 'Hóa học', filetype: 'pdf', size: 4100000, downloads: 187 },

  // Ngoại ngữ
  { title: 'Tài liệu TOEIC 900+ - Listening & Reading', subject: 'Ngoại ngữ', filetype: 'pdf', size: 15600000, downloads: 712 },
  { title: 'Grammar in Use - Ngữ pháp tiếng Anh đầy đủ', subject: 'Ngoại ngữ', filetype: 'pdf', size: 11200000, downloads: 589 },
  { title: '1000 từ vựng tiếng Anh chuyên ngành CNTT', subject: 'Ngoại ngữ', filetype: 'docx', size: 890000, downloads: 334 },
  { title: 'Đề thi tiếng Anh B1 các trường đại học', subject: 'Ngoại ngữ', filetype: 'pdf', size: 3200000, downloads: 478 },

  // Kinh tế
  { title: 'Giáo trình Kinh tế Vi mô - Cung cầu thị trường', subject: 'Kinh tế', filetype: 'pdf', size: 6800000, downloads: 264 },
  { title: 'Tài liệu Kế toán Tài chính cơ bản', subject: 'Kinh tế', filetype: 'pdf', size: 5300000, downloads: 198 },
  { title: 'Slide Quản trị Doanh nghiệp - Marketing Mix', subject: 'Kinh tế', filetype: 'ppt', size: 8900000, downloads: 231 },

  // Chính trị
  { title: 'Tài liệu Triết học Mác-Lênin đầy đủ', subject: 'Chính trị', filetype: 'pdf', size: 4200000, downloads: 389 },
  { title: 'Đề cương Tư tưởng Hồ Chí Minh ôn thi', subject: 'Chính trị', filetype: 'docx', size: 1100000, downloads: 512 },
  { title: 'Câu hỏi trắc nghiệm Đường lối Cách mạng', subject: 'Chính trị', filetype: 'pdf', size: 2400000, downloads: 445 },

  // Văn học
  { title: 'Giáo trình Văn học Việt Nam hiện đại', subject: 'Văn học', filetype: 'pdf', size: 7100000, downloads: 156 },
  { title: 'Phân tích tác phẩm văn học lớp 12 đầy đủ', subject: 'Văn học', filetype: 'docx', size: 2800000, downloads: 234 },
];

async function seed() {
  console.log('🌱 Bắt đầu thêm data mẫu...\n');

  // Thêm users
  const userIds = [];
  for (const u of USERS) {
    const exists = await db.get2('SELECT id FROM users WHERE username=?', [u.username]);
    if (exists) { userIds.push(exists.id); continue; }
    const hash = bcrypt.hashSync(u.password, 10);
    const r = await db.run2('INSERT INTO users (username,password,role) VALUES (?,?,?)', [u.username, hash, u.role]);
    userIds.push(r.lastID);
    console.log(`✅ Thêm user: ${u.username}`);
  }

  // Thêm documents
  const UPLOAD_DIR = path.join(__dirname, 'public/uploads');
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  let added = 0;
  const dates = [
    '2025-01-15','2025-02-03','2025-02-18','2025-03-07','2025-03-22',
    '2025-04-01','2025-04-14','2025-04-28','2025-05-05','2025-05-10',
    '2025-05-18','2025-06-02','2025-06-19','2025-07-08','2025-07-25',
    '2025-08-12','2025-08-30','2025-09-05','2025-09-20','2025-10-03',
  ];

  for (let i = 0; i < DOCS.length; i++) {
    const d = DOCS[i];
    const exists = await db.get2('SELECT id FROM documents WHERE title=?', [d.title]);
    if (exists) { console.log(`⏭  Đã có: ${d.title.substring(0,40)}...`); continue; }

    // Tạo file giả trong uploads (file rỗng, chỉ để record hợp lệ)
    const ext = { pdf:'pdf', docx:'docx', ppt:'pptx', xls:'xlsx', zip:'zip', txt:'txt' }[d.filetype] || 'pdf';
    const filename = `seed-${Date.now()}-${i}.${ext}`;
    const fp = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(fp, `[Tài liệu mẫu: ${d.title}]`);

    const uploaderId = userIds[i % userIds.length];
    const createdAt  = dates[i % dates.length] + ' ' + `0${8+i%12}:${i%2===0?'30':'00'}:00`.slice(-8);

    await db.run2(`
      INSERT INTO documents (title,subject,filename,original_name,size,filetype,uploader_id,downloads,created_at)
      VALUES (?,?,?,?,?,?,?,?,?)`,
      [d.title, d.subject, filename, `${d.title}.${ext}`, d.size, d.filetype, uploaderId, d.downloads, createdAt]
    );
    added++;
    console.log(`📄 Thêm: ${d.title.substring(0,45)}`);
  }

  // Stats
  const stats = await db.get2('SELECT COUNT(*) as docs FROM documents');
  const users = await db.get2('SELECT COUNT(*) as cnt FROM users');
  const totalDl = await db.get2('SELECT SUM(downloads) as total FROM documents');

  console.log(`\n✨ Hoàn tất! Đã thêm ${added} tài liệu mới.`);
  console.log(`📊 Tổng: ${stats.docs} tài liệu | ${users.cnt} người dùng | ${totalDl.total?.toLocaleString()} lượt tải`);
  db.close();
}

seed().catch(e => { console.error('❌ Lỗi:', e.message); db.close(); });

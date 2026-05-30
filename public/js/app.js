  /* app.js — TàiLiệuHọc Frontend SPA */

/* ══════════════════════════════════════
  STATE & UTILS
══════════════════════════════════════ */
let currentUser = null;

const SUBJECTS = ['Toán học','Vật lý','Hóa học','CNTT','Ngoại ngữ','Kinh tế','Chính trị','Văn học','Khác','Đồ Án'];
const SUBJECT_ICONS = { 'Toán học':'📐','Vật lý':'⚛','Hóa học':'🧪','CNTT':'💻','Ngoại ngữ':'🌐','Kinh tế':'📈','Chính trị':'🏛','Văn học':'✍','Khác':'📁' };
const TYPE_ICON = { pdf:'📄', doc:'📝', ppt:'📊', xls:'📗', zip:'📦', txt:'📃' };
const TYPE_CLS  = { pdf:'ico-pdf', doc:'ico-doc', ppt:'ico-ppt', xls:'ico-xls', zip:'ico-zip', txt:'ico-txt' };

function fmt(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(2) + ' MB';
}
function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('vi-VN');
}

function showToast(msg, type = 'ok') {
  const area = document.getElementById('toast-area');
  if (!area) return;
  const icons = { ok:'✅', err:'❌', warn:'⚠️', info:'ℹ️' };
  const div = document.createElement('div');
  div.className = `toast-item ${type}`;
  div.innerHTML = `<span>${icons[type]||'📢'}</span><span>${msg}</span>`;
  area.appendChild(div);
  setTimeout(() => {
    div.style.transition = 'opacity .3s';
    div.style.opacity = '0';
    setTimeout(() => div.remove(), 320);
  }, 3200);
}

/* ── API helper ── */
async function api(method, url, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: {}
  };
  if (body && !(body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body) {
    opts.body = body;
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Lỗi server');
  return data;
}

/* ══════════════════════════════════════
  AUTH STATE
══════════════════════════════════════ */
async function loadUser() {
  try {
    currentUser = await api('GET', '/api/auth/me');
  } catch {
    currentUser = null;
  }
  renderNavbar();
}

function renderNavbar() {
  const authEls   = document.querySelectorAll('.nav-auth-only');
  const guestEls  = document.querySelectorAll('.nav-guest-only');
  const adminEls  = document.querySelectorAll('.nav-admin-only');
  const userChip  = document.getElementById('nav-user-info');

  if (currentUser) {
    authEls.forEach(el  => el.style.display = '');
    guestEls.forEach(el => el.style.display = 'none');
    adminEls.forEach(el => el.style.display = currentUser.role === 'admin' ? '' : 'none');
    if (userChip) userChip.style.display = '', userChip.textContent = `${currentUser.role === 'admin' ? '👑' : '👤'} ${currentUser.username}`;
  } else {
    authEls.forEach(el  => el.style.display = 'none');
    guestEls.forEach(el => el.style.display = '');
    adminEls.forEach(el => el.style.display = 'none');
    if (userChip) userChip.style.display = 'none';
  }
}

/* ══════════════════════════════════════
   SPA ROUTER
══════════════════════════════════════ */
const routes = {
  '/':          pagHome,
  '/profile':   pageProfile,
  '/login':     pageLogin,
  '/register':  pageRegister,
  '/dashboard': pageDashboard,
  '/upload':    pageUpload,
  '/admin':     pageAdmin,
};

function navigate(path, push = true) {
  if (push) history.pushState({}, '', path);
  const fn = routes[path] || pagHome;
  fn();
  // update active nav
  document.querySelectorAll('.nav-link[data-page]').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}

window.addEventListener('popstate', () => navigate(location.pathname, false));

document.addEventListener('click', e => {
  const a = e.target.closest('a[data-page], a[href^="/"]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('http')) return;
  e.preventDefault();
  navigate(href);
});

/* ══════════════════════════════════════
   PAGE: HOME
══════════════════════════════════════ */
async function pagHome() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-hero">
      <div class="hero-blob hero-blob-1"></div>
      <div class="hero-blob hero-blob-2"></div>
      <div class="hero-blob hero-blob-3"></div>
      <div class="container">
        <h1>📚 Kho Tài Liệu Học Tập</h1>
        <p>Tìm kiếm và tải xuống tài liệu học tập miễn phí từ các môn học khác nhau</p>
        <div class="search-wrap mt-3">
          <span>🔍</span>
          <input type="text" id="searchInput" placeholder="Tìm kiếm tài liệu theo tên, môn học..." />
        </div>
        <div class="chips mt-2">
          <span class="chip active" data-subject="all">Tất cả</span>
          ${SUBJECTS.map(s => `<span class="chip" data-subject="${s}">${SUBJECT_ICONS[s]||'📁'} ${s}</span>`).join('')}
        </div>

      </div>
    </div>
    <div class="container content-wrap">
      <div class="sec-hd mb-3">
        <div class="sec-title">📄 Danh Sách Tài Liệu <span class="cnt-badge" id="doc-count">...</span></div>
        ${currentUser ? `<a href="/upload" class="btn btn-sm btn-primary rounded-pill" style="font-size:.8rem" data-page="upload">⬆ Đóng góp tài liệu</a>` : ''}
      </div>
      <div class="doc-grid" id="doc-grid"><div class="spinner"></div></div>
      <div id="no-results" class="empty-state" style="display:none">
        <div class="ei">🔍</div><h5>Không tìm thấy tài liệu</h5>
        <p>Thử thay đổi từ khóa hoặc chọn môn học khác.</p>
      </div>
    </div>
  `;

  let activeSubject = 'all', searchQ = '';

  async function fetchDocs() {
    const grid = document.getElementById('doc-grid');
    if (grid) grid.innerHTML = '<div class="spinner"></div>';
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (activeSubject !== 'all') params.set('subject', activeSubject);
      if (searchQ) params.set('q', searchQ);
      const data = await api('GET', `/api/documents?${params}`);
      renderDocCards(data.docs);
      const cnt = document.getElementById('doc-count');
      if (cnt) cnt.textContent = data.total;
    } catch(err) {
      showToast('Lỗi tải danh sách tài liệu', 'err');
    }
  }

  function renderDocCards(docs) {
    const grid = document.getElementById('doc-grid');
    const noRes = document.getElementById('no-results');
    if (!grid) return;
    if (!docs.length) {
      grid.innerHTML = '';
      if (noRes) noRes.style.display = 'block';
      return;
    }
    if (noRes) noRes.style.display = 'none';
    grid.innerHTML = docs.map((d, i) => `
      <div class="doc-card" style="animation-delay:${i*.04}s">
        <div class="doc-card-head">
          <div class="dtype-ico ${TYPE_CLS[d.filetype]||'ico-txt'}">${TYPE_ICON[d.filetype]||'📁'}</div>
          <div class="doc-title">${d.title}</div>
        </div>
        <div><span class="subj-tag">${d.subject}</span></div>
        <div class="doc-footer">
          <span>${fmt(d.size)} · ${fmtDate(d.created_at)}</span>
          <div style="display:flex;gap:.4rem">
            <button class="btn-preview" onclick="previewDoc(${d.id})">👁</button>
            <button class="btn-dl" onclick="downloadDoc(${d.id})">⬇ Tải</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Events
  const inp = document.getElementById('searchInput');
  if (inp) {
    let debounce;
    inp.addEventListener('input', () => {
      searchQ = inp.value.trim();
      clearTimeout(debounce);
      debounce = setTimeout(fetchDocs, 350);
    });
  }

  document.querySelectorAll('.chip[data-subject]').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      activeSubject = this.dataset.subject;
      fetchDocs();
    });
  });

  fetchDocs();
}

window.downloadDoc = async function(id) {
  if (!currentUser) { showToast('Vui lòng đăng nhập để tải tài liệu', 'warn'); return; }
  window.location.href = `/api/documents/${id}/download`;
};

/* ══════════════════════════════════════
  PAGE: LOGIN
══════════════════════════════════════ */
function pageLogin() {
  if (currentUser) { navigate('/dashboard'); return; }
  document.getElementById('app').innerHTML = `
    <div class="auth-wrap">
      <div class="auth-box">
        <div class="auth-head">
          <div class="logo-ico">📚</div>
          <h2>Đăng Nhập</h2>
          <p>Hệ Thống Quản Lý Tài Liệu Học Tập</p>
        </div>
        <div id="form-err" class="alert alert-danger py-2 px-3 mb-3" style="font-size:.82rem;display:none;border-radius:8px"></div>
        <div class="mb-3">
          <label class="flabel">Tên Đăng Nhập</label>
          <input type="text" id="username" class="finput" placeholder="Nhập tên đăng nhập" autocomplete="username" />
          <div class="err-msg" id="err-username"></div>
        </div>
        <div class="mb-3">
          <label class="flabel">Mật Khẩu</label>
          <div class="pass-wrap">
            <input type="password" id="password" class="finput" placeholder="Nhập mật khẩu" autocomplete="current-password" />
            <button type="button" class="pass-toggle">👁️</button>
          </div>
          <div class="err-msg" id="err-password"></div>
        </div>
        <button class="btn-submit" id="login-btn">🔑 Đăng Nhập</button>
        <div class="auth-link">Chưa có tài khoản? <a href="/register" data-page="register">Đăng ký ngay</a></div>
        <div class="auth-link mt-1"><a href="/" data-page="home" style="color:var(--text-2)">← Về trang chủ</a></div>
      </div>
    </div>
  `;
  initPassToggle();
  document.getElementById('login-btn').addEventListener('click', async () => {
    const un  = document.getElementById('username').value.trim();
    const pw  = document.getElementById('password').value;
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('form-err');
    err.style.display = 'none';

    if (!un || !pw) { err.textContent = 'Vui lòng điền đầy đủ thông tin'; err.style.display = 'block'; return; }

    btn.disabled = true; btn.textContent = 'Đang đăng nhập...';
    try {
      const data = await api('POST', '/api/auth/login', { username: un, password: pw });
      currentUser = data.user;
      renderNavbar();
      showToast(`Chào mừng ${data.user.username}! 👋`, 'ok');
      navigate('/dashboard');
    } catch(e) {
      err.textContent = e.message; err.style.display = 'block';
      btn.disabled = false; btn.textContent = '🔑 Đăng Nhập';
    }
  });
  // Enter key
  ['username','password'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('login-btn').click();
    });
  });
}

/* ══════════════════════════════════════
   PAGE: REGISTER
══════════════════════════════════════ */
function pageRegister() {
  if (currentUser) { navigate('/dashboard'); return; }
  document.getElementById('app').innerHTML = `
    <div class="auth-wrap">
      <div class="auth-box">
        <div class="auth-head">
          <div class="logo-ico">✏️</div>
          <h2>Tạo Tài Khoản</h2>
          <p>Tham gia cộng đồng học tập hôm nay</p>
        </div>
        <div id="form-err" class="alert alert-danger py-2 px-3 mb-3" style="font-size:.82rem;display:none;border-radius:8px"></div>
        <div class="mb-3">
          <label class="flabel">Tên Đăng Nhập</label>
          <input type="text" id="reg-username" class="finput" placeholder="Tối thiểu 4 ký tự" autocomplete="username" />
        </div>
        <div class="mb-3">
          <label class="flabel">Mật Khẩu</label>
          <div class="pass-wrap">
            <input type="password" id="reg-password" class="finput" placeholder="Tối thiểu 6 ký tự" autocomplete="new-password" />
            <button type="button" class="pass-toggle">👁️</button>
          </div>
        </div>
        <div class="mb-3">
          <label class="flabel">Xác Nhận Mật Khẩu</label>
          <div class="pass-wrap">
            <input type="password" id="reg-confirm" class="finput" placeholder="Nhập lại mật khẩu" autocomplete="new-password" />
            <button type="button" class="pass-toggle">👁️</button>
          </div>
        </div>
        <div class="mb-3 d-flex align-items-center gap-2" style="font-size:.8rem;color:var(--text-2)">
          <input type="checkbox" id="terms" style="accent-color:var(--primary)" />
          <label for="terms">Tôi đồng ý với điều khoản sử dụng</label>
        </div>
        <button class="btn-submit" id="reg-btn">✅ Tạo Tài Khoản</button>
        <div class="auth-link">Đã có tài khoản? <a href="/login" data-page="login">Đăng nhập ngay</a></div>
      </div>
    </div>
  `;
  initPassToggle();
  document.getElementById('reg-btn').addEventListener('click', async () => {
    const un  = document.getElementById('reg-username').value.trim();
    const pw  = document.getElementById('reg-password').value;
    const pw2 = document.getElementById('reg-confirm').value;
    const chk = document.getElementById('terms').checked;
    const btn = document.getElementById('reg-btn');
    const err = document.getElementById('form-err');
    err.style.display = 'none';

    if (!un || un.length < 4)  { err.textContent = 'Tên đăng nhập tối thiểu 4 ký tự'; err.style.display='block'; return; }
    if (!pw || pw.length < 6)  { err.textContent = 'Mật khẩu tối thiểu 6 ký tự'; err.style.display='block'; return; }
    if (pw !== pw2)             { err.textContent = 'Mật khẩu xác nhận không khớp'; err.style.display='block'; return; }
    if (!chk)                   { err.textContent = 'Vui lòng đồng ý điều khoản'; err.style.display='block'; return; }

    btn.disabled = true; btn.textContent = 'Đang đăng ký...';
    try {
      const data = await api('POST', '/api/auth/register', { username: un, password: pw });
      currentUser = data.user;
      renderNavbar();
      showToast('Đăng ký thành công! Chào mừng bạn 🎉', 'ok');
      navigate('/dashboard');
    } catch(e) {
      err.textContent = e.message; err.style.display = 'block';
      btn.disabled = false; btn.textContent = '✅ Tạo Tài Khoản';
    }
  });
}

/* ══════════════════════════════════════
  PAGE: DASHBOARD
══════════════════════════════════════ */
async function pageDashboard() {
  if (!currentUser) { navigate('/login'); return; }
  document.getElementById('app').innerHTML = `
    <div class="dash-header">
      <div class="container">
        <h4 style="margin:0;font-weight:700">👋 Xin chào, ${currentUser.username}!</h4>
        <p style="opacity:.8;margin:.3rem 0 0;font-size:.9rem">${currentUser.role==='admin'?'👑 Quản trị viên':'👤 Người dùng thường'}</p>
      </div>
    </div>
    <div class="container">
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-num" id="s-docs">...</div><div class="stat-label">📄 Tài liệu</div></div>
        <div class="stat-card"><div class="stat-num" id="s-users">...</div><div class="stat-label">👥 Người dùng</div></div>
        <div class="stat-card"><div class="stat-num" id="s-subj">...</div><div class="stat-label">📚 Môn học</div></div>
        <div class="stat-card"><div class="stat-num" id="s-dl">...</div><div class="stat-label">⬇ Tổng lượt tải</div></div>
      </div>
    </div>

    <div class="container content-wrap">
      <div class="sec-hd mb-3">
        <div class="sec-title">� Thống kê chi tiết</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr;gap:1rem;margin-bottom:1.5rem;">
        <div class="card-box">
          <div class="sec-title" style="font-size:.95rem">📊 Xu hướng tải tuần</div>
          <div id="trend-chart" style="display:grid;grid-template-columns:repeat(7,1fr);gap:.45rem;height:200px;margin-top:.9rem;align-items:end"></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-bottom:1.5rem;">
        <div class="card-box">
          <div class="sec-title" style="font-size:.95rem">🏷️ Môn học hot</div>
          <div id="top-subjects" style="display:grid;gap:.85rem;margin-top:1rem"></div>
        </div>

        <div class="card-box">
          <div class="sec-title" style="font-size:.95rem">⭐ Tài liệu tải nhiều</div>
          <div id="top-downloads" style="display:grid;gap:.85rem;margin-top:1rem">
            <div class="spinner" style="margin:.8rem auto"></div>
          </div>
        </div>
      </div>

      <div class="sec-hd mb-3">
        <div class="sec-title">🔍 Danh sách tài liệu</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr;gap:1.0rem;">
        <div class="card-box">
          <div class="sec-hd" style="gap:1rem">
            <div class="sec-title" style="font-size:.95rem">🎛️ Bộ lọc</div>
          </div>

          <div style="display:grid;grid-template-columns: 1fr 160px;gap:.8rem;margin-top:.8rem">
            <div>
              <div class="flabel" style="margin:0">Môn học</div>
              <select id="dash-subject" class="finput" style="margin-top:.25rem">
                <option value="all">Tất cả</option>
                ${SUBJECTS.map(s => `<option value="${s}">${SUBJECT_ICONS[s]||''} ${s}</option>`).join('')}
              </select>
            </div>
            <div>
              <div class="flabel" style="margin:0">Giới hạn</div>
              <select id="dash-limit" class="finput" style="margin-top:.25rem">
                <option value="6">6</option>
                <option value="12" selected>12</option>
                <option value="24">24</option>
              </select>
            </div>
          </div>

          <div style="margin-top:.8rem">
            <div class="flabel" style="margin:0">Tìm kiếm</div>
            <input id="dash-q" class="finput" style="margin-top:.25rem" placeholder="Theo tên / môn" />
          </div>

          <div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:.9rem">
            <button class="btn-dl" id="dash-apply">✅ Áp dụng</button>
            <button class="btn-logout" id="dash-reset" style="border-color:var(--border) !important">↩ Reset</button>
          </div>
        </div>

        <div class="doc-grid" id="recent-docs"><div class="spinner"></div></div>

        <div style="display:flex;justify-content:center;margin-top:1rem">
          <button class="btn-dl" id="dash-load-more" style="display:none">⬇ Xem thêm</button>
        </div>
      </div>
    </div>
  `;


  try {
    const stats = await api('GET', '/api/stats/overview');
    document.getElementById('s-docs').textContent  = stats.docs;
    document.getElementById('s-users').textContent = stats.users;
    document.getElementById('s-subj').textContent  = stats.subjects;
    document.getElementById('s-dl').textContent    = stats.downloads;

    renderTrendChart(stats.downloads_trend);
    renderTopSubjects(stats.top_subjects);
    renderTopDownloads(stats.top_downloads);
  } catch(e) {
    showToast('Lỗi tải thông tin dashboard', 'err');
  }

  function renderTrendChart(series) {
    const chart = document.getElementById('trend-chart');
    if (!chart) return;
    // Fake data if empty
    if (!series || series.length === 0) {
      series = [
        { date: new Date(Date.now()-6*24*60*60*1000).toISOString().slice(0,10), count: 28 },
        { date: new Date(Date.now()-5*24*60*60*1000).toISOString().slice(0,10), count: 145 },
        { date: new Date(Date.now()-4*24*60*60*1000).toISOString().slice(0,10), count: 78 },
        { date: new Date(Date.now()-3*24*60*60*1000).toISOString().slice(0,10), count: 267 },
        { date: new Date(Date.now()-2*24*60*60*1000).toISOString().slice(0,10), count: 52 },
        { date: new Date(Date.now()-1*24*60*60*1000).toISOString().slice(0,10), count: 198 },
        { date: new Date(Date.now()).toISOString().slice(0,10), count: 156 },
      ];
    }
    const max = Math.max(1, ...series.map(item => item.count));
    chart.innerHTML = series.map(item => {
      const height = Math.max(18, Math.round((item.count / max) * 100));
      const label = new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short' });
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:.35rem">
          <div style="width:100%;height:${height}px;border-radius:12px;background:linear-gradient(180deg,var(--primary-light),var(--primary));"></div>
          <div style="font-size:.68rem;color:var(--text-3);white-space:nowrap">${label}</div>
        </div>
      `;
    }).join('');
  }

  function renderTopSubjects(subjects) {
    const container = document.getElementById('top-subjects');
    if (!container) return;
    // Fake data if empty
    if (!subjects || subjects.length === 0) {
      subjects = [
        { subject: 'CNTT', total: 2540 },
        { subject: 'Ngoại ngữ', total: 1890 },
        { subject: 'Toán học', total: 1670 },
      ];
    }
    if (!subjects.length) {
      container.innerHTML = '<div style="color:var(--text-3);font-size:.85rem">Chưa có dữ liệu môn học</div>';
      return;
    }
    container.innerHTML = subjects.map(item => {
      const icon = SUBJECT_ICONS[item.subject] || '🏷️';
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.75rem 1rem;border:1px solid var(--border);border-radius:12px;background:rgba(249,250,251,.9)">
          <div>
            <div style="font-size:.9rem;font-weight:700">${icon} ${item.subject}</div>
            <div style="font-size:.78rem;color:var(--text-3);margin-top:.25rem">${item.total || 0} lượt tải</div>
          </div>
          <div style="font-size:.9rem;font-weight:700;color:var(--primary)">${Math.round((item.total || 0) / Math.max(1, subjects[0].total) * 100)}%</div>
        </div>
      `;
    }).join('');
  }

  function renderTopDownloads(docs) {
    const container = document.getElementById('top-downloads');
    if (!container) return;
    if (!docs.length) {
      container.innerHTML = '<div style="color:var(--text-3);font-size:.85rem">Chưa có tài liệu</div>';
      return;
    }
    container.innerHTML = docs.map((doc, idx) => `
      <div style="display:grid;grid-template-columns:1fr auto;gap:.8rem;align-items:center;padding:.8rem 0;border-bottom:1px solid var(--border)">
        <div style="min-width:0">
          <div style="font-size:.85rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${doc.title}</div>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:.3rem;display:flex;gap:.4rem;flex-wrap:wrap">
            <span class="subj-tag" style="font-size:.72rem;padding:.2rem .45rem">${doc.subject}</span>
            <span>${doc.uploader_name || '...'}</span>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.95rem;font-weight:700;color:var(--primary)">${doc.downloads || 0}</div>
          <div style="font-size:.7rem;color:var(--text-3);margin-top:.25rem">downloads</div>
        </div>
      </div>
    `).join('');
  }

  // Dashboard interactions
  let dashSubject = 'all';
  let dashLimit = Number(document.getElementById('dash-limit')?.value || 12);
  let dashQ = '';
  let dashOffsetLimit = dashLimit; // tăng limit để load thêm (đơn giản)

  function buildParams() {
    const params = new URLSearchParams({ limit: String(dashOffsetLimit) });
    if (dashSubject && dashSubject !== 'all') params.set('subject', dashSubject);
    if (dashQ) params.set('q', dashQ);
    return params;
  }

  function renderCards(docs) {
    const grid = document.getElementById('recent-docs');
    const noRes = document.getElementById('no-results');
    if (!grid) return;
    if (!docs.length) {
      grid.innerHTML = '<div class="empty-state"><div class="ei">📭</div><h5>Chưa có tài liệu nào</h5></div>';
      return;
    }

    grid.innerHTML = docs.map((d, i) => `
      <div class="doc-card" style="animation-delay:${i*.04}s">
        <div class="doc-card-head">
          <div class="dtype-ico ${TYPE_CLS[d.filetype]||'ico-txt'}">${TYPE_ICON[d.filetype]||'📁'}</div>
          <div class="doc-title">${d.title}</div>
        </div>
        <div><span class="subj-tag">${d.subject}</span></div>
        <div class="doc-footer">
          <span>${fmt(d.size)}</span>
          <button class="btn-dl" onclick="downloadDoc(${d.id})">⬇ Tải</button>
        </div>
      </div>
    `).join('');
  }

  async function loadDocs() {
    const grid = document.getElementById('recent-docs');
    if (grid) grid.innerHTML = '<div class="spinner"></div>';
    try {
      const params = buildParams();
      const data = await api('GET', `/api/documents?${params}`);
      renderCards(data.docs);

      // Show top downloads (client sort)
      await loadTopDownloads();
    } catch {
      showToast('Lỗi tải danh sách tài liệu', 'err');
    }
  }

  async function loadTopDownloads() {
    const topEl = document.getElementById('top-downloads');
    if (!topEl) return;
    topEl.innerHTML = '<div class="spinner" style="margin:.8rem auto"></div>';

    try {
      // Lấy một mẻ lớn để sort client
      const params = new URLSearchParams({ limit: '200' });
      if (dashSubject && dashSubject !== 'all') params.set('subject', dashSubject);
      if (dashQ) params.set('q', dashQ);

      const data = await api('GET', `/api/documents?${params}`);
      const docs = (data.docs || []).slice();
      docs.sort((a,b) => (b.downloads||0) - (a.downloads||0));
      const top = docs.slice(0,5);

      // Nếu dữ liệu ít/0 thì fake để nhìn cho đẹp
      if (!top.length) {
        const fake = [
          { title:'Giáo trình Toán Cao Cấp A1', subject:'Toán học', downloads: 1234 },
          { title:'Bài giảng Vật lý Đại Cương', subject:'Vật lý', downloads: 980 },
          { title:'Chuyên đề Hóa học Hữu cơ', subject:'Hóa học', downloads: 760 },
          { title:'Lập trình C++ nâng cao', subject:'CNTT', downloads: 620 },
          { title:'Từ vựng & Ngữ pháp Tiếng Anh', subject:'Ngoại ngữ', downloads: 540 },
        ];

        const maxDlFake = Math.max(...fake.map(x => x.downloads || 0));
        topEl.innerHTML = `
          <div style="display:grid;grid-template-columns:1fr;gap:.75rem">
            ${fake.map((d, idx) => {
              const pct = Math.round(((d.downloads||0) / Math.max(1, maxDlFake)) * 100);
              return `
                <div style="display:grid;grid-template-columns:54px 1fr;gap:.75rem;align-items:center">
                  <div style="width:54px;height:54px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
                    <div style="position:absolute;inset:0;background:conic-gradient(var(--primary) ${pct}%, rgba(124,58,237,.12) 0);"></div>
                    <div style="position:relative;font-weight:900;color:white;text-shadow:0 1px 2px rgba(0,0,0,.25);font-size:.78rem">${d.downloads||0}</div>
                  </div>
                  <div style="min-width:0">
                    <div style="font-size:.82rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.title}</div>
                    <div style="font-size:.7rem;color:var(--text-3);margin-top:.15rem;display:flex;gap:.4rem;align-items:center">
                      <span class="subj-tag" style="padding:.15rem .45rem;font-size:.7rem">${d.subject}</span>
                      <span style="white-space:nowrap">${pct}%</span>
                    </div>
                    <div style="margin-top:.35rem;height:8px;border-radius:999px;background:var(--border);overflow:hidden">
                      <div style="height:100%;width:${pct}%;background:var(--grad);border-radius:999px"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
        return;
      }


      const maxDl = Math.max(1, ...top.map(x => x.downloads || 0));

      topEl.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr;gap:.75rem">
          ${top.map((d, idx) => {
            const pct = Math.round(((d.downloads||0) / maxDl) * 100);
            return `
              <div style="display:grid;grid-template-columns:54px 1fr;gap:.75rem;align-items:center">
                <div style="width:54px;height:54px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
                  <div style="position:absolute;inset:0;background:conic-gradient(var(--primary) ${pct}%, rgba(124,58,237,.12) 0);"></div>
                  <div style="position:relative;font-weight:900;color:white;text-shadow:0 1px 2px rgba(0,0,0,.25);font-size:.78rem">${d.downloads||0}</div>
                </div>
                <div style="min-width:0">
                  <div style="font-size:.82rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.title}</div>
                  <div style="font-size:.7rem;color:var(--text-3);margin-top:.15rem;display:flex;gap:.4rem;align-items:center">
                    <span class="subj-tag" style="padding:.15rem .45rem;font-size:.7rem">${d.subject}</span>
                    <span style="white-space:nowrap">${pct}%</span>
                  </div>
                  <div style="margin-top:.35rem;height:8px;border-radius:999px;background:var(--border);overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:var(--grad);border-radius:999px"></div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch {
      topEl.innerHTML = '<div style="color:var(--text-3);font-size:.85rem">Không tải được Top lượt tải</div>';
    }
  }

  // Hook events
  const elApply = document.getElementById('dash-apply');
  const elReset = document.getElementById('dash-reset');
  const elLoadMore = document.getElementById('dash-load-more');
  const elSubject = document.getElementById('dash-subject');
  const elLimit = document.getElementById('dash-limit');
  const elQ = document.getElementById('dash-q');

  function syncStateFromUI() {
    dashSubject = elSubject?.value || 'all';
    dashLimit = Number(elLimit?.value || 12);
    dashQ = (elQ?.value || '').trim();
  }

  elApply?.addEventListener('click', async () => {
    syncStateFromUI();
    dashOffsetLimit = dashLimit;
    if (elLoadMore) elLoadMore.style.display = '';
    await loadDocs();
  });

  elReset?.addEventListener('click', async () => {
    if (elSubject) elSubject.value = 'all';
    if (elLimit) elLimit.value = '12';
    if (elQ) elQ.value = '';
    dashSubject = 'all';
    dashLimit = 12;
    dashQ = '';
    dashOffsetLimit = dashLimit;
    if (elLoadMore) elLoadMore.style.display = '';
    await loadDocs();
  });

  elLoadMore?.addEventListener('click', async () => {
    dashOffsetLimit = dashOffsetLimit + dashLimit;
    await loadDocs();
  });

  // default load
  try {
    await loadDocs();
    if (elLoadMore) elLoadMore.style.display = '';
  } catch {}
}


/* ══════════════════════════════════════
  PAGE: UPLOAD
══════════════════════════════════════ */
function pageUpload() {
  if (!currentUser) { navigate('/login'); return; }
  document.getElementById('app').innerHTML = `
    <div class="container content-wrap" style="max-width:620px">
      <div class="card-box">
        <h5 style="font-weight:700;margin-bottom:1.5rem">⬆ Tải Tài Liệu Lên</h5>

        <div id="upload-err" class="alert alert-danger py-2 px-3 mb-3" style="font-size:.82rem;display:none;border-radius:8px"></div>

        <div class="mb-3">
          <label class="flabel">Tên Tài Liệu *</label>
          <input type="text" id="doc-title" class="finput" placeholder="VD: Giáo trình Toán Cao Cấp A1" />
        </div>

        <div class="mb-3">
          <label class="flabel">Môn Học *</label>
          <select id="doc-subject" class="finput">
            <option value="">-- Chọn môn học --</option>
            ${SUBJECTS.map(s => `<option value="${s}">${SUBJECT_ICONS[s]||''} ${s}</option>`).join('')}
          </select>
        </div>

        <div class="mb-3">
          <label class="flabel">File Tài Liệu *</label>
          <div class="upload-zone" id="upload-zone">
            <div class="zi">📂</div>
            <p style="color:var(--text-2);margin:.3rem 0 0;font-size:.85rem">Kéo thả file vào đây hoặc <strong style="color:var(--primary)">click để chọn</strong></p>
            <p style="color:var(--text-3);font-size:.75rem;margin:.2rem 0 0">PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP (tối đa 50MB)</p>
            <div id="file-name" style="margin-top:.5rem;font-size:.8rem;color:var(--primary);font-weight:600"></div>
          </div>
          <input type="file" id="file-input" style="display:none" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar" />
        </div>

        <div id="upload-progress" style="display:none;margin-bottom:1rem">
          <div style="display:flex;justify-content:space-between;font-size:.78rem;color:var(--text-2);margin-bottom:.3rem">
            <span>Đang tải lên...</span><span id="upload-pct">0%</span>
          </div>
          <div class="progress"><div class="progress-bar" id="upload-bar" style="width:0"></div></div>
        </div>

        <button class="btn-submit" id="upload-btn">⬆ Tải Lên Tài Liệu</button>
      </div>
    </div>
  `;

  const zone  = document.getElementById('upload-zone');
  const input = document.getElementById('file-input');
  let selectedFile = null;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('over');
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  });
  input.addEventListener('change', () => { if (input.files[0]) setFile(input.files[0]); });

  function setFile(f) {
    selectedFile = f;
    document.getElementById('file-name').textContent = `📎 ${f.name} (${fmt(f.size)})`;
  }

  document.getElementById('upload-btn').addEventListener('click', async () => {
    const title   = document.getElementById('doc-title').value.trim();
    const subject = document.getElementById('doc-subject').value;
    const btn     = document.getElementById('upload-btn');
    const errEl   = document.getElementById('upload-err');
    errEl.style.display = 'none';

    if (!title)        { errEl.textContent = 'Vui lòng nhập tên tài liệu'; errEl.style.display='block'; return; }
    if (!subject)      { errEl.textContent = 'Vui lòng chọn môn học'; errEl.style.display='block'; return; }
    if (!selectedFile) { errEl.textContent = 'Vui lòng chọn file'; errEl.style.display='block'; return; }

    const fd = new FormData();
    fd.append('title',   title);
    fd.append('subject', subject);
    fd.append('file',    selectedFile);

    btn.disabled = true; btn.textContent = 'Đang tải lên...';
    document.getElementById('upload-progress').style.display = 'block';

    // Fake progress UI (XHR thật để track progress)
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/documents');
    xhr.withCredentials = true;

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        document.getElementById('upload-bar').style.width = pct + '%';
        document.getElementById('upload-pct').textContent = pct + '%';
      }
    });

    xhr.addEventListener('load', () => {
      const data = JSON.parse(xhr.responseText);
      if (xhr.status === 200) {
        showToast(`Đã tải lên "${title}" thành công! 🎉`, 'ok');
        navigate('/');
      } else {
        errEl.textContent = data.error || 'Lỗi tải lên'; errEl.style.display='block';
        btn.disabled = false; btn.textContent = '⬆ Tải Lên Tài Liệu';
        document.getElementById('upload-progress').style.display = 'none';
      }
    });
    xhr.addEventListener('error', () => {
      errEl.textContent = 'Lỗi kết nối'; errEl.style.display='block';
      btn.disabled = false; btn.textContent = '⬆ Tải Lên Tài Liệu';
    });

    xhr.send(fd);
  });
}

/* ══════════════════════════════════════
  PAGE: ADMIN
══════════════════════════════════════ */
async function pageAdmin() {
  if (!currentUser || currentUser.role !== 'admin') {
    document.getElementById('app').innerHTML = `
      <div style="min-height:60vh;display:flex;align-items:center;justify-content:center;text-align:center">
        <div><div style="font-size:4rem">🔒</div><h4>Truy cập bị từ chối</h4>
        <a href="/login" data-page="login" class="btn btn-primary mt-2">Đăng nhập</a></div>
      </div>`;
    return;
  }

  document.getElementById('app').innerHTML = `
    <div class="container content-wrap">
      <h5 style="font-weight:700;margin-bottom:1.5rem">🛡 Trang Quản Trị</h5>

      <!-- Tài liệu -->
      <div class="card-box mb-4">
        <div class="sec-hd mb-3">
          <div class="sec-title">📄 Quản Lý Tài Liệu <span class="cnt-badge" id="admin-doc-count">...</span></div>
          <input type="text" id="admin-search" class="finput" placeholder="🔍 Tìm kiếm..." style="width:220px;padding:.4rem .8rem;font-size:.8rem" />
        </div>
        <div style="overflow-x:auto">
          <table class="admin-table" id="doc-table">
            <thead><tr><th></th><th>Tên tài liệu</th><th>Môn</th><th>Kích thước</th><th>Ngày tải</th><th>Người tải</th><th>Lượt tải</th><th></th></tr></thead>
            <tbody id="doc-tbody"><tr><td colspan="8" class="text-center py-3"><div class="spinner" style="margin:.5rem auto"></div></td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- Users -->
      <div class="card-box">
        <div class="sec-hd mb-3">
          <div class="sec-title">👥 Quản Lý Người Dùng <span class="cnt-badge" id="admin-user-count">...</span></div>
        </div>
        <div style="overflow-x:auto">
          <table class="admin-table">
            <thead><tr><th>#</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Ngày tạo</th><th>Số tài liệu</th><th></th></tr></thead>
            <tbody id="user-tbody"><tr><td colspan="6" class="text-center py-3"><div class="spinner" style="margin:.5rem auto"></div></td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  let allDocs = [];

  async function loadDocs() {
    try {
      const data = await api('GET', '/api/documents?limit=200');
      allDocs = data.docs;
      renderDocTable(allDocs);
    } catch { showToast('Lỗi tải danh sách tài liệu', 'err'); }
  }

  function renderDocTable(docs) {
    const tbody = document.getElementById('doc-tbody');
    const cnt   = document.getElementById('admin-doc-count');
    if (!tbody) return;
    if (cnt) cnt.textContent = docs.length;
    if (!docs.length) { tbody.innerHTML = `<tr><td colspan="8" class="text-center py-3 text-muted">Không có tài liệu</td></tr>`; return; }
    tbody.innerHTML = docs.map(d => `
      <tr id="drow-${d.id}">
        <td><div class="dtype-ico ${TYPE_CLS[d.filetype]||'ico-txt'}" style="width:28px;height:28px;font-size:.8rem;display:inline-flex;align-items:center;justify-content:center;border-radius:6px">${TYPE_ICON[d.filetype]||'📁'}</div></td>
        <td><strong style="font-size:.82rem">${d.title}</strong></td>
        <td><span class="subj-tag" style="font-size:.7rem">${d.subject}</span></td>
        <td style="font-size:.8rem">${fmt(d.size)}</td>
        <td style="font-size:.8rem">${fmtDate(d.created_at)}</td>
        <td style="font-size:.8rem">${d.uploader_name}</td>
        <td style="font-size:.8rem">${d.downloads}</td>
        <td><button class="btn-danger" onclick="adminDeleteDoc(${d.id})">🗑 Xóa</button></td>
      </tr>
    `).join('');
  }

  async function loadUsers() {
    try {
      const users = await api('GET', '/api/documents/admin/users');
      const tbody = document.getElementById('user-tbody');
      const cnt   = document.getElementById('admin-user-count');
      if (cnt) cnt.textContent = users.length;
      if (!tbody) return;
      tbody.innerHTML = users.map(u => `
        <tr id="urow-${u.id}">
          <td>${u.id}</td>
          <td><strong>${u.username}</strong></td>
          <td><span class="role-badge ${u.role==='admin'?'rb-admin':'rb-user'}">${u.role==='admin'?'👑 Admin':'👤 User'}</span></td>
          <td style="font-size:.8rem">${fmtDate(u.created_at)}</td>
          <td>${u.doc_count}</td>
          <td>${u.role !== 'admin' ? `<button class="btn-danger" onclick="adminDeleteUser(${u.id})">🗑 Xóa</button>` : '<span style="color:var(--text-3)">—</span>'}</td>
        </tr>
      `).join('');
    } catch { showToast('Lỗi tải danh sách người dùng', 'err'); }
  }

  // Search
  document.getElementById('admin-search')?.addEventListener('input', function() {
    const q = this.value.toLowerCase();
    renderDocTable(allDocs.filter(d => d.title.toLowerCase().includes(q) || d.subject.toLowerCase().includes(q)));
  });

  window.adminDeleteDoc = async function(id) {
    if (!confirm('Bạn chắc chắn muốn xóa tài liệu này?')) return;
    try {
      await api('DELETE', `/api/documents/${id}`);
      const row = document.getElementById(`drow-${id}`);
      if (row) { row.style.transition='opacity .3s'; row.style.opacity='0'; setTimeout(()=>row.remove(),300); }
      allDocs = allDocs.filter(d => d.id !== id);
      const cnt = document.getElementById('admin-doc-count');
      if (cnt) cnt.textContent = allDocs.length;
      showToast('Đã xóa tài liệu!', 'ok');
    } catch(e) { showToast(e.message, 'err'); }
  };

  window.adminDeleteUser = async function(id) {
    if (!confirm('Bạn chắc chắn muốn xóa người dùng này?')) return;
    try {
      await api('DELETE', `/api/documents/admin/users/${id}`);
      const row = document.getElementById(`urow-${id}`);
      if (row) { row.style.transition='opacity .3s'; row.style.opacity='0'; setTimeout(()=>row.remove(),300); }
      showToast('Đã xóa người dùng!', 'ok');
    } catch(e) { showToast(e.message, 'err'); }
  };

  loadDocs();
  loadUsers();
}

/* ══════════════════════════════════════
  HELPERS
══════════════════════════════════════ */
function initPassToggle() {
  document.querySelectorAll('.pass-toggle').forEach(btn => {
    btn.addEventListener('click', function() {
      const inp = this.closest('.pass-wrap').querySelector('input');
      inp.type = inp.type === 'password' ? 'text' : 'password';
      this.textContent = inp.type === 'password' ? '👁️' : '🙈';
    });
  });
}

/* ══════════════════════════════════════
  INIT
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  // Logout
  document.getElementById('nav-logout-btn')?.addEventListener('click', async () => {
    await api('POST', '/api/auth/logout').catch(()=>{});
    currentUser = null;
    renderNavbar();
    showToast('Đã đăng xuất!', 'info');
    navigate('/');
  });

  await loadUser();
  navigate(location.pathname, false);
});

/* ══════════════════════════════════════
  PAGE: PROFILE
══════════════════════════════════════ */
// Profile helpers
window.switchTab = function(tabName) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(el => {
    el.style.color = 'var(--text-2)';
    el.style.borderBottomColor = 'transparent';
  });
  document.getElementById(`tab-${tabName}`).style.display = 'block';
  document.querySelector(`[data-tab="${tabName}"]`).style.color = 'var(--text)';
  document.querySelector(`[data-tab="${tabName}"]`).style.borderBottomColor = 'var(--primary)';
};

window.handleAvatarUpload = async function(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const preview = document.getElementById('avatar-preview');
    preview.style.backgroundImage = `url(${reader.result})`;
    preview.style.backgroundSize = 'cover';
    preview.innerHTML = '';
  };
  reader.readAsDataURL(file);
};

window.resetAvatar = function() {
  const preview = document.getElementById('avatar-preview');
  const username = currentUser.username || 'U';
  preview.style.backgroundImage = 'none';
  preview.innerHTML = username[0].toUpperCase();
};

async function pageProfile() {
  if (!currentUser) { navigate('/login'); return; }

  document.getElementById('app').innerHTML = `
    <div class="dash-header">
      <div class="container">
        <h4 style="margin:0;font-weight:700">👤 Hồ Sơ Cá Nhân</h4>
        <p style="opacity:.8;margin:.3rem 0 0;font-size:.9rem">Quản lý thông tin & cài đặt tài khoản</p>
      </div>
    </div>
    <div class="container" style="padding-top:1.5rem;padding-bottom:3rem">
      <div style="display:grid;grid-template-columns:380px 1fr;gap:2rem;align-items:start">

        <!-- Cột trái: Avatar + Info -->
        <div style="display:flex;flex-direction:column;gap:1rem">
          <!-- Avatar -->
          <div class="card-box" style="text-align:center">
            <div id="avatar-preview" style="width:100px;height:100px;border-radius:50%;background:var(--primary);color:white;font-size:2.5rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;position:relative;overflow:hidden">
              ${(currentUser.username||'U')[0].toUpperCase()}
            </div>
            <div style="font-weight:700;font-size:1.1rem" id="profile-name-display">${currentUser.username}</div>
            <div id="profile-fullname-display" style="color:var(--primary);font-size:.9rem;margin:.3rem 0;font-weight:600"></div>
            <div style="margin:.5rem 0">
              <span class="role-badge ${currentUser.role==='admin'?'rb-admin':'rb-user'}">${currentUser.role==='admin'?'👑 Admin':'👤 User'}</span>
            </div>
            <div style="font-size:.78rem;color:var(--text-2);margin-top:.8rem">Thành viên từ ${fmtDate(currentUser.created_at)}</div>
          </div>

          <!-- Thống kê -->
          <div class="card-box">
            <div style="font-weight:700;margin-bottom:.8rem;font-size:.9rem">📊 Thống Kê</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">
              <div style="padding:.6rem;background:rgba(101,84,192,0.1);border-radius:8px;text-align:center">
                <div style="font-size:1.4rem;font-weight:700;color:var(--primary)" id="ps-uploaded">0</div>
                <div style="font-size:.7rem;color:var(--text-2);margin-top:.2rem">Đã tải lên</div>
              </div>
              <div style="padding:.6rem;background:rgba(101,84,192,0.1);border-radius:8px;text-align:center">
                <div style="font-size:1.4rem;font-weight:700;color:var(--primary)" id="ps-downloaded">0</div>
                <div style="font-size:.7rem;color:var(--text-2);margin-top:.2rem">Đã tải xuống</div>
              </div>
              <div style="padding:.6rem;background:rgba(101,84,192,0.1);border-radius:8px;text-align:center">
                <div style="font-size:1.4rem;font-weight:700;color:var(--primary)" id="ps-mydl">0</div>
                <div style="font-size:.7rem;color:var(--text-2);margin-top:.2rem">Lượt của tôi</div>
              </div>
              <div style="padding:.6rem;background:rgba(101,84,192,0.1);border-radius:8px;text-align:center">
                <div style="font-size:1.4rem;font-weight:700;color:var(--primary)" id="ps-fav">0</div>
                <div style="font-size:.7rem;color:var(--text-2);margin-top:.2rem">Yêu thích</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cột phải: Forms + Tabs -->
        <div style="display:flex;flex-direction:column;gap:1rem">
          <!-- Tabs -->
          <div style="display:flex;gap:.5rem;border-bottom:2px solid var(--border);margin-bottom:.5rem;overflow-x:auto">
            <button class="tab-btn active" data-tab="edit" style="padding:.6rem 1rem;font-size:.85rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:3px solid transparent;color:var(--text);transition:all .2s" onclick="switchTab('edit')">✏️ Chỉnh Sửa</button>
            <button class="tab-btn" data-tab="security" style="padding:.6rem 1rem;font-size:.85rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:3px solid transparent;color:var(--text-2);transition:all .2s" onclick="switchTab('security')">🔒 Bảo Mật</button>
            <button class="tab-btn" data-tab="docs" style="padding:.6rem 1rem;font-size:.85rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:3px solid transparent;color:var(--text-2);transition:all .2s" onclick="switchTab('docs')">📤 Tài Liệu</button>
            <button class="tab-btn" data-tab="history" style="padding:.6rem 1rem;font-size:.85rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:3px solid transparent;color:var(--text-2);transition:all .2s" onclick="switchTab('history')">🕐 Lịch Sử</button>
          </div>

          <!-- Tab: Edit -->
          <div id="tab-edit" class="card-box" style="display:block">
            <div style="font-weight:700;margin-bottom:1.2rem;font-size:.95rem">✏️ Thông Tin Cá Nhân</div>
            <div class="mb-3">
              <label class="flabel">Tên đăng nhập</label>
              <input class="finput" value="${currentUser.username}" disabled style="opacity:.6;cursor:not-allowed" />
            </div>
            <div class="mb-3">
              <label class="flabel">Họ và tên</label>
              <input class="finput" id="edit-fullname" placeholder="Nhập họ và tên" />
            </div>
            <div class="mb-3">
              <label class="flabel">Email</label>
              <input class="finput" id="edit-email" type="email" placeholder="Nhập email của bạn" />
            </div>
            <div class="mb-3">
              <label class="flabel">Số điện thoại</label>
              <input class="finput" id="edit-phone" placeholder="Nhập số điện thoại" />
            </div>
            <div class="mb-3">
              <label class="flabel">Tiểu sử / Bio</label>
              <textarea class="finput" id="edit-bio" placeholder="Chia sẻ điều gì về bạn..." style="resize:vertical;min-height:80px"></textarea>
            </div>
            <div class="mb-3">
              <label class="flabel">Ảnh đại diện</label>
              <div style="display:flex;gap:.5rem;align-items:center">
                <input type="file" id="avatar-input" accept="image/*" style="display:none" onchange="handleAvatarUpload(event)" />
                <button class="btn-submit" onclick="document.getElementById('avatar-input').click()" style="flex:1">🖼️ Tải Ảnh</button>
                <button class="btn-logout" onclick="document.getElementById('avatar-reset').click()" style="border-color:var(--border)!important">↩</button>
                <input type="hidden" id="avatar-reset" onclick="resetAvatar()" />
              </div>
            </div>
            <button class="btn-submit" id="save-profile-btn" style="width:100%;margin-top:1rem">💾 Lưu Thay Đổi</button>
            <div id="profile-save-msg" style="font-size:.78rem;margin-top:.5rem;text-align:center;display:none"></div>
          </div>

          <!-- Tab: Security -->
          <div id="tab-security" class="card-box" style="display:none">
            <div style="font-weight:700;margin-bottom:1.2rem;font-size:.95rem">🔒 Bảo Mật</div>
            <div class="mb-3">
              <label class="flabel">Mật khẩu hiện tại</label>
              <input class="finput" id="pwd-old" type="password" placeholder="Nhập mật khẩu hiện tại" />
            </div>
            <div class="mb-3">
              <label class="flabel">Mật khẩu mới</label>
              <input class="finput" id="pwd-new" type="password" placeholder="Nhập mật khẩu mới" />
            </div>
            <div class="mb-3">
              <label class="flabel">Xác nhận mật khẩu</label>
              <input class="finput" id="pwd-confirm" type="password" placeholder="Nhập lại mật khẩu mới" />
            </div>
            <button class="btn-submit" id="change-pwd-btn" style="width:100%">🔄 Đổi Mật Khẩu</button>
            <div id="pwd-change-msg" style="font-size:.78rem;margin-top:.5rem;text-align:center;display:none"></div>
          </div>

          <!-- Tab: Docs -->
          <div id="tab-docs" class="card-box" style="display:none">
            <div style="font-weight:700;margin-bottom:1rem;font-size:.95rem">📤 Tài Liệu Đã Tải Lên <span class="cnt-badge" id="my-docs-count">0</span></div>
            <div id="my-docs-list" style="max-height:500px;overflow-y:auto"></div>
          </div>

          <!-- Tab: History -->
          <div id="tab-history" class="card-box" style="display:none">
            <div style="font-weight:700;margin-bottom:1rem;font-size:.95rem">🕐 Lịch Sử Tải Xuống Gần Đây</div>
            <div id="my-dl-history" style="max-height:500px;overflow-y:auto"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Load data
  try {
    const user = await api('GET', '/api/auth/me');
    const stats = await api('GET', '/api/auth/profile/stats');

    // Populate form
    document.getElementById('edit-fullname').value = user.full_name || '';
    document.getElementById('edit-email').value = user.email || '';
    document.getElementById('edit-phone').value = user.phone || '';
    document.getElementById('edit-bio').value = user.bio || '';
    
    if (user.full_name) document.getElementById('profile-fullname-display').textContent = user.full_name;
    if (user.avatar_url) {
      document.getElementById('avatar-preview').style.backgroundImage = `url(${user.avatar_url})`;
      document.getElementById('avatar-preview').style.backgroundSize = 'cover';
      document.getElementById('avatar-preview').innerHTML = '';
    }

    // Stats
    document.getElementById('ps-uploaded').textContent = stats.uploaded;
    document.getElementById('ps-downloaded').textContent = stats.downloaded;
    document.getElementById('ps-mydl').textContent = stats.my_docs_total_downloads;
    document.getElementById('ps-fav').textContent = 0;

    // My docs list
    const myDocsList = document.getElementById('my-docs-list');
    const myDocsCnt = document.getElementById('my-docs-count');
    myDocsCnt.textContent = stats.my_docs.length;
    if (!stats.my_docs.length) {
      myDocsList.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-2)"><div style="font-size:2rem;margin-bottom:.5rem">📭</div><div>Chưa tải lên tài liệu nào</div></div>';
    } else {
      myDocsList.innerHTML = `<table class="admin-table">
        <thead><tr><th></th><th>Tên tài liệu</th><th>Môn</th><th>Kích thước</th><th>Lượt tải</th><th>Ngày tải</th></tr></thead>
        <tbody>
        ${stats.my_docs.map(d => `<tr>
          <td>${TYPE_ICON[d.filetype]||'📁'}</td>
          <td style="font-size:.82rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.title}</td>
          <td><span class="subj-tag" style="font-size:.7rem">${d.subject}</span></td>
          <td style="font-size:.78rem">${fmt(d.size)}</td>
          <td style="font-size:.78rem;font-weight:600;color:var(--primary)">${d.downloads}</td>
          <td style="font-size:.78rem">${fmtDate(d.created_at)}</td>
        </tr>`).join('')}
        </tbody>
      </table>`;
    }

    // Download history
    const histEl = document.getElementById('my-dl-history');
    if (!stats.recent_downloads.length) {
      histEl.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-2)"><div style="font-size:2rem;margin-bottom:.5rem">📭</div><div>Chưa có lịch sử tải xuống</div></div>';
    } else {
      histEl.innerHTML = `<table class="admin-table">
        <thead><tr><th></th><th>Tên tài liệu</th><th>Môn</th><th>Thời gian</th></tr></thead>
        <tbody>
        ${stats.recent_downloads.map(d => `<tr>
          <td>${TYPE_ICON[d.filetype]||'📁'}</td>
          <td style="font-size:.82rem;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.title}</td>
          <td><span class="subj-tag" style="font-size:.7rem">${d.subject}</span></td>
          <td style="font-size:.78rem">${fmtDate(d.downloaded_at)}</td>
        </tr>`).join('')}
        </tbody>
      </table>`;
    }
  } catch(e) { showToast('Lỗi tải thông tin hồ sơ', 'err'); }

  // Save profile
  document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
    const full_name = document.getElementById('edit-fullname').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const btn = document.getElementById('save-profile-btn');
    const msg = document.getElementById('profile-save-msg');
    
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';
    try {
      await api('PUT', '/api/auth/profile', { full_name, email, phone, bio });
      msg.style.display = 'block';
      msg.style.color = 'var(--green)';
      msg.textContent = '✅ Đã lưu thành công!';
      if (full_name) document.getElementById('profile-fullname-display').textContent = full_name;
    } catch(e) {
      msg.style.display = 'block';
      msg.style.color = 'var(--red)';
      msg.textContent = '❌ ' + e.message;
    }
    btn.disabled = false;
    btn.textContent = '💾 Lưu Thay Đổi';
    setTimeout(() => msg.style.display = 'none', 3000);
  });

  // Change password
  document.getElementById('change-pwd-btn')?.addEventListener('click', async () => {
    const old_password = document.getElementById('pwd-old').value;
    const new_password = document.getElementById('pwd-new').value;
    const confirm_password = document.getElementById('pwd-confirm').value;
    const msg = document.getElementById('pwd-change-msg');
    
    if (!old_password || !new_password || !confirm_password) {
      msg.style.display = 'block';
      msg.style.color = 'var(--red)';
      msg.textContent = '❌ Vui lòng điền tất cả các trường';
      return;
    }
    if (new_password !== confirm_password) {
      msg.style.display = 'block';
      msg.style.color = 'var(--red)';
      msg.textContent = '❌ Mật khẩu xác nhận không khớp';
      return;
    }
    if (new_password.length < 6) {
      msg.style.display = 'block';
      msg.style.color = 'var(--red)';
      msg.textContent = '❌ Mật khẩu tối thiểu 6 ký tự';
      return;
    }

    const btn = document.getElementById('change-pwd-btn');
    btn.disabled = true;
    btn.textContent = 'Đang đổi...';
    try {
      await api('POST', '/api/auth/change-password', { old_password, new_password });
      msg.style.display = 'block';
      msg.style.color = 'var(--green)';
      msg.textContent = '✅ Đã đổi mật khẩu thành công!';
      document.getElementById('pwd-old').value = '';
      document.getElementById('pwd-new').value = '';
      document.getElementById('pwd-confirm').value = '';
    } catch(e) {
      msg.style.display = 'block';
      msg.style.color = 'var(--red)';
      msg.textContent = '❌ ' + e.message;
    }
    btn.disabled = false;
    btn.textContent = '🔄 Đổi Mật Khẩu';
    setTimeout(() => msg.style.display = 'none', 3000);
  });
}
/* ── PREVIEW PDF ── */
window.previewDoc = async function(id) {
  if (!currentUser) { showToast('Vui lòng đăng nhập để xem trước', 'warn'); return; }
  document.getElementById('preview-modal')?.remove();

  try {
    const doc = await api('GET', `/api/documents/${id}`);
    if (!doc) return;
    
    const pdfUrl = `/uploads/${doc.filename}`;
    
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-head">
          <h6>👁 Xem Trước Tài Liệu</h6>
          <div style="display:flex;gap:.5rem">
            <button class="btn-close-modal" onclick="downloadDoc(${id})">⬇ Tải Xuống</button>
            <button class="btn-close-modal" onclick="document.getElementById('preview-modal').remove()">✕ Đóng</button>
          </div>
        </div>
        <embed src="${pdfUrl}" type="application/pdf" style="flex:1;width:100%;height:100%;" />
      </div>
    `;
    
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
  } catch(e) {
    showToast('Lỗi tải tài liệu', 'err');
  }
};

/* ═══════════════════════════════════════════════════
   UDEMY COURSE INTELLIGENCE — main.js
═══════════════════════════════════════════════════ */

const API = '';   // same-origin — server serves both API and frontend

/* ════════════════════════════
   STATE
════════════════════════════ */
let analyticsLoaded = false;
let coursesLoaded   = false;
let searchTimer     = null;
let currentPage     = 1;

/* ════════════════════════════
   CHART CONFIG DEFAULTS
════════════════════════════ */
const CHART_DEFAULTS = {
  plugins: {
    legend: { labels: { color: '#9b9bac', font: { family: 'Sora', size: 11 }, padding: 14 } }
  },
  scales: {
    x: { ticks: { color: '#9b9bac', font: { family: 'Sora', size: 11 } }, grid: { color: '#2e2e38' } },
    y: { ticks: { color: '#9b9bac', font: { family: 'Sora', size: 11 } }, grid: { color: '#2e2e38' } }
  }
};

const PALETTE = {
  purple: 'rgba(86,36,208,.75)',
  orange: 'rgba(244,162,27,.75)',
  green:  'rgba(34,197,94,.75)',
  blue:   'rgba(56,189,248,.75)',
  red:    'rgba(232,68,58,.75)',
};

/* ════════════════════════════
   UTILITIES
════════════════════════════ */
const fmt  = n => (n == null ? '—' : Number(n).toLocaleString());
const fmtK = n => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n);
const pct  = (v, max) => Math.min(100, Math.round((v / max) * 100));

const SUBJECT_CLS = {
  'Business Finance':  'biz',
  'Graphic Design':    'des',
  'Musical Instruments': 'mus',
  'Web Development':   'web',
};
const LEVEL_CLS = {
  'All Levels':        'all',
  'Beginner Level':    'beg',
  'Intermediate Level':'int',
  'Expert Level':      'exp',
};
const SUBJECT_COLOR = {
  'Business Finance':    '#38bdf8',
  'Graphic Design':      '#f4a21b',
  'Musical Instruments': '#22c55e',
  'Web Development':     '#7c3cff',
};

function subjectChip(s) {
  return `<span class="subject-chip ${SUBJECT_CLS[s]||'biz'}">${s}</span>`;
}
function levelDot(l) {
  const label = l.replace(' Level','').replace('All Levels','All');
  return `<span class="level-dot ${LEVEL_CLS[l]||'all'}">${label}</span>`;
}
function priceTag(p) {
  return p === 0
    ? `<span class="price-tag free">FREE</span>`
    : `<span class="price-tag paid">$${p}</span>`;
}
function rankBadge(i) {
  const cls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
  return `<span class="rank-badge ${cls}">${i+1}</span>`;
}
function loader() {
  return `<div class="loader"><div class="spinner"></div> Loading…</div>`;
}

/* ════════════════════════════
   NAVIGATION
════════════════════════════ */
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');

  if (name === 'analytics' && !analyticsLoaded) loadAnalytics();
  if (name === 'courses'   && !coursesLoaded)   fetchCourses(1);
}

/* ════════════════════════════
   ANALYTICS
════════════════════════════ */
async function loadAnalytics() {
  try {
    const res  = await fetch(`${API}/api/analytics`);
    const data = await res.json();
    analyticsLoaded = true;
    renderStatCards(data);
    renderChartsRow1(data);
    renderChartsRow2(data);
    renderTopTable(data.top_courses);
  } catch (e) {
    console.error('Analytics load failed:', e);
  }
}

function renderStatCards(d) {
  document.getElementById('stat-grid').innerHTML = `
    <div class="stat-card c-purple">
      <div class="stat-icon"><i class="fas fa-book-open"></i></div>
      <div class="stat-label">Total Courses</div>
      <div class="stat-value">${fmt(d.total_courses)}</div>
      <div class="stat-sub">Across 4 subjects</div>
    </div>
    <div class="stat-card c-orange">
      <div class="stat-icon"><i class="fas fa-users"></i></div>
      <div class="stat-label">Total Subscribers</div>
      <div class="stat-value">${fmtK(d.total_subscribers)}</div>
      <div class="stat-sub">Combined enrollment</div>
    </div>
    <div class="stat-card c-green">
      <div class="stat-icon"><i class="fas fa-star"></i></div>
      <div class="stat-label">Total Reviews</div>
      <div class="stat-value">${fmtK(d.total_reviews)}</div>
      <div class="stat-sub">Student feedback</div>
    </div>
    <div class="stat-card c-blue">
      <div class="stat-icon"><i class="fas fa-gift"></i></div>
      <div class="stat-label">Free Courses</div>
      <div class="stat-value">${fmt(d.free_courses)}</div>
      <div class="stat-sub">${Math.round(d.free_courses/d.total_courses*100)}% of catalog</div>
    </div>
    <div class="stat-card c-orange">
      <div class="stat-icon"><i class="fas fa-tag"></i></div>
      <div class="stat-label">Avg Paid Price</div>
      <div class="stat-value">$${d.avg_price}</div>
      <div class="stat-sub">Per paid course</div>
    </div>
    <div class="stat-card c-red">
      <div class="stat-icon"><i class="fas fa-lock"></i></div>
      <div class="stat-label">Paid Courses</div>
      <div class="stat-value">${fmt(d.paid_courses)}</div>
      <div class="stat-sub">${Math.round(d.paid_courses/d.total_courses*100)}% monetized</div>
    </div>`;
}

function mkChart(id, config) {
  const ctx = document.getElementById(id).getContext('2d');
  return new Chart(ctx, config);
}

function chartCard(id, icon, title, subtitle, extraClass = '') {
  return `
    <div class="chart-card">
      <div class="chart-title"><i class="fas ${icon}"></i> ${title}</div>
      <div class="chart-subtitle">${subtitle}</div>
      <div class="chart-wrap ${extraClass}"><canvas id="${id}"></canvas></div>
    </div>`;
}

function renderChartsRow1(d) {
  document.getElementById('charts-row1').innerHTML =
    chartCard('c-subj-subs',  'fa-chart-bar',    'Subscribers by Subject',  'Total enrollment per category') +
    chartCard('c-price-dist', 'fa-chart-pie',     'Price Distribution',       'Courses by price range') +
    chartCard('c-level-dist', 'fa-signal',        'Courses by Level',         'Distribution across difficulty levels');

  const subjs = d.by_subject;
  mkChart('c-subj-subs', {
    type: 'bar',
    data: {
      labels: subjs.map(s => s.subject.split(' ')[0]),
      datasets: [{
        label: 'Subscribers',
        data: subjs.map(s => s.total_subscribers),
        backgroundColor: [PALETTE.blue, PALETTE.orange, PALETTE.green, PALETTE.purple],
        borderRadius: 6,
      }]
    },
    options: { ...CHART_DEFAULTS, plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
  });

  const pd = d.price_distribution;
  mkChart('c-price-dist', {
    type: 'doughnut',
    data: {
      labels: Object.keys(pd),
      datasets: [{
        data: Object.values(pd),
        backgroundColor: [PALETTE.green, PALETTE.blue, PALETTE.orange, PALETTE.red],
        borderColor: '#18181c', borderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { color: '#9b9bac', font: { family: 'Sora', size: 11 }, padding: 16 } } }
    }
  });

  const lvls = d.by_level;
  mkChart('c-level-dist', {
    type: 'bar',
    data: {
      labels: lvls.map(l => l.level.replace(' Level','').replace('All Levels','All')),
      datasets: [{
        label: 'Courses',
        data: lvls.map(l => l.count),
        backgroundColor: [PALETTE.orange, PALETTE.green, PALETTE.blue, PALETTE.red],
        borderRadius: 6,
      }]
    },
    options: { ...CHART_DEFAULTS, plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
  });
}

function renderChartsRow2(d) {
  document.getElementById('charts-row2').innerHTML =
    chartCard('c-yearly',       'fa-calendar',      'Publications by Year',       'Courses published per year') +
    chartCard('c-avg-subs',     'fa-trending-up',   'Avg Subscribers by Year',    'Earlier courses have more subscribers') +
    chartCard('c-avg-price',    'fa-dollar-sign',   'Avg Price by Subject',       'Pricing strategy comparison');

  const years = d.yearly_trends;
  mkChart('c-yearly', {
    type: 'line',
    data: {
      labels: years.map(y => y.published_year),
      datasets: [{
        label: 'Courses Published',
        data: years.map(y => y.count),
        borderColor: 'rgba(86,36,208,1)',
        backgroundColor: 'rgba(86,36,208,.15)',
        fill: true, tension: 0.4, pointRadius: 4,
        pointBackgroundColor: 'rgba(86,36,208,1)',
      }]
    },
    options: { ...CHART_DEFAULTS, responsive: true, maintainAspectRatio: false }
  });

  mkChart('c-avg-subs', {
    type: 'bar',
    data: {
      labels: years.map(y => y.published_year),
      datasets: [{
        label: 'Avg Subscribers',
        data: years.map(y => Math.round(y.avg_subscribers)),
        backgroundColor: PALETTE.orange, borderRadius: 6,
      }]
    },
    options: { ...CHART_DEFAULTS, plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
  });

  const subjs = d.by_subject;
  mkChart('c-avg-price', {
    type: 'bar',
    data: {
      labels: subjs.map(s => s.subject.split(' ')[0]),
      datasets: [{
        label: 'Avg Price ($)',
        data: subjs.map(s => s.avg_price),
        backgroundColor: [PALETTE.purple, PALETTE.orange, PALETTE.green, PALETTE.blue],
        borderRadius: 6,
      }]
    },
    options: { ...CHART_DEFAULTS, plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
  });
}

function renderTopTable(courses) {
  const maxSubs = Math.max(...courses.map(c => c.num_subscribers));
  const rows = courses.map((c, i) => `
    <tr onclick="openModal(${c.course_id})">
      <td>${rankBadge(i)}</td>
      <td style="max-width:280px">
        <div style="font-size:13px;font-weight:600;line-height:1.35">${c.course_title}</div>
      </td>
      <td>${subjectChip(c.subject)}</td>
      <td>${levelDot(c.level)}</td>
      <td>${priceTag(c.price)}</td>
      <td>
        <div class="subs-bar-wrap">
          <div class="subs-bar"><div class="subs-bar-fill" style="width:${pct(c.num_subscribers,maxSubs)}%"></div></div>
          <span class="subs-num">${fmtK(c.num_subscribers)}</span>
        </div>
      </td>
      <td style="font-family:var(--font-mono);font-size:12px">${fmt(c.num_reviews)}</td>
      <td style="font-family:var(--font-mono);font-size:12px">${c.content_duration}h</td>
    </tr>`).join('');

  document.getElementById('top-table-body').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th><th>Course Title</th><th>Subject</th><th>Level</th>
          <th>Price</th><th>Subscribers</th><th>Reviews</th><th>Duration</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* ════════════════════════════
   COURSES BROWSER
════════════════════════════ */
function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchCourses(1), 380);
}

function getPriceParams() {
  const v = document.getElementById('filter-price').value;
  if (v === 'free') return '&min_price=0&max_price=0';
  if (v === 'paid') return '&min_price=1';
  if (v === 'low')  return '&min_price=1&max_price=50';
  if (v === 'high') return '&min_price=100';
  return '';
}

async function fetchCourses(page = 1) {
  currentPage = page;
  coursesLoaded = true;

  const search  = document.getElementById('search-input').value.trim();
  const subject = document.getElementById('filter-subject').value;
  const level   = document.getElementById('filter-level').value;
  const sort    = document.getElementById('filter-sort').value;
  const price   = getPriceParams();

  document.getElementById('courses-grid').innerHTML = loader();
  document.getElementById('results-info').textContent = '';

  let url = `${API}/api/courses?page=${page}&per_page=24&sort_by=${sort}${price}`;
  if (search)            url += `&search=${encodeURIComponent(search)}`;
  if (subject !== 'all') url += `&subject=${encodeURIComponent(subject)}`;
  if (level   !== 'all') url += `&level=${encodeURIComponent(level)}`;

  const res  = await fetch(url);
  const data = await res.json();
  renderCourses(data);
}

function renderCourses(data) {
  const { page, per_page, total, courses } = data;
  const from = ((page - 1) * per_page) + 1;
  const to   = Math.min(page * per_page, total);
  document.getElementById('results-info').textContent =
    `Showing ${fmt(from)}–${fmt(to)} of ${fmt(total)} courses`;

  if (!courses.length) {
    document.getElementById('courses-grid').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon"><i class="fas fa-search"></i></div>
        <h3>No courses found</h3>
        <p>Try adjusting your search filters</p>
      </div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  document.getElementById('courses-grid').innerHTML = courses.map(c => `
    <div class="course-card" onclick="openModal(${c.course_id})">
      <div class="course-card-top-bar"></div>
      <div class="course-card-body">
        <div class="course-card-subject" style="color:${SUBJECT_COLOR[c.subject]||'#9b9bac'}">${c.subject}</div>
        <div class="course-card-title">${c.course_title}</div>
        <div class="course-card-meta">
          <span><i class="fas fa-graduation-cap"></i> ${c.level.replace(' Level','')}</span>
          <span><i class="fas fa-clock"></i> ${c.content_duration}h</span>
          <span><i class="fas fa-list"></i> ${c.num_lectures} lectures</span>
          <span><i class="fas fa-users"></i> ${fmtK(c.num_subscribers)}</span>
        </div>
      </div>
      <div class="course-card-footer">
        <div class="course-price-lg ${c.price === 0 ? 'free' : ''}">${c.price === 0 ? 'FREE' : '$' + c.price}</div>
        <span style="font-size:11px;color:var(--text-muted)"><i class="fas fa-star" style="color:#f4a21b"></i> ${fmt(c.num_reviews)} reviews</span>
      </div>
    </div>`).join('');

  renderPagination(data);
}

function renderPagination(data) {
  const { page, pages } = data;
  if (pages <= 1) { document.getElementById('pagination').innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="fetchCourses(${page-1})" ${page===1?'disabled':''}><i class="fas fa-chevron-left"></i></button>`;

  const range = [...new Set([1, 2, page-1, page, page+1, pages-1, pages])]
    .filter(p => p >= 1 && p <= pages).sort((a, b) => a - b);

  let prev = null;
  for (const p of range) {
    if (prev !== null && p - prev > 1) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-btn ${p === page ? 'active' : ''}" onclick="fetchCourses(${p})">${p}</button>`;
    prev = p;
  }

  html += `<button class="page-btn" onclick="fetchCourses(${page+1})" ${page===pages?'disabled':''}><i class="fas fa-chevron-right"></i></button>`;
  document.getElementById('pagination').innerHTML = html;
}

/* ════════════════════════════
   MODAL
════════════════════════════ */
async function openModal(courseId) {
  const res = await fetch(`${API}/api/courses/${courseId}`);
  if (!res.ok) return;
  const c = await res.json();

  document.getElementById('modal-subject').textContent = c.subject;
  document.getElementById('modal-title').textContent   = c.course_title;
  document.getElementById('modal-price').textContent   = c.price === 0 ? 'FREE' : '$' + c.price;
  document.getElementById('modal-subs').textContent    = fmtK(c.num_subscribers);
  document.getElementById('modal-reviews').textContent = fmt(c.num_reviews);
  document.getElementById('modal-lectures').textContent= c.num_lectures;
  document.getElementById('modal-duration').textContent= c.content_duration + 'h';
  document.getElementById('modal-level').textContent   = c.level;
  document.getElementById('modal-cid').textContent     = c.course_id;

  document.getElementById('modal-udemy-btn').onclick = () => window.open(c.url, '_blank');
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.getElementById('modal-overlay').classList.remove('open');
});

/* ════════════════════════════
   INIT
════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadAnalytics();
});
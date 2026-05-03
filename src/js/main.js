import { CREATORS, JOBS } from './data.js';
import { createCreatorCard, createJobCard } from './components.js';
import { filterCreators, sortCreators, filterJobs, sortJobs } from './browse.js';
import {
  getSession,
  saveSession,
  patchSession,
  clearSession,
  demoRoleFromEmail,
  getPostedJobs,
  addPostedJob,
} from './session.js';

const MAIN_NAV_IDS = ['home', 'creators', 'jobs', 'pricing', 'how', 'contact'];
const FOOTER_ONLY_VIEWS = ['trust-safety', 'terms', 'privacy', 'guidelines', 'report-user', 'report-job', 'dispute'];
const FLOW_IDS = [
  'signin',
  'signup-role',
  'onboard-creator',
  'onboard-business',
  'creator-profile',
  'creator-dash',
  'business-dash',
  'post-job',
  'admin-dash',
];

const ALL_VIEWS = [...MAIN_NAV_IDS, ...FOOTER_ONLY_VIEWS, ...FLOW_IDS];

let creatorChipFilter = 'all';

/** Sample listings + locally posted jobs (same shape as `JOBS`). */
function getBrowseJobs() {
  const posted = getPostedJobs().map((p) => ({
    id: p.id,
    icon: p.icon || '📋',
    biz: p.biz || 'Business',
    title: p.title,
    city: p.city || '—',
    badge: p.badge || 'b-once',
    label: p.label || 'One-time',
    pay: p.pay || p.budget || '—',
    pl: p.pl || 'flat fee',
  }));
  return [...posted, ...JOBS];
}

function refreshHomeFeatured() {
  const hc = document.getElementById('home-cg');
  const hj = document.getElementById('home-jl');
  if (hc) hc.innerHTML = CREATORS.slice(0, 3).map(createCreatorCard).join('');
  if (hj) hj.innerHTML = getBrowseJobs().slice(0, 4).map(createJobCard).join('');
}

function runDashboardHooks(viewId) {
  if (viewId === 'home') refreshHomeFeatured();
  if (viewId === 'jobs') updateJobsBrowseAccess();
  if (viewId === 'creator-dash') refreshCreatorDash();
  if (viewId === 'business-dash') refreshBusinessDash();
  if (viewId === 'admin-dash') refreshAdminDash();
}

window.nav = function (id, btn) {
  ALL_VIEWS.forEach((t) => {
    const el = document.getElementById(t);
    if (el) el.style.display = t === id ? 'block' : 'none';
  });
  const cta = document.getElementById('cta');
  if (cta) {
    const showCta = ['home', 'creators', 'jobs'].includes(id);
    cta.style.display = showCta ? 'block' : 'none';
  }
  document.querySelectorAll('.nl-btn').forEach((b) => b.classList.remove('on'));
  if (btn && MAIN_NAV_IDS.includes(id)) btn.classList.add('on');
  runDashboardHooks(id);
};

window.showView = function (id) {
  nav(id, null);
};

window.contactFormDemo = function () {
  const email = document.getElementById('contact-email')?.value.trim();
  const msg = document.getElementById('contact-msg')?.value.trim();
  if (!email || !msg) {
    alert('Add your email and a message (demo).');
    return;
  }
  alert('Thanks — this form is a placeholder. Wire it to your inbox or support tool before launch.');
};

window.goHome = function () {
  if (window.location.hash) {
    history.replaceState(null, '', window.location.href.split('#')[0]);
  }
  const first = document.querySelector('.nl-btn');
  nav('home', first);
};

window.refreshNavAuth = function refreshNavAuth() {
  const s = getSession();
  const guest = document.getElementById('nav-guest');
  const user = document.getElementById('nav-user');
  const label = document.getElementById('nav-user-label');
  if (guest) {
    if (s) guest.setAttribute('hidden', '');
    else guest.removeAttribute('hidden');
  }
  if (user) {
    if (!s) user.setAttribute('hidden', '');
    else user.removeAttribute('hidden');
  }
  if (label) {
    if (s) {
      const t = s.displayName || s.email || 'Account';
      label.textContent = t;
      label.setAttribute('title', t);
    } else {
      label.textContent = '';
      label.removeAttribute('title');
    }
  }
  updateJobsBrowseAccess();
};

window.logout = function () {
  clearSession();
  refreshNavAuth();
  goHome();
};

window.goDashboard = function () {
  const s = getSession();
  if (!s) {
    showView('signin');
    return;
  }
  routeAfterAuth(s);
};

function routeAfterAuth(session) {
  if (session.role === 'admin') {
    patchSession({ onboarded: true });
    showView('admin-dash');
    refreshAdminDash();
    return;
  }
  if (!session.onboarded) {
    if (session.role === 'business') {
      wizBStep = 1;
      wizBusinessRender();
      showView('onboard-business');
    } else {
      wizCStep = 1;
      wizCreatorRender();
      showView('onboard-creator');
    }
    return;
  }
  if (session.role === 'business') {
    showView('business-dash');
    refreshBusinessDash();
  } else {
    showView('creator-dash');
    refreshCreatorDash();
  }
}

window.submitSignIn = function () {
  const email = document.getElementById('signin-email')?.value.trim();
  const pass = document.getElementById('signin-pass')?.value;
  if (!email || !pass) {
    alert('Enter email and password (demo accepts any password).');
    return;
  }
  const role = demoRoleFromEmail(email);
  const prev = getSession();
  let session;
  if (prev && prev.email === email) {
    session = { ...prev, role };
  } else {
    session = {
      email,
      role,
      onboarded: false,
      displayName: email.split('@')[0],
    };
  }
  if (role === 'admin') session.onboarded = true;
  saveSession(session);
  refreshNavAuth();
  routeAfterAuth(session);
};

window.demoAdminLogin = function () {
  saveSession({
    email: 'admin@demo.com',
    role: 'admin',
    onboarded: true,
    displayName: 'Platform admin',
  });
  refreshNavAuth();
  showView('admin-dash');
  refreshAdminDash();
};

let wizCStep = 1;

window.startCreatorSignup = function () {
  showView('onboard-creator');
  wizCStep = 1;
  wizCreatorRender();
};

window.wizCreatorPrev = function () {
  if (wizCStep <= 1) return;
  wizCStep--;
  wizCreatorRender();
};

window.wizCreatorNext = function () {
  if (!validateCreatorStep(wizCStep)) return;
  if (wizCStep >= 4) {
    finishCreatorOnboarding();
    return;
  }
  wizCStep++;
  wizCreatorRender();
};

function validateCreatorStep(step) {
  if (step === 1) {
    const name = document.getElementById('oc-name')?.value.trim();
    const email = document.getElementById('oc-email')?.value.trim();
    const niches = document.querySelectorAll('input[name="oc-niche"]:checked');
    if (!name || !email) {
      alert('Add your display name and email.');
      return false;
    }
    if (!niches.length) {
      alert('Pick at least one specialty.');
      return false;
    }
  }
  return true;
}

function wizCreatorRender() {
  document.querySelectorAll('[data-wiz-c]').forEach((el) => {
    el.hidden = Number(el.dataset.wizC) !== wizCStep;
  });
  const ind = document.getElementById('wiz-c-ind');
  const fill = document.getElementById('wiz-c-fill');
  const prev = document.getElementById('wiz-c-prev');
  const next = document.getElementById('wiz-c-next');
  if (ind) ind.textContent = `Step ${wizCStep} of 4`;
  if (fill) fill.style.width = `${(wizCStep / 4) * 100}%`;
  if (prev) prev.hidden = wizCStep === 1;
  if (next) next.textContent = wizCStep === 4 ? 'Finish & open dashboard' : 'Continue';
}

function finishCreatorOnboarding() {
  const niches = [...document.querySelectorAll('input[name="oc-niche"]:checked')].map((i) => i.value);
  const days = [...document.querySelectorAll('input[name="oc-day"]:checked')].map((i) => i.value);
  const prev = getSession() || {};
  saveSession({
    ...prev,
    email: document.getElementById('oc-email').value.trim(),
    role: 'creator',
    onboarded: true,
    displayName: document.getElementById('oc-name').value.trim(),
    creatorProfile: {
      niches,
      portfolioNote: document.getElementById('oc-portfolio')?.value.trim() || '',
      rateType: document.getElementById('oc-rate-type')?.value,
      rateMin: document.getElementById('oc-rate-min')?.value,
      rateMax: document.getElementById('oc-rate-max')?.value,
      days,
      takingClients: document.getElementById('oc-open')?.checked ?? true,
    },
  });
  refreshNavAuth();
  showView('creator-dash');
  refreshCreatorDash();
}

let wizBStep = 1;

window.startBusinessSignup = function () {
  showView('onboard-business');
  wizBStep = 1;
  wizBusinessRender();
};

window.wizBusinessPrev = function () {
  if (wizBStep <= 1) return;
  wizBStep--;
  wizBusinessRender();
};

window.wizBusinessNext = function () {
  if (!validateBusinessStep(wizBStep)) return;
  if (wizBStep >= 3) {
    finishBusinessOnboarding();
    return;
  }
  wizBStep++;
  wizBusinessRender();
};

function validateBusinessStep(step) {
  if (step === 1) {
    const email = document.getElementById('ob-email')?.value.trim();
    const name = document.getElementById('ob-name')?.value.trim();
    if (!email || !name) {
      alert('Business email and name are required.');
      return false;
    }
  }
  if (step === 2) {
    const city = document.getElementById('ob-city')?.value.trim();
    if (!city) {
      alert('Add your city.');
      return false;
    }
  }
  if (step === 3) {
    const contact = document.getElementById('ob-contact')?.value.trim();
    if (!contact) {
      alert('Add a primary contact name.');
      return false;
    }
  }
  return true;
}

function wizBusinessRender() {
  document.querySelectorAll('[data-wiz-b]').forEach((el) => {
    el.hidden = Number(el.dataset.wizB) !== wizBStep;
  });
  const ind = document.getElementById('wiz-b-ind');
  const fill = document.getElementById('wiz-b-fill');
  const prev = document.getElementById('wiz-b-prev');
  const next = document.getElementById('wiz-b-next');
  if (ind) ind.textContent = `Step ${wizBStep} of 3`;
  if (fill) fill.style.width = `${(wizBStep / 3) * 100}%`;
  if (prev) prev.hidden = wizBStep === 1;
  if (next) next.textContent = wizBStep === 3 ? 'Finish & open dashboard' : 'Continue';
}

function finishBusinessOnboarding() {
  const prev = getSession() || {};
  saveSession({
    ...prev,
    email: document.getElementById('ob-email').value.trim(),
    role: 'business',
    onboarded: true,
    displayName: document.getElementById('ob-name').value.trim(),
    businessProfile: {
      businessName: document.getElementById('ob-name').value.trim(),
      type: document.getElementById('ob-type').value,
      city: document.getElementById('ob-city').value.trim(),
      region: document.getElementById('ob-region').value.trim(),
      contactName: document.getElementById('ob-contact').value.trim(),
      phone: document.getElementById('ob-phone').value.trim(),
    },
  });
  refreshNavAuth();
  showView('business-dash');
  refreshBusinessDash();
}

window.openCreatorProfile = function (slug) {
  if (!slug) return;
  history.replaceState(null, '', `#profile/${slug}`);
  showView('creator-profile');
  renderCreatorProfile(slug);
};

function renderCreatorProfile(slug) {
  const c = CREATORS.find((x) => x.slug === slug);
  const root = document.getElementById('creator-profile-root');
  if (!root) return;
  if (!c) {
    root.innerHTML = '<p class="flow-hint">Creator not found.</p>';
    return;
  }
  sessionStorage.setItem('lastProfileSlug', slug);
  root.innerHTML = `
    <div class="profile-layout">
      <div class="profile-hero card card-pad">
        <div class="profile-hero-main">
          <div class="ava ava-xl" style="background:${c.bg};color:${c.tc}">${c.i}</div>
          <div>
            <h1 class="profile-name">${c.name}</h1>
            <p class="profile-meta">${c.city} · ${c.type}</p>
            <div class="profile-tags">${c.tags.map((t) => `<span class="tag">${t}</span>`).join(' ')}
              ${c.avail ? '<span class="b-avail">Available</span>' : '<span class="b-busy">Booked</span>'}</div>
          </div>
        </div>
        <div class="profile-hero-actions">
          <button type="button" class="btn btn-green profile-book" onclick="requestBookingDemo('${slug}')">Request booking</button>
          <button type="button" class="btn btn-text-sm profile-report" onclick="openReportUser('${slug}')">Report profile</button>
        </div>
      </div>
      <div class="profile-grid">
        <section class="card card-pad">
          <h2 class="profile-section-title">Rates &amp; stats</h2>
          <p><strong>${c.rate}</strong></p>
          <p class="muted">${c.rating} ★ average · ${c.jobs} jobs completed on-platform</p>
        </section>
        <section class="card card-pad">
          <h2 class="profile-section-title">Portfolio</h2>
          <p class="muted">Portfolio uploads and verified reels appear here after onboarding (demo).</p>
        </section>
      </div>
    </div>`;
}

window.requestBookingDemo = function (slug) {
  window.alert(
    'Booking request queued (demo). In production this opens messaging and sends an invite with calendar slots.'
  );
};

window.dashCreatorTab = function (key) {
  document.querySelectorAll('[data-dc-tab]').forEach((b) => b.classList.toggle('on', b.dataset.dcTab === key));
  ['jobs', 'earn', 'ratings', 'msgs'].forEach((k) => {
    const el = document.getElementById(`dc-panel-${k}`);
    if (el) el.hidden = k !== key;
  });
};

window.dashBizTab = function (key) {
  document.querySelectorAll('[data-db-tab]').forEach((b) => b.classList.toggle('on', b.dataset.dbTab === key));
  ['post', 'apps', 'pay'].forEach((k) => {
    const el = document.getElementById(`db-panel-${k}`);
    if (el) el.hidden = k !== key;
  });
};

const MOCK_CREATOR_JOBS = [
  ['Short-form reel — brunch launch', 'Taco Fuego', 'In progress', 'May 12'],
  ['Menu photography refresh', 'Grilled Cheese Lab', 'Delivered — payout pending', 'May 02'],
];

const MOCK_MSGS_CREATOR = [
  ['Taco Fuego', 'Can you shoot Saturday afternoon?', '2h ago'],
  ['Sakura Kitchen', 'Sent contract draft — please review', 'Yesterday'],
];

const MOCK_REVIEWS = [
  '“Fast turnaround and nailed our brand vibe.” — Taco Fuego',
  '“Professional on-site — would book again.” — Sakura Kitchen',
];

function refreshCreatorDash() {
  const s = getSession();
  const tbody = document.getElementById('creator-dash-jobs-body');
  if (tbody) {
    tbody.innerHTML = MOCK_CREATOR_JOBS.map(
      ([title, biz, st, due]) =>
        `<tr><td>${title}</td><td>${biz}</td><td><span class="pill-status">${st}</span></td><td>${due}</td></tr>`
    ).join('');
  }
  const ratingEl = document.getElementById('creator-dash-rating');
  if (ratingEl && s?.creatorProfile) ratingEl.textContent = '4.9';
  const reviews = document.getElementById('creator-dash-reviews');
  if (reviews) {
    reviews.innerHTML = MOCK_REVIEWS.map((t) => `<li>${t}</li>`).join('');
  }
  const msgs = document.getElementById('creator-dash-msgs');
  if (msgs) {
    msgs.innerHTML = MOCK_MSGS_CREATOR.map(
      ([from, preview, when]) =>
        `<li class="msg-li"><span class="msg-from">${from}</span><span class="msg-prev">${preview}</span><span class="msg-when">${when}</span></li>`
    ).join('');
  }
}

function refreshBusinessDash() {
  const posted = getPostedJobs();
  const tbody = document.getElementById('biz-dash-post-body');
  const rowsFromDemo = JOBS.map((j) => ({
    id: j.id,
    title: j.title,
    budget: j.pay,
    status: 'Open',
    applicants: 4,
    sample: true,
  }));
  const rows = [
    ...posted.map((p) => ({
      id: p.id,
      title: p.title,
      budget: p.pay || p.budget,
      status: p.status || 'Open',
      applicants: p.applicants ?? 0,
      sample: false,
    })),
    ...rowsFromDemo,
  ];
  if (tbody) {
    tbody.innerHTML = rows
      .map((r) => {
        const jid = r.id || '';
        return `<tr>
          <td>${r.title}${r.sample ? ' <span class="muted">(sample)</span>' : ''}</td>
          <td>${r.budget || r.pay || '—'}</td>
          <td>${r.status}</td>
          <td>${r.applicants ?? 0}</td>
          <td>${jid ? `<button type="button" class="link-btn" onclick="viewBusinessPosting('${jid}')">View posting</button>` : '—'}</td>
        </tr>`;
      })
      .join('');
  }

  const appsRoot = document.getElementById('biz-dash-apps-root');
  if (appsRoot) {
    appsRoot.innerHTML = `
      <div class="applicant-cards">
        <div class="applicant-card"><strong>Jasmine Moore</strong><p class="muted">Pitch: Two reels + 15 photos — weekend availability.</p>
          <button type="button" class="btn btn-outline-sm" onclick="bizApplicantDemo('Message','Jasmine Moore')">Message</button>
          <button type="button" class="btn btn-green btn-sm" onclick="bizApplicantDemo('Shortlist','Jasmine Moore')">Shortlist</button></div>
        <div class="applicant-card"><strong>Ray Kim</strong><p class="muted">Pitch: Event-style coverage + fast turnaround edit.</p>
          <button type="button" class="btn btn-outline-sm" onclick="bizApplicantDemo('Message','Ray Kim')">Message</button>
          <button type="button" class="btn btn-green btn-sm" onclick="bizApplicantDemo('Shortlist','Ray Kim')">Shortlist</button></div>
      </div>`;
  }

  const payBody = document.getElementById('biz-dash-pay-body');
  if (payBody) {
    payBody.innerHTML = `
      <tr><td>Menu photography refresh</td><td>$220 held</td><td><button type="button" class="btn btn-orange btn-sm" onclick="alert('Demo: releases escrow after approval.')">Release payment</button></td></tr>
      <tr><td>Monthly IG partnership</td><td>$600 held</td><td><span class="muted">Awaiting delivery</span></td></tr>`;
  }
}

const ADMIN_ACTIVITY = [
  '09:14 — Creator verified (Carlos Luna)',
  '08:02 — Dispute ticket opened (#4821)',
  'Yesterday — Payout batch settled ($21.4k)',
  'Yesterday — Business upgraded plan',
];

function refreshAdminDash() {
  const n = 3;
  const pend = document.getElementById('admin-pending-body');
  if (pend) {
    pend.innerHTML = CREATORS.slice(0, n)
      .map(
        (c) =>
          `<tr><td>${c.name}</td><td>${c.type}</td><td>May 1, 2026</td><td><button type="button" class="link-btn" onclick="openAdminDrawer('verify','${c.slug}')">Open</button></td></tr>`
      )
      .join('');
  }
  const vcount = document.getElementById('admin-verify-count');
  if (vcount) vcount.textContent = `${n} pending`;

  const db = document.getElementById('admin-disputes-body');
  if (db) {
    db.innerHTML = `
      <tr><td>#4821</td><td>Taco Fuego / freelancer</td><td><span class="pill-status">Open</span></td><td><button type="button" class="link-btn" onclick="openAdminDrawer('dispute','4821')">Open</button></td></tr>
      <tr><td>#4798</td><td>Sakura Kitchen / creator</td><td>Resolved</td><td><button type="button" class="link-btn" onclick="openAdminDrawer('dispute','4798')">Open</button></td></tr>`;
  }

  const rb = document.getElementById('admin-reports-body');
  if (rb) {
    rb.innerHTML = `
      <tr><td>R-901</td><td>User</td><td>Jasmine Moore</td><td>Medium</td><td><button type="button" class="link-btn" onclick="openAdminDrawer('report','R-901')">Open</button></td></tr>
      <tr><td>R-902</td><td>Job</td><td>Taco reel posting</td><td>Low</td><td><button type="button" class="link-btn" onclick="openAdminDrawer('report','R-902')">Open</button></td></tr>`;
  }

  const act = document.getElementById('admin-activity');
  if (act) {
    act.innerHTML = ADMIN_ACTIVITY.map((t) => `<li>${t}</li>`).join('');
  }
}

window.adminSwitchTab = function (tab) {
  const tabs = ['verify', 'disputes', 'reports', 'revenue', 'activity'];
  tabs.forEach((t) => {
    const panel = document.getElementById(`admin-panel-${t}`);
    const btn = document.getElementById(`admin-tab-btn-${t}`);
    const show = t === tab;
    if (panel) panel.hidden = !show;
    if (btn) btn.classList.toggle('on', show);
  });
};

window.openAdminDrawer = function (kind, ref) {
  const titleEl = document.getElementById('admin-drawer-title');
  const body = document.getElementById('admin-drawer-body');
  const shell = document.getElementById('admin-drawer');
  if (!titleEl || !body || !shell) return;

  if (kind === 'verify') {
    const c = CREATORS.find((x) => x.slug === ref);
    titleEl.textContent = 'Review creator verification';
    body.innerHTML = c
      ? `<p><strong>${c.name}</strong> · ${c.city}</p>
      <p class="muted">Portfolio: 12 assets (mock). ID check: <strong>pending</strong>. Specialty: ${c.type}.</p>
      <p class="muted">Attachments and reviewer checklist will load from your API. Primary actions below stay disabled in this wireframe.</p>`
      : '<p class="muted">Creator not found.</p>';
  } else if (kind === 'dispute') {
    titleEl.textContent = `Dispute #${ref}`;
    body.innerHTML = `<p>Parties, message timeline, escrow balance, and evidence uploads (all mock).</p>
      <p class="muted">Connect to your case management + payment provider to resolve in production.</p>`;
  } else if (kind === 'report') {
    titleEl.textContent = `Report ${ref}`;
    body.innerHTML = `<p>Reporter (redacted), target, category, and prior flags (mock).</p>
      <p class="muted">PII handling and retention belong in your privacy program.</p>`;
  } else {
    titleEl.textContent = 'Detail';
    body.innerHTML = '<p class="muted">No template for this type.</p>';
  }

  shell.hidden = false;
  shell.setAttribute('aria-hidden', 'false');
};

window.closeAdminDrawer = function () {
  const shell = document.getElementById('admin-drawer');
  if (!shell) return;
  shell.hidden = true;
  shell.setAttribute('aria-hidden', 'true');
};

window.openReportUser = function (slug) {
  const c = CREATORS.find((x) => x.slug === slug);
  const ruSlug = document.getElementById('ru-slug');
  const ruDisplay = document.getElementById('ru-display');
  if (ruSlug) ruSlug.value = slug || '';
  if (ruDisplay) ruDisplay.value = c ? `${c.name} (${c.city})` : slug ? `(profile ${slug})` : '';
  showView('report-user');
};

window.openReportJob = function (jobId) {
  const j = getBrowseJobs().find((x) => x.id === jobId);
  const rid = document.getElementById('rj-id');
  const rdisp = document.getElementById('rj-display');
  if (rid) rid.value = jobId || '';
  if (rdisp) rdisp.value = j ? `${j.title} — ${j.biz}` : jobId || '';
  showView('report-job');
};

window.applyToJobDemo = function (jobId) {
  const s = getSession();
  if (!s) {
    showView('signin');
    return;
  }
  if (s.role === 'business') {
    alert('Business accounts hire creators — browse creators instead.');
    nav('creators', document.querySelectorAll('.nl-btn')[1]);
    return;
  }
  if (s.role === 'admin') {
    alert('Sign in as a creator demo account to try applying.');
    return;
  }
  const j = getBrowseJobs().find((x) => x.id === jobId);
  const label = j ? `${j.title} (${j.biz})` : jobId;
  alert(`Application queued (demo) for: ${label}. Wire this to applications API + messaging.`);
};

window.submitReportUser = function () {
  const reason = document.getElementById('ru-reason')?.value;
  const details = document.getElementById('ru-details')?.value.trim();
  if (!reason || !details) {
    alert('Choose a reason and add details.');
    return;
  }
  alert('Report recorded for demo — wire to ticketing later.');
};

window.submitReportJob = function () {
  const reason = document.getElementById('rj-reason')?.value;
  const details = document.getElementById('rj-details')?.value.trim();
  if (!reason || !details) {
    alert('Choose a reason and add details.');
    return;
  }
  alert('Report recorded for demo — wire to ticketing later.');
};

window.bizApplicantDemo = function (action, creatorName) {
  window.alert(
    `${action}: ${creatorName} — demo only. Opens inbox / CRM thread when messaging is implemented.`
  );
};

window.submitDispute = function () {
  const story = document.getElementById('dq-story')?.value.trim();
  if (!story) {
    alert('Add a short timeline of what happened.');
    return;
  }
  alert('Dispute intake saved for demo — next step is tying to job + escrow IDs.');
};

function renderCreatorsList() {
  const searchEl = document.getElementById('creator-search');
  const sortEl = document.getElementById('creator-sort');
  const grid = document.getElementById('all-cg');
  const empty = document.getElementById('creator-empty');
  if (!grid) return;
  const search = searchEl?.value || '';
  const sort = sortEl?.value || 'rating-desc';
  let list = filterCreators(CREATORS, creatorChipFilter, search);
  list = sortCreators(list, sort);
  if (!list.length) {
    grid.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  grid.innerHTML = list.map(createCreatorCard).join('');
}

function updateJobsBrowseAccess() {
  const s = getSession();
  const tools = document.getElementById('jobs-browse-tools');
  const guestHint = document.getElementById('jobs-browse-guest');
  const subGuest = document.getElementById('jobs-panel-sub-guest');
  const subAuth = document.getElementById('jobs-panel-sub-auth');
  if (tools) tools.hidden = !s;
  if (guestHint) guestHint.hidden = !!s;
  if (subGuest) subGuest.hidden = !!s;
  if (subAuth) subAuth.hidden = !s;
  if (!s) {
    const js = document.getElementById('job-search');
    const jk = document.getElementById('job-kind');
    const jst = document.getElementById('job-sort');
    if (js) js.value = '';
    if (jk) jk.value = 'all';
    if (jst) jst.value = 'pay-desc';
  }
  renderJobsList();
}

function renderJobsList() {
  const searchEl = document.getElementById('job-search');
  const sortEl = document.getElementById('job-sort');
  const kindEl = document.getElementById('job-kind');
  const listEl = document.getElementById('all-jl');
  const empty = document.getElementById('job-empty');
  if (!listEl) return;

  const s = getSession();
  let list;
  const pool = getBrowseJobs();
  if (s) {
    const search = searchEl?.value || '';
    const sort = sortEl?.value || 'pay-desc';
    const kind = kindEl?.value || 'all';
    list = filterJobs(pool, search, kind);
    list = sortJobs(list, sort);
  } else {
    list = sortJobs([...pool], 'pay-desc');
  }

  if (!list.length) {
    listEl.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  listEl.innerHTML = list.map(createJobCard).join('');
}

function wireBrowseControls() {
  document.getElementById('creator-search')?.addEventListener('input', () => renderCreatorsList());
  document.getElementById('creator-sort')?.addEventListener('change', () => renderCreatorsList());
  document.getElementById('job-search')?.addEventListener('input', () => renderJobsList());
  document.getElementById('job-sort')?.addEventListener('change', () => renderJobsList());
  document.getElementById('job-kind')?.addEventListener('change', () => renderJobsList());
}

window.submitPostJob = function () {
  const s = getSession();
  if (!s || s.role !== 'business') {
    alert('Sign in as a business account to post jobs.');
    showView('signin');
    return;
  }
  const title = document.getElementById('pj-title')?.value.trim();
  const deliverables = document.getElementById('pj-deliverables')?.value.trim();
  const budget = document.getElementById('pj-budget')?.value;
  if (!title || !deliverables) {
    alert('Title and deliverables are required.');
    return;
  }
  addPostedJob({
    title,
    biz: s.businessProfile?.businessName || s.displayName || 'Your business',
    contentType: document.getElementById('pj-type')?.value,
    deliverables,
    budget: budget ? `$${budget}` : '—',
    timeline: document.getElementById('pj-timeline')?.value,
    status: 'Open',
    applicants: 0,
    badge: 'b-once',
    label: 'One-time',
    pay: budget ? `$${budget}` : '—',
    pl: 'flat fee',
    icon: '📋',
  });
  alert('Job published — listing saved in this browser for demo.');
  document.getElementById('pj-title').value = '';
  document.getElementById('pj-deliverables').value = '';
  document.getElementById('pj-budget').value = '';
  showView('business-dash');
  refreshBusinessDash();
  refreshHomeFeatured();
};

window.backFromPostJob = function () {
  const s = getSession();
  if (!s || s.role !== 'business') {
    showView('signin');
    return;
  }
  showView('business-dash');
};

window.filterC = function (el, n) {
  document.querySelectorAll('#creator-chips .chip').forEach((c) => c.classList.remove('on'));
  el.classList.add('on');
  creatorChipFilter = n || 'all';
  renderCreatorsList();
};

function clearJobBrowseFilters() {
  const js = document.getElementById('job-search');
  const jk = document.getElementById('job-kind');
  const jst = document.getElementById('job-sort');
  if (js) js.value = '';
  if (jk) jk.value = 'all';
  if (jst) jst.value = 'pay-desc';
}

function scrollToJobCard(jobId) {
  if (!jobId) return;
  const safe =
    typeof CSS !== 'undefined' && CSS.escape
      ? CSS.escape(String(jobId))
      : String(jobId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const el = document.querySelector(`[data-job-id="${safe}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('jcard--highlight');
  window.setTimeout(() => el.classList.remove('jcard--highlight'), 2200);
}

function queueJobScroll(jobId) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => scrollToJobCard(jobId));
  });
}

function syncRouteFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return;
  if (raw.startsWith('profile/')) {
    openCreatorProfile(decodeURIComponent(raw.slice('profile/'.length)));
    return;
  }
  if (raw.startsWith('job/')) {
    const jobId = decodeURIComponent(raw.slice('job/'.length));
    clearJobBrowseFilters();
    nav('jobs', document.querySelectorAll('.nl-btn')[2]);
    queueJobScroll(jobId);
  }
}

window.viewBusinessPosting = function (jobId) {
  if (!jobId) return;
  clearJobBrowseFilters();
  history.replaceState(null, '', `#job/${encodeURIComponent(jobId)}`);
  nav('jobs', document.querySelectorAll('.nl-btn')[2]);
  queueJobScroll(jobId);
};

document.addEventListener('DOMContentLoaded', () => {
  refreshHomeFeatured();
  renderCreatorsList();
  wireBrowseControls();
  refreshNavAuth();

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAdminDrawer();
  });

  window.addEventListener('hashchange', syncRouteFromHash);
  syncRouteFromHash();
});

const SESSION_KEY = 'c4f_session';
const BUSINESS_JOBS_KEY = 'c4f_business_jobs';

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function patchSession(partial) {
  const cur = getSession() || {};
  saveSession({ ...cur, ...partial });
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function demoRoleFromEmail(email) {
  const e = String(email || '').toLowerCase().trim();
  if (e.startsWith('admin@')) return 'admin';
  if (e.includes('business') || e.endsWith('@biz.demo')) return 'business';
  return 'creator';
}

export function getPostedJobs() {
  try {
    const raw = localStorage.getItem(BUSINESS_JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addPostedJob(job) {
  const list = getPostedJobs();
  list.unshift({ ...job, id: `pj_${Date.now()}`, postedAt: new Date().toISOString() });
  localStorage.setItem(BUSINESS_JOBS_KEY, JSON.stringify(list));
  return list;
}

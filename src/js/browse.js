/** Client-side browse helpers — swap data source for API responses later. */

export function parsePayAmount(pay) {
  const n = parseInt(String(pay || '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export function parseRating(r) {
  const n = parseFloat(String(r || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function creatorMatchesChip(c, chip) {
  if (!chip || chip === 'all') return true;
  return c.n.includes(chip);
}

export function creatorMatchesSearch(c, q) {
  if (!q || !String(q).trim()) return true;
  const s = String(q).toLowerCase().trim();
  const blob = [c.name, c.city, c.type, ...(c.tags || [])].join(' ').toLowerCase();
  return blob.includes(s);
}

export function filterCreators(list, chip, search) {
  return list.filter((c) => creatorMatchesChip(c, chip) && creatorMatchesSearch(c, search));
}

export function sortCreators(list, sortKey) {
  const out = [...list];
  switch (sortKey) {
    case 'rating-desc':
      out.sort((a, b) => parseRating(b.rating) - parseRating(a.rating));
      break;
    case 'rating-asc':
      out.sort((a, b) => parseRating(a.rating) - parseRating(b.rating));
      break;
    case 'jobs-desc':
      out.sort((a, b) => (b.jobs || 0) - (a.jobs || 0));
      break;
    case 'jobs-asc':
      out.sort((a, b) => (a.jobs || 0) - (b.jobs || 0));
      break;
    case 'name-asc':
      out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
      break;
    case 'name-desc':
      out.sort((a, b) => String(b.name).localeCompare(String(a.name)));
      break;
    default:
      break;
  }
  return out;
}

export function jobMatchesSearch(j, q) {
  if (!q || !String(q).trim()) return true;
  const s = String(q).toLowerCase().trim();
  const blob = [j.title, j.biz, j.city, j.type, j.label].join(' ').toLowerCase();
  return blob.includes(s);
}

export function jobMatchesKind(j, kind) {
  if (!kind || kind === 'all') return true;
  if (kind === 'once') return j.label === 'One-time';
  if (kind === 'ongoing') return j.label === 'Ongoing';
  return true;
}

export function filterJobs(list, search, kind) {
  return list.filter((j) => jobMatchesSearch(j, search) && jobMatchesKind(j, kind));
}

export function sortJobs(list, sortKey) {
  const out = [...list];
  switch (sortKey) {
    case 'pay-desc':
      out.sort((a, b) => parsePayAmount(b.pay) - parsePayAmount(a.pay));
      break;
    case 'pay-asc':
      out.sort((a, b) => parsePayAmount(a.pay) - parsePayAmount(b.pay));
      break;
    case 'title-asc':
      out.sort((a, b) => String(a.title).localeCompare(String(b.title)));
      break;
    case 'city-asc':
      out.sort((a, b) => String(a.city).localeCompare(String(b.city)));
      break;
    default:
      break;
  }
  return out;
}

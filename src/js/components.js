export function createCreatorCard(c) {
  return `<div class="ccard">
    <div class="ccard-top"><div class="ava" style="background:${c.bg};color:${c.tc}">${c.i}</div>
    <div><div class="cname">${c.name}</div><div class="cloc">${c.city} · ${c.type}</div></div></div>
    <div class="ctags">${c.tags.map(t=>`<span class="tag">${t}</span>`).join(' ')} ${c.avail?'<span class="b-avail">Available</span>':'<span class="b-busy">Booked</span>'}</div>
    <div class="cfoot"><span class="crate">${c.rate}</span><span class="crating">★ ${c.rating} · ${c.jobs} jobs</span></div>
  </div>`;
}

export function createJobCard(j) {
  return `<div class="jcard">
    <div class="jicon">${j.icon}</div>
    <div class="jmain"><div class="jtitle">${j.title}</div>
    <div class="jmeta"><span>${j.biz}</span> · <span>${j.city}</span> <span class="badge ${j.badge}">${j.label}</span></div></div>
    <div class="jpay"><div class="jpay-amt">${j.pay}</div><div class="jpay-lbl">${j.pl}</div></div>
  </div>`;
}
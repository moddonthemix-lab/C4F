import { CREATORS, JOBS } from './data.js';
import { createCreatorCard, createJobCard } from './components.js';

window.nav = function(id, btn) {
  ['home', 'creators', 'jobs', 'pricing', 'how'].forEach(t => {
    document.getElementById(t).style.display = t === id ? 'block' : 'none';
  });
  document.getElementById('cta').style.display = (id === 'pricing' || id === 'how') ? 'none' : 'block';
  document.querySelectorAll('.nl-btn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
};

window.filterC = function(el, n) {
  document.querySelectorAll('#creator-chips .chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  const filtered = n === 'all' ? CREATORS : CREATORS.filter(c => c.n.includes(n));
  document.getElementById('all-cg').innerHTML = filtered.length 
    ? filtered.map(createCreatorCard).join('') 
    : '<p>No creators found.</p>';
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('home-cg').innerHTML = CREATORS.slice(0, 3).map(createCreatorCard).join('');
  document.getElementById('all-cg').innerHTML = CREATORS.map(createCreatorCard).join('');
  document.getElementById('home-jl').innerHTML = JOBS.slice(0, 4).map(createJobCard).join('');
  document.getElementById('all-jl').innerHTML = JOBS.map(createJobCard).join('');
});
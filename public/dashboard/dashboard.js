// Redirection si pas authentifié
if (!sessionStorage.getItem('isBossDisco')) {
  window.location.href = 'index.html';
}

async function fetchBasic() {
  const res = await fetch('/.netlify/functions/ga4/basic');
  return res.json();
}
async function fetchTopPagesDaytime() {
  const res = await fetch('/.netlify/functions/ga4/top_pages_daytime');
  return res.json();
}
async function fetchTopPagesRealtime() {
  const res = await fetch('/.netlify/functions/ga4/top_pages_realtime');
  return res.json();
}

function renderSite(data) {
  document.getElementById('site-title').textContent = data.site_name || '—';
  document.querySelector('#users-total span').textContent = data.users_total ?? '—';
}

function renderTopPagesDaytime(pages) {
  const panel = document.getElementById('top-pages-daytime');
  panel.innerHTML = pages.map(p => `<div><b>${p.url}</b> — ${p.views} vues</div>`).join('') || '<i>Aucune donnée</i>';
}

function renderTopPagesRealtime(pages) {
  const panel = document.getElementById('top-pages-realtime');
  panel.innerHTML = pages.map(p => `<div><b>${p.title}</b> — ${p.views} en temps réel</div>`).join('') || '<i>Aucune donnée</i>';
}

// Accordéon UI
const accordions = document.getElementsByClassName('accordion');
for (let i = 0; i < accordions.length; i++) {
  accordions[i].onclick = function() {
    const panel = this.nextElementSibling;
    panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
    if (panel.id === 'top-pages-daytime' && panel.style.display === 'block') {
      fetchTopPagesDaytime().then(renderTopPagesDaytime).catch(() => renderTopPagesDaytime([]));
    }
    if (panel.id === 'top-pages-realtime' && panel.style.display === 'block') {
      fetchTopPagesRealtime().then(renderTopPagesRealtime).catch(() => renderTopPagesRealtime([]));
    }
  }
}

// Refresh auto (5 min)
function refreshAll() {
  fetchBasic().then(renderSite).catch(() => renderSite({site_name: 'Erreur', users_total: '—'}));
}
refreshAll();
setInterval(refreshAll, 5 * 60 * 1000);

// Ora's own visit stats (2026-10-09): no cookies, no third parties, nothing
// stored in the browser. On the live site it sends one page view (the page,
// the referring site, campaign tags, language and time zone) and, on leaving,
// the time the page was visible and which homepage sections were reached.
// Browsers that send Global Privacy Control or Do Not Track are not counted.
(() => {
  const nav = navigator;
  if (nav.globalPrivacyControl || nav.doNotTrack === '1' || window.doNotTrack === '1') return;
  if (!/^(www\.)?oracoach\.app$/.test(location.hostname)) return; // never previews or local copies
  const ENDPOINT = 'https://us-central1-ora-app-ericzhu.cloudfunctions.net/trackSiteVisit';
  const send = (fields, beacon) => {
    const body = new URLSearchParams(fields).toString();
    if (beacon && nav.sendBeacon &&
      nav.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/x-www-form-urlencoded' }))) return;
    fetch(ENDPOINT, {
      method: 'POST', body, keepalive: true, credentials: 'omit',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).catch(() => {});
  };
  const q = new URLSearchParams(location.search);
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) {}
  send({
    e: 'pv', path: location.pathname, ref: document.referrer || '', tz, lang: nav.language || '',
    us: q.get('utm_source') || '', uc: q.get('utm_campaign') || '',
  });

  // Time the page is actually visible, and the sections that came into view.
  let visibleMs = 0, since = document.visibilityState === 'visible' ? performance.now() : null, sent = false;
  const reached = new Set();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting && e.target.id) { reached.add(e.target.id); io.unobserve(e.target); }
    }, { threshold: 0.35 });
    document.querySelectorAll('section[id], footer[id]').forEach(el => io.observe(el));
  }
  const leave = () => {
    if (since !== null) { visibleMs += performance.now() - since; since = null; }
    if (sent) return;
    sent = true;
    send({ e: 'leave', path: location.pathname, sec: String(Math.round(visibleMs / 1000)), sx: [...reached].join(',') }, true);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') leave();
    else if (since === null) since = performance.now();
  });
  addEventListener('pagehide', leave);
})();

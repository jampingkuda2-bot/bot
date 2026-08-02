// Reads a comma-separated proxy list from WEBSHARE_PROXIES, e.g.:
// WEBSHARE_PROXIES=http://user:pass@p1.webshare.io:80,http://user:pass@p2.webshare.io:80
// Returns null (no proxy) if the env var is empty/unset — bot still works,
// just without rotation.
function getProxyList() {
  const raw = process.env.WEBSHARE_PROXIES || '';
  return raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
}

function getRandomProxy() {
  const list = getProxyList();
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

module.exports = { getRandomProxy, getProxyList };

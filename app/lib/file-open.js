function base64ToFile(base64, name, mime) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const type = mime || 'application/octet-stream';
  const blob = new Blob([bytes], { type });
  return new File([blob], name || 'file', { type });
}

function showBanner(text) {
  try {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#2563eb;color:#fff;padding:10px 14px;font-size:13px;font-weight:600;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  } catch (e) {}
}

export async function initFileOpenListener(onFile) {
  if (typeof window === 'undefined') return;
  const cap = window.Capacitor;
  if (!cap || !cap.Plugins || !cap.Plugins.FileOpen) {
    console.log('[FileOpen] Plugin tidak tersedia');
    return;
  }
  const FileOpen = cap.Plugins.FileOpen;
  console.log('[FileOpen] Plugin terdeteksi');

  FileOpen.addListener('fileReceived', (data) => {
    console.log('[FileOpen] event:', data);
    if (data && data.hasFile) {
      showBanner('FileOpen event: ' + data.name);
      onFile(base64ToFile(data.data, data.name, data.mime));
    }
  });

  try {
    const result = await FileOpen.getPendingFile();
    console.log('[FileOpen] pending:', result);
    if (result && result.hasFile) {
      showBanner('FileOpen: ' + result.name);
      onFile(base64ToFile(result.data, result.name, result.mime));
    }
  } catch (e) {
    console.error('[FileOpen] pending error', e);
  }

  try {
    await FileOpen.notifyReady();
    console.log('[FileOpen] ready');
  } catch (e) {
    console.error('[FileOpen] ready error', e);
  }
}

// background.js
importScripts('unzipit.min.js');

let zipSessions = new Map();
let sessionIdCounter = 0;
const downloadedByExtension = new Set();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getZipInfo') {
    const sessionId = sessionIdCounter++;
    getZipInfo(message.url, sessionId).then(info => {
      sendResponse(info);
    }).catch(error => {
      sendResponse({error: error.message});
    });
    return true;
  } else if (message.type === 'downloadSelected') {
    downloadSelected(message.sessionId, message.names, message.url).then(() => {
      sendResponse({success: true});
      zipSessions.delete(message.sessionId);
    }).catch(error => {
      sendResponse({error: error.message});
    });
    return true;
  } else if (message.type === 'downloadFull') {
    downloadFull(message.url).then(() => {
      sendResponse({success: true});
    }).catch(error => {
      sendResponse({error: error.message});
    });
    return true;
  }
});

chrome.downloads.onCreated.addListener(function(downloadItem) {
  if (downloadItem.byExtensionId === chrome.runtime.id || downloadedByExtension.has(downloadItem.url)) {
    downloadedByExtension.delete(downloadItem.url);
    return;
  }

  const lowerUrl = downloadItem.url.toLowerCase();
  const lowerFilename = downloadItem.filename ? downloadItem.filename.toLowerCase() : '';
  const lowerMime = downloadItem.mime ? downloadItem.mime.toLowerCase() : '';

  const isZip = lowerUrl.endsWith('.zip') ||
                lowerFilename.endsWith('.zip') ||
                ['application/zip', 'application/x-zip', 'application/x-zip-compressed'].includes(lowerMime);

  if (isZip) {
    chrome.downloads.cancel(downloadItem.id);
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {type: 'show_zip_modal', zipUrl: downloadItem.url});
      }
    });
  }
});

async function getZipInfo(url, sessionId) {
  let fullSize = 0;
  const headResponse = await fetch(url, { method: 'HEAD' });
  fullSize = parseInt(headResponse.headers.get('Content-Length') || '0', 10);

  let supportsRanges = false;
  const rangeResponse = await fetch(url, {
    method: 'HEAD',
    headers: { 'Range': 'bytes=0-0' }
  });
  if (rangeResponse.status === 206 || rangeResponse.headers.get('Accept-Ranges') === 'bytes') {
    supportsRanges = true;
    const contentRange = rangeResponse.headers.get('Content-Range');
    if (contentRange) {
      const match = contentRange.match(/bytes .*\/(\d+)/);
      if (match) fullSize = parseInt(match[1], 10);
    }
  }

  const { zip, entries } = await unzipit.unzip(url);
  zipSessions.set(sessionId, {zip, entries, fullSize, supportsRanges});

  const fileEntries = Object.values(entries)
    .filter(entry => !entry.isDirectory)
    .map(entry => ({name: entry.name, size: entry.size, compressedSize: entry.compressedSize}));

  return {
    sessionId,
    supportsRanges,
    fileEntries,
    fullSize
  };
}

async function downloadSelected(sessionId, names, url) {
  const session = zipSessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const { entries, fullSize, supportsRanges } = session;

  let totalDownloaded = names.reduce((sum, name) => sum + (entries[name]?.compressedSize || 0), 0);
  if (!supportsRanges) {
    totalDownloaded = fullSize;
  }
  let saved = supportsRanges ? (fullSize - totalDownloaded) : 0;

  for (const name of names) {
    const entry = entries[name];
    if (!entry) continue;
    const blob = await entry.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:application/octet-stream;base64,${base64}`;
    let filename = name.split('/').pop();
    if (filename.startsWith('.')) {
      filename = '_' + filename.slice(1);
    }
    await chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false
    });
  }

  await updateStorage(totalDownloaded, saved);
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function downloadFull(url) {
  const headResponse = await fetch(url, { method: 'HEAD' });
  const fullSize = parseInt(headResponse.headers.get('Content-Length') || '0', 10);

  downloadedByExtension.add(url);
  await chrome.downloads.download({
    url: url,
    saveAs: false
  });

  await updateStorage(fullSize, 0);
}

async function updateStorage(downloaded, saved) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const data = await chrome.storage.local.get(['totalDownloaded', 'totalSaved', 'monthlyDownloaded', 'monthlySaved']);

  data.totalDownloaded = (data.totalDownloaded || 0) + downloaded;
  data.totalSaved = (data.totalSaved || 0) + saved;

  data.monthlyDownloaded = data.monthlyDownloaded || {};
  data.monthlyDownloaded[yearMonth] = (data.monthlyDownloaded[yearMonth] || 0) + downloaded;

  data.monthlySaved = data.monthlySaved || {};
  data.monthlySaved[yearMonth] = (data.monthlySaved[yearMonth] || 0) + saved;

  await chrome.storage.local.set(data);
}

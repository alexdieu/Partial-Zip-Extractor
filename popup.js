// popup.js
async function loadStats() {
  const data = await chrome.storage.local.get(['totalDownloaded', 'totalSaved', 'monthlyDownloaded', 'monthlySaved']);

  const now = new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const totalDownloaded = data.totalDownloaded || 0;
  const totalSaved = data.totalSaved || 0;
  const lastMonthDownloaded = (data.monthlyDownloaded && data.monthlyDownloaded[lastYearMonth]) || 0;
  const lastMonthSaved = (data.monthlySaved && data.monthlySaved[lastYearMonth]) || 0;

  function formatBytes(bytes) {
    if (isNaN(bytes) || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  document.getElementById('totalDownloaded').textContent = formatBytes(totalDownloaded);
  document.getElementById('totalSaved').textContent = formatBytes(totalSaved);
  document.getElementById('lastMonthDownloaded').textContent = formatBytes(lastMonthDownloaded);
  document.getElementById('lastMonthSaved').textContent = formatBytes(lastMonthSaved);
}

window.addEventListener('DOMContentLoaded', loadStats);

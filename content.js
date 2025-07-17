// content.js

async function showModal(zipUrl) {
  try {
    const info = await new Promise((resolve) => {
      chrome.runtime.sendMessage({type: 'getZipInfo', url: zipUrl}, resolve);
    });

    if (info.error) {
      throw new Error(info.error);
    }

    const { sessionId, supportsRanges, fileEntries } = info;

    if (fileEntries.length === 0) {
      alert('No files found in the ZIP.');
      return;
    }

    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0, 0, 0, 0.6)';
    modal.style.backdropFilter = 'blur(5px)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10000';
    modal.style.animation = 'fadeIn 0.3s ease';

    const modalContent = document.createElement('div');
    modalContent.style.background = '#fff';
    modalContent.style.padding = '24px';
    modalContent.style.borderRadius = '16px';
    modalContent.style.maxWidth = '600px';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';
    modalContent.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
    modalContent.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    modalContent.style.color = '#333';
    modalContent.style.animation = 'slideUp 0.3s ease';

    const title = document.createElement('h2');
    title.textContent = 'Select Files to Download from ZIP';
    title.style.marginTop = '0';
    title.style.fontSize = '1.5em';
    title.style.color = '#1a1a1a';
    modalContent.appendChild(title);

    if (!supportsRanges) {
      const warning = document.createElement('p');
      warning.textContent = 'Warning: This server does not support partial downloads. The full ZIP file will be downloaded locally for extraction.';
      warning.style.color = '#e53e3e';
      warning.style.fontWeight = '600';
      warning.style.marginBottom = '16px';
      modalContent.appendChild(warning);
    }

    const selectAllLabel = document.createElement('label');
    selectAllLabel.style.display = 'flex';
    selectAllLabel.style.alignItems = 'center';
    selectAllLabel.style.marginBottom = '12px';
    selectAllLabel.style.fontWeight = '500';
    selectAllLabel.style.cursor = 'pointer';
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.style.marginRight = '12px';
    selectAllCheckbox.style.accentColor = '#3182ce';
    selectAllCheckbox.addEventListener('change', (e) => {
      const allCheckboxes = form.querySelectorAll('input[type="checkbox"]');
      allCheckboxes.forEach(cb => { cb.checked = e.target.checked; });
    });
    selectAllLabel.appendChild(selectAllCheckbox);
    selectAllLabel.appendChild(document.createTextNode('Select All'));
    modalContent.appendChild(selectAllLabel);

    const form = document.createElement('form');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.maxHeight = '300px';
    form.style.overflowY = 'auto';
    form.style.marginBottom = '20px';
    form.style.paddingRight = '8px';
    fileEntries.forEach((entry) => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.marginBottom = '8px';
      label.style.cursor = 'pointer';
      label.style.transition = 'background 0.2s';
      label.style.padding = '8px';
      label.style.borderRadius = '8px';
      label.addEventListener('mouseover', () => { label.style.background = '#f7fafc'; });
      label.addEventListener('mouseout', () => { label.style.background = ''; });
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = entry.name;
      checkbox.style.marginRight = '12px';
      checkbox.style.accentColor = '#3182ce';
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(`${entry.name} (${formatBytes(entry.size)})`));
      form.appendChild(label);
    });
    modalContent.appendChild(form);

    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'flex-end';
    buttons.style.gap = '12px';

    const fullDownloadButton = document.createElement('button');
    fullDownloadButton.textContent = 'Download Full ZIP';
    fullDownloadButton.style.padding = '10px 20px';
    fullDownloadButton.style.border = 'none';
    fullDownloadButton.style.borderRadius = '8px';
    fullDownloadButton.style.fontWeight = '600';
    fullDownloadButton.style.cursor = 'pointer';
    fullDownloadButton.style.transition = 'background 0.2s, transform 0.1s';
    fullDownloadButton.style.background = '#63b3ed';
    fullDownloadButton.style.color = 'white';
    fullDownloadButton.addEventListener('mouseover', () => {
      fullDownloadButton.style.background = '#4299e1';
      fullDownloadButton.style.transform = 'translateY(-1px)';
    });
    fullDownloadButton.addEventListener('mouseout', () => {
      fullDownloadButton.style.background = '#63b3ed';
      fullDownloadButton.style.transform = '';
    });
    fullDownloadButton.addEventListener('mousedown', () => { fullDownloadButton.style.transform = 'translateY(0)'; });
    fullDownloadButton.addEventListener('click', async (e) => {
      e.preventDefault();
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({type: 'downloadFull', url: zipUrl}, resolve);
      });
      modal.remove();
    });

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download Selected';
    downloadButton.style.padding = '10px 20px';
    downloadButton.style.border = 'none';
    downloadButton.style.borderRadius = '8px';
    downloadButton.style.fontWeight = '600';
    downloadButton.style.cursor = 'pointer';
    downloadButton.style.transition = 'background 0.2s, transform 0.1s';
    downloadButton.style.background = '#68d391';
    downloadButton.style.color = 'white';
    downloadButton.addEventListener('mouseover', () => {
      downloadButton.style.background = '#48bb78';
      downloadButton.style.transform = 'translateY(-1px)';
    });
    downloadButton.addEventListener('mouseout', () => {
      downloadButton.style.background = '#68d391';
      downloadButton.style.transform = '';
    });
    downloadButton.addEventListener('mousedown', () => { downloadButton.style.transform = 'translateY(0)'; });
    downloadButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const selectedCheckboxes = form.querySelectorAll('input[type="checkbox"]:checked');
      const selectedNames = Array.from(selectedCheckboxes).map(cb => cb.value);

      if (selectedNames.length === 0) {
        alert('No files selected.');
        return;
      }

      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'downloadSelected',
          sessionId,
          names: selectedNames,
          url: zipUrl
        }, resolve);
      });

      if (result.error) {
        alert(`Download failed: ${result.error}`);
      } else {
        modal.remove();
      }
    });

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '10px 20px';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '8px';
    cancelButton.style.fontWeight = '600';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.transition = 'background 0.2s, transform 0.1s';
    cancelButton.style.background = '#feb2b2';
    cancelButton.style.color = '#742a2a';
    cancelButton.addEventListener('mouseover', () => {
      cancelButton.style.background = '#fc8181';
      cancelButton.style.transform = 'translateY(-1px)';
    });
    cancelButton.addEventListener('mouseout', () => {
      cancelButton.style.background = '#feb2b2';
      cancelButton.style.transform = '';
    });
    cancelButton.addEventListener('mousedown', () => { cancelButton.style.transform = 'translateY(0)'; });
    cancelButton.addEventListener('click', () => modal.remove());

    buttons.appendChild(fullDownloadButton);
    buttons.appendChild(downloadButton);
    buttons.appendChild(cancelButton);
    modalContent.appendChild(buttons);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  } catch (error) {
    console.error('Error processing ZIP:', error);
    alert(`Failed to process ZIP: ${error.message}`);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'show_zip_modal') {
    showModal(message.zipUrl);
  }
});

document.addEventListener('click', async (event) => {
  const link = event.target.closest('a');
  if (link && link.href && link.href.toLowerCase().endsWith('.zip')) {
    event.preventDefault();
    event.stopPropagation();

    const zipUrl = link.href;
    showModal(zipUrl);
  }
}, true);

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

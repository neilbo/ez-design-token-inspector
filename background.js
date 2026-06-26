// Service worker. The injected inspector can't call chrome.tabs.* or
// chrome.downloads.* itself, so it asks the worker to capture the visible tab
// and save it. Doing the download here (rather than via an <a download> click in
// the page) avoids the user-gesture/data-URL restrictions that block page-side
// downloads after an async round-trip.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'dtf:capture') {
    const windowId = sender.tab?.windowId;
    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        sendResponse({ ok: false, error: chrome.runtime.lastError?.message || 'capture failed' });
        return;
      }
      chrome.downloads.download(
        { url: dataUrl, filename: msg.filename || 'design-tokens.png', saveAs: false },
        (downloadId) => {
          if (chrome.runtime.lastError || downloadId == null) {
            sendResponse({ ok: false, error: chrome.runtime.lastError?.message || 'download failed' });
          } else {
            sendResponse({ ok: true, downloadId });
          }
        }
      );
    });
    return true; // async response
  }
});

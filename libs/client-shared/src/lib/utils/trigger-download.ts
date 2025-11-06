/**
 * Triggers a download from a given URL by injecting an anchor tag. A filename can be provided for background downloads,
 * but be aware that and Content-Disposition headers from the server may override it.
 */
export const triggerDownload = (url: string, isBackgroundDownload = false, fileName = 'assets-download.pdf') => {
  const anchor = document.createElement('a');
  anchor.setAttribute('style', 'display: none');
  anchor.setAttribute('id', crypto.randomUUID());
  anchor.href = url;

  if (isBackgroundDownload) {
    anchor.download = fileName;
  } else {
    anchor.target = '_blank';
  }
  document.body.appendChild(anchor);

  anchor.click();
  anchor.remove();
};

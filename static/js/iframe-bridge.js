(function () {
  const ROOT = document.documentElement;
  const STATE = {
    iframeTop: 0,
    iframeHeight: 0,
    viewportHeight: window.innerHeight || 0,
    scrollY: 0,
  };

  function clamp(n, min, max) {
    n = Number(n) || 0;
    return Math.max(min, Math.min(max, n));
  }

  function getDocHeight() {
    const body = document.body;
    const html = document.documentElement;
    return Math.ceil(Math.max(
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      html ? html.clientHeight : 0,
      html ? html.scrollHeight : 0,
      html ? html.offsetHeight : 0
    ));
  }

  function applyParentViewport() {
    const vh = STATE.viewportHeight || window.innerHeight || document.documentElement.clientHeight || 700;
    const docH = getDocHeight();
    const top = clamp(-STATE.iframeTop, 0, Math.max(0, docH - 1));
    const height = clamp(vh, 320, Math.max(vh, docH));

    ROOT.style.setProperty('--syura-parent-viewport-top', `${top}px`);
    ROOT.style.setProperty('--syura-parent-viewport-height', `${height}px`);
  }

  let heightTimer = 0;
  function reportHeightNow() {
    const height = getDocHeight();
    try {
      window.parent.postMessage({ source: 'syura-css', type: 'SYURA_IFRAME_HEIGHT', height }, '*');
      window.parent.postMessage({ type: 'yeomyang-artmug:height', height }, '*');
    } catch (_) {}
  }

  function reportHeight() {
    clearTimeout(heightTimer);
    heightTimer = setTimeout(reportHeightNow, 30);
  }

  function requestParentViewport() {
    try {
      window.parent.postMessage({ source: 'syura-css', type: 'SYURA_REQUEST_PARENT_VIEWPORT' }, '*');
    } catch (_) {}
  }

  function scrollParentTo(targetY, navHeight) {
    try {
      window.parent.postMessage({ source: 'syura-css', type: 'SYURA_PARENT_SCROLL_TO', targetY, navHeight }, '*');
    } catch (_) {}
  }

  window.addEventListener('message', function (event) {
    const data = event.data || {};
    if (!data || data.source !== 'syura-artmug-parent' || data.type !== 'SYURA_PARENT_VIEWPORT') return;

    STATE.iframeTop = Number(data.iframeTop) || 0;
    STATE.iframeHeight = Number(data.iframeHeight) || 0;
    STATE.viewportHeight = Number(data.viewportHeight) || window.innerHeight || 0;
    STATE.scrollY = Number(data.scrollY) || 0;

    applyParentViewport();
  });

  window.SyuraIframe = {
    reportHeight,
    reportHeightNow,
    requestParentViewport,
    scrollParentTo,
    applyParentViewport,
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyParentViewport();
    reportHeightNow();
    requestParentViewport();

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(reportHeight);
      ro.observe(document.documentElement);
      if (document.body) ro.observe(document.body);
    }

    window.addEventListener('load', function () {
      reportHeightNow();
      requestParentViewport();
      setTimeout(reportHeightNow, 250);
      setTimeout(reportHeightNow, 1000);
    });
  });

  window.addEventListener('resize', function () {
    applyParentViewport();
    reportHeight();
    requestParentViewport();
  });
})();

(() => {
  if (window.__codropsPlacementLoaded) return;
  window.__codropsPlacementLoaded = true;

  const cssHref = `https://tympanus.net/codrops/adpacks/cda_sponsor.css?${Date.now()}`;
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.type = 'text/css';
  cssLink.href = cssHref;
  document.head.appendChild(cssLink);

  function pickPlacement(callback) {
    if (window.__codropsPlacementConfig) {
      callback(window.__codropsPlacementConfig.pick());
      return;
    }

    const s = document.createElement('script');
    s.src = 'https://tympanus.net/codrops/adpacks/placement-config.js';

    s.onload = function () {
      callback(
        window.__codropsPlacementConfig
          ? window.__codropsPlacementConfig.pick()
          : 'in-demo-placement',
      );
    };

    s.onerror = function () {
      callback('in-demo-placement');
    };

    document.head.appendChild(s);
  }

  function mountPlacement() {
    const frame = document.querySelector('.frame');
    if (!frame) return false;

    // ✅ consistent container
    const box = document.createElement('div');
    box.id = 'in-demo-placement-box';
    frame.appendChild(box);

    pickPlacement(function (placement) {
      fetch(
        `https://tympanus.net/codrops/wp-admin/admin-ajax.php?action=aa-server-select&p=${placement}`,
      )
        .then(function (res) {
          return res.text();
        })
        .then(function (body) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(body, 'text/html');
          const ad_container = doc.querySelector('div');

          if (!ad_container) return;

          // ✅ preserve Advanced Ads DOM EXACTLY
          box.innerHTML = ad_container.innerHTML;

          // ✅ ensure click tracking hooks (safe fallback)
          if (window.AdvAdsClickTracker) {
            window.AdvAdsClickTracker.findTargets();
          }
        });
    });

    return true;
  }

  if (!mountPlacement()) {
    const observer = new MutationObserver(() => {
      if (mountPlacement()) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      console.warn('Target container never appeared.');
    }, 5000);
  }
})();

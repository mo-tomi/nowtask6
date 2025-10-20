// Simple i18n dictionary and applier for Android WebView assets
(function() {
  const I18N = {
    ja: {
      texts: {
        '#settings-modal .modal-header h2': '設定',
        '#save-settings-btn': '保存',
        '#completed-section .toggle-text': '完了済み',
        '#login-modal #login-modal-title': 'ログイン',
        '#google-login-btn': 'Googleでログイン',
        '#continue-anonymous-btn': '匿名のまま使い続ける',
        '#logout-btn': 'ログアウト'
      },
      applyExtras() {
        // 設定モーダル セクション見出し（登場順）
        const sectionTitles = document.querySelectorAll('#settings-modal .settings-section-title');
        if (sectionTitles && sectionTitles.length) {
          if (sectionTitles[0]) sectionTitles[0].textContent = '🎨 表示設定';
          if (sectionTitles[1]) sectionTitles[1].textContent = '🔔 通知設定';
          if (sectionTitles[2]) sectionTitles[2].textContent = '⏱ ルーチン';
          if (sectionTitles[3]) sectionTitles[3].textContent = '⚡ クイックアクション';
        }

        // ゲージのナビ（前/次）
        const prevBtn = document.getElementById('gauge-prev-btn');
        if (prevBtn) {
          prevBtn.setAttribute('aria-label', '前の日に移動');
          prevBtn.setAttribute('title', '前の日に移動');
        }
        const nextBtn = document.getElementById('gauge-next-btn');
        if (nextBtn) {
          nextBtn.setAttribute('aria-label', '次の日に移動');
          nextBtn.setAttribute('title', '次の日に移動');
        }
      }
    }
  };

  function setText(selector, text) {
    const el = document.querySelector(selector);
    if (!el) return;
    // Prefer textContent to avoid injecting HTML
    el.textContent = text;
  }

  window.applyI18n = function(locale = 'ja') {
    const dict = I18N[locale] || I18N.ja;
    Object.entries(dict.texts).forEach(([sel, val]) => setText(sel, val));
    if (typeof dict.applyExtras === 'function') dict.applyExtras();
  };
})();


// ========================================
// アニメーションとビジュアルフィードバック
// ========================================

/**
 * モーダルアニメーションの初期化
 */
function initModalAnimations() {
  // 全てのモーダルにフェードイン/アウトアニメーションを適用
  const modals = document.querySelectorAll('.modal');

  modals.forEach(modal => {
    // モーダルが表示されるときのアニメーション
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style') {
          const display = window.getComputedStyle(modal).display;

          if (display === 'flex' && !modal.classList.contains('modal-show')) {
            // フェードイン開始
            modal.classList.add('modal-show');
            const content = modal.querySelector('.modal-content');
            if (content) {
              content.classList.add('modal-slide-up');
            }
          } else if (display === 'none' && modal.classList.contains('modal-show')) {
            // フェードアウト完了後にクラスを削除
            modal.classList.remove('modal-show');
            const content = modal.querySelector('.modal-content');
            if (content) {
              content.classList.remove('modal-slide-up');
            }
          }
        }
      });
    });

    observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
  });
}

/**
 * モーダルを滑らかに開く
 */
function openModalWithAnimation(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.style.display = 'flex';
  // 次のフレームでアニメーションを開始（リフロー強制）
  requestAnimationFrame(() => {
    modal.classList.add('modal-show');
    const content = modal.querySelector('.modal-content');
    if (content) {
      content.classList.add('modal-slide-up');
    }
  });
}

/**
 * モーダルを滑らかに閉じる
 */
function closeModalWithAnimation(modalId, callback) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove('modal-show');
  const content = modal.querySelector('.modal-content');
  if (content) {
    content.classList.remove('modal-slide-up');
  }

  // アニメーション完了後に非表示
  setTimeout(() => {
    modal.style.display = 'none';
    if (callback) callback();
  }, 200);
}

/**
 * タスク追加時のアニメーション
 */
function animateTaskAdd(taskElement) {
  if (!taskElement) return;

  // 初期状態を設定
  taskElement.style.opacity = '0';
  taskElement.style.transform = 'translateY(-20px)';

  // 次のフレームでアニメーション開始
  requestAnimationFrame(() => {
    taskElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    taskElement.style.opacity = '1';
    taskElement.style.transform = 'translateY(0)';
  });

  // アニメーション完了後にスタイルをクリア
  setTimeout(() => {
    taskElement.style.transition = '';
    taskElement.style.opacity = '';
    taskElement.style.transform = '';
  }, 300);
}

/**
 * タスク削除時のアニメーション
 */
function animateTaskRemove(taskElement, callback) {
  if (!taskElement) {
    if (callback) callback();
    return;
  }

  // フェードアウト + スライドアウト
  taskElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out, max-height 0.3s ease-out';
  taskElement.style.opacity = '0';
  taskElement.style.transform = 'translateX(-20px)';
  taskElement.style.maxHeight = '0';
  taskElement.style.marginBottom = '0';
  taskElement.style.overflow = 'hidden';

  setTimeout(() => {
    if (callback) callback();
  }, 300);
}

/**
 * チェックボックスのアニメーション
 */
function animateCheckbox(checkbox) {
  if (!checkbox) return;

  // チェック時のバウンス効果
  checkbox.style.transition = 'transform 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
  checkbox.style.transform = 'scale(1.2)';

  setTimeout(() => {
    checkbox.style.transform = 'scale(1)';
  }, 200);

  // バイブレーションフィードバック
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}

/**
 * 完了タスクの打ち消し線アニメーション
 */
function animateTaskComplete(taskElement, isCompleted) {
  if (!taskElement) return;

  const title = taskElement.querySelector('.task-title');
  if (!title) return;

  if (isCompleted) {
    // 打ち消し線を徐々に表示
    title.style.transition = 'opacity 0.3s ease-out';
    title.style.opacity = '0.6';

    // バイブレーションフィードバック
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  } else {
    // 打ち消し線を除去
    title.style.transition = 'opacity 0.3s ease-out';
    title.style.opacity = '1';
  }
}

/**
 * FABボタンのアニメーション
 */
function animateFAB() {
  const fab = document.getElementById('create-task-btn');
  if (!fab) return;

  // タップ時の拡大効果
  fab.addEventListener('click', () => {
    fab.style.transition = 'transform 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    fab.style.transform = 'scale(0.9) rotate(90deg)';

    setTimeout(() => {
      fab.style.transform = 'scale(1) rotate(0deg)';
    }, 200);
  });

  // ホバー時の浮き上がり効果（PC用）
  fab.addEventListener('mouseenter', () => {
    fab.style.transition = 'transform 0.2s ease-out, box-shadow 0.2s ease-out';
    fab.style.transform = 'translateY(-4px)';
    fab.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
  });

  fab.addEventListener('mouseleave', () => {
    fab.style.transform = 'translateY(0)';
    fab.style.boxShadow = '';
  });
}

/**
 * リップルエフェクトの追加
 */
function addRippleEffect(element, event) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';

  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';

  element.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
}

/**
 * ボタンにリップルエフェクトを適用
 */
function initRippleEffects() {
  // 全てのボタンにリップルエフェクトを追加
  const buttons = document.querySelectorAll('.btn, .fab, .task-menu-btn, .bulk-action-btn-with-label');

  buttons.forEach(button => {
    button.style.position = 'relative';
    button.style.overflow = 'hidden';

    button.addEventListener('click', (e) => {
      addRippleEffect(button, e);
    });
  });
}

/**
 * 24時間ゲージのアニメーション初期化
 */
function initGaugeAnimations() {
  const gaugeElapsed = document.getElementById('time-gauge-elapsed');
  const gaugeScheduled = document.getElementById('time-gauge-scheduled');
  const gaugeFree = document.getElementById('time-gauge-free');
  const timeMarker = document.getElementById('time-marker');

  // スムーズなトランジションを追加
  if (gaugeElapsed) {
    gaugeElapsed.style.transition = 'width 0.5s ease-out, background-color 0.3s ease-out';
  }
  if (gaugeScheduled) {
    gaugeScheduled.style.transition = 'width 0.5s ease-out, left 0.5s ease-out, background-color 0.3s ease-out';
  }
  if (gaugeFree) {
    gaugeFree.style.transition = 'width 0.5s ease-out, left 0.5s ease-out, background-color 0.3s ease-out';
  }
  if (timeMarker) {
    timeMarker.style.transition = 'left 1s ease-out';
  }
}

/**
 * ゲージ更新時のアニメーション
 */
function animateGaugeUpdate() {
  const gaugeElapsed = document.getElementById('time-gauge-elapsed');
  const gaugeScheduled = document.getElementById('time-gauge-scheduled');
  const gaugeFree = document.getElementById('time-gauge-free');

  // 短いパルスアニメーション
  [gaugeElapsed, gaugeScheduled, gaugeFree].forEach(element => {
    if (!element) return;

    element.style.transition = 'transform 0.2s ease-out';
    element.style.transform = 'scaleY(1.05)';

    setTimeout(() => {
      element.style.transform = 'scaleY(1)';
    }, 200);
  });
}

/**
 * トースト通知の表示
 */
function showToast(message, duration = 3000, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // 次のフレームで表示アニメーション
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // 指定時間後に非表示
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

/**
 * ローディングスピナーの表示
 */
function showLoadingSpinner(message = '読み込み中...') {
  const spinner = document.createElement('div');
  spinner.id = 'loading-spinner';
  spinner.className = 'loading-spinner';
  spinner.innerHTML = `
    <div class="spinner-container">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;

  document.body.appendChild(spinner);

  requestAnimationFrame(() => {
    spinner.classList.add('spinner-show');
  });
}

/**
 * ローディングスピナーの非表示
 */
function hideLoadingSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (!spinner) return;

  spinner.classList.remove('spinner-show');
  setTimeout(() => {
    spinner.remove();
  }, 300);
}

/**
 * アニメーション機能の初期化
 */
function initAnimations() {
  console.log('Initializing animations...');

  // 各種アニメーションの初期化
  initModalAnimations();
  animateFAB();
  initRippleEffects();
  initGaugeAnimations();

  console.log('Animations initialized');
}

// DOMロード後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnimations);
} else {
  initAnimations();
}

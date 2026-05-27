/* ============================================================
   SAYAKA LP — Scroll Choreography (Playful 全振り)
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

  const trail      = document.querySelector('.lure-trail');
  const lure       = document.querySelector('.trail-lure');
  const line       = document.querySelector('.trail-line');
  const castCurve  = document.querySelector('.cast-curve');
  const castPath   = document.querySelector('.cast-curve-path');
  const rodWrap    = document.querySelector('.fishing-rod-wrap');
  const narrative  = document.querySelector('.narrative');

  const ROD_TIP_OFFSET_X = 197;
  const ROD_TIP_OFFSET_Y = 6;
  const LURE_RING_Y = 4;

  const getRodTip = () => {
    const r = rodWrap.getBoundingClientRect();
    return { x: r.left + ROD_TIP_OFFSET_X, y: r.top + ROD_TIP_OFFSET_Y };
  };

  let isCasting = false;
  let castDone = false;
  let landingX = 0;
  let landingY = 0;

  // キャスト中：ロッド先端→ルアー現在地 まで滑らかな二次ベジェ曲線
  const updateCastCurve = () => {
    if (!isCasting) return;
    const tip = getRodTip();
    const lr = lure.getBoundingClientRect();
    const lx = (lr.left + lr.right) / 2;
    const ly = lr.top + LURE_RING_Y;
    // 制御点：両端の中央 X、両端より 160px 高い位置
    const apexX = (tip.x + lx) / 2;
    const apexY = Math.min(tip.y, ly) - 160;
    castPath.setAttribute('d', `M ${tip.x} ${tip.y} Q ${apexX} ${apexY} ${lx} ${ly}`);
  };

  // 着水後：垂直線（着水位置→ルアー現在位置）
  const updateVerticalLine = () => {
    if (!castDone) return;
    const lr = lure.getBoundingClientRect();
    const lx = (lr.left + lr.right) / 2;
    const ly = lr.top + LURE_RING_Y;
    line.style.left = (lx - 1.5) + 'px';
    line.style.top  = landingY + 'px';
    line.style.height = Math.max(0, ly - landingY) + 'px';
  };

  let splashed = false;
  const splashEl = document.querySelector('.splash');
  const rippleContainerEl = document.querySelector('.ripple-container');

  const triggerSplash = () => {
    if (splashed) return;
    splashed = true;

    // ルアーの着水位置を viewport 基準で取得し、splash/ripple を配置
    const lureRect = lure.getBoundingClientRect();
    const splashX = (lureRect.left + lureRect.right) / 2;
    const splashY = lureRect.top + 6; // ルアー上端付近（=水面）
    if (splashEl) { splashEl.style.left = splashX + 'px'; splashEl.style.top = splashY + 'px'; }
    if (rippleContainerEl) { rippleContainerEl.style.left = splashX + 'px'; rippleContainerEl.style.top = splashY + 'px'; }

    const ripples = gsap.utils.toArray('.ripple');
    const drops = gsap.utils.toArray('.splash .drop');

    // 水しぶき：水面の「上側」に飛び散る（角度は上半分 -π〜0）
    drops.forEach((drop, i) => {
      const angle = -Math.PI + (i / drops.length) * Math.PI + (Math.random() - 0.5) * 0.3;
      const dist = 55 + Math.random() * 40;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist; // 負値（上方向）
      gsap.fromTo(drop,
        { x: 0, y: 0, scale: 0, opacity: 0 },
        { x: dx, y: dy, scale: 1, opacity: 1, duration: 0.45, ease: 'power2.out', delay: Math.random() * 0.05 }
      );
      // 上昇後にちょっとだけ重力で落ちて消える（水面より上のままフェード）
      gsap.to(drop, { x: dx + (Math.random() - 0.5) * 8, y: dy + 22, opacity: 0, scale: 0.45, duration: 0.55, ease: 'power2.in', delay: 0.45 + Math.random() * 0.05 });
    });

    // 波紋：水面で広がる横長楕円
    ripples.forEach((r, i) => {
      const stagger = i * 0.16 + Math.random() * 0.08;
      const duration = 2.2 + i * 0.3;
      gsap.fromTo(r,
        { scale: 0.18, opacity: 0 },
        { scale: 1.0 + i * 0.06, opacity: 0,
          keyframes: { opacity: [0, 0.9, 0.6, 0], easeEach: 'power1.out' },
          duration: duration, ease: 'power2.out', delay: stagger }
      );
    });
    gsap.delayedCall(0.9, () => {
      ripples.slice(0, 4).forEach((r, i) => {
        gsap.fromTo(r,
          { scale: 0.18, opacity: 0 },
          { scale: 0.75 + i * 0.1, opacity: 0,
            keyframes: { opacity: [0, 0.5, 0.3, 0] },
            duration: 1.9 + i * 0.2, ease: 'power2.out', delay: i * 0.2 }
        );
      });
    });
  };

  // ---- Hero抜けたら左キャストモーション発動 ----
  const playCast = () => {
    if (!rodWrap || !lure || !line || !trail || !castCurve || !castPath) return;

    const tip = getRodTip();
    const containerLeft = window.innerWidth - 262;
    const lureStartXInContainer = tip.x - containerLeft - 30;
    const lureRestX = 0;

    // 初期：ルアーを竿先付近、糸は曲線で表示開始
    gsap.set(lure, { left: lureStartXInContainer, top: tip.y - 60, rotation: -25, scale: 0.95 });
    trail.classList.add('is-active');
    castCurve.classList.add('is-active');
    isCasting = true;
    updateCastCurve();
    gsap.ticker.add(updateCastCurve);

    const finalize = () => {
      gsap.set(lure, { left: lureRestX, top: 200, rotation: 0, scale: 1 });
      // 着水位置を実測（垂直線の上端アンカー）
      const lr = lure.getBoundingClientRect();
      landingX = (lr.left + lr.right) / 2;
      landingY = lr.top + LURE_RING_Y;

      isCasting = false;
      castDone = true;
      gsap.ticker.remove(updateCastCurve);
      castCurve.classList.remove('is-active');
      line.classList.add('is-active');
      updateVerticalLine();
      ScrollTrigger.refresh();
    };

    const tl = gsap.timeline({ onComplete: finalize });

    // ロッドの振り：振りかぶり→ピュッと振る→収まる
    tl.set(rodWrap, { rotation: -42 })
      .to(rodWrap, { rotation: 28, duration: 0.30, ease: 'power3.in' })
      .to(rodWrap, { rotation: 0, duration: 0.45, ease: 'back.out(1.4)' }, '-=0.05');

    // ルアーの飛行：頂点まで上がる→着水位置に降りる（並列で開始）
    tl.to(lure, {
      left: lureStartXInContainer * 0.35,
      top: tip.y - 220,
      rotation: 140,
      scale: 1.0,
      duration: 0.42,
      ease: 'power1.out'
    }, 0.16)
    .to(lure, {
      left: lureRestX,
      top: 200,
      rotation: 360,
      duration: 0.46,
      ease: 'power2.in'
    });

    // セーフティ：1.6秒で確実に終端
    setTimeout(() => { if (!castDone) finalize(); }, 1600);
  };

  // タブが復帰した時、キャスト未完了なら強制完了
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !castDone && trail && trail.classList.contains('is-active')) {
      gsap.set(lure, { left: 0, top: 200, rotation: 0, scale: 1 });
      const lr = lure.getBoundingClientRect();
      landingX = (lr.left + lr.right) / 2;
      landingY = lr.top + LURE_RING_Y;
      isCasting = false;
      castDone = true;
      gsap.ticker.remove(updateCastCurve);
      castCurve.classList.remove('is-active');
      line.classList.add('is-active');
      updateVerticalLine();
    }
  });

  ScrollTrigger.create({
    trigger: '.hero',
    start: 'bottom 80%',
    once: true,
    onEnter: playCast
  });

  // ---- ルアー＋糸: scroll進捗で落ちていく ＋ 着水splashトリガー ----
  if (trail && lure && line && rodWrap && narrative) {
    const surfaceStage = document.querySelector('.stage-surface');

    ScrollTrigger.create({
      trigger: narrative,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
      onUpdate: (self) => {
        if (!castDone) return; // キャスト完了まで待機

        const progress = self.progress;
        const vh = window.innerHeight;

        // 序盤でガッと落ちるイージング
        const eased = progress < 0.12
          ? (progress / 0.12) * 0.75
          : 0.75 + (progress - 0.12) / 0.88 * 0.25;

        const startY = 200;
        const endY = vh - 100;
        const lureY = startY + (endY - startY) * eased;

        lure.style.top = lureY + 'px';

        // 黄色糸：着水位置から下に垂直に伸びる
        updateVerticalLine();

        // 着水splash：stage-surface top がルアー底に届いた瞬間
        if (!splashed && surfaceStage) {
          const surfaceTop = surfaceStage.getBoundingClientRect().top;
          const lureBottomY = lureY + (lure.offsetHeight || 140);
          if (surfaceTop <= lureBottomY && surfaceTop > lureBottomY - 80) {
            triggerSplash();
          }
        }
      }
    });
  }

  // リサイズ時にも糸の描画を更新
  window.addEventListener('resize', () => { if (castDone) updateVerticalLine(); });

  // ---- Stage 0: 前奏文字 ----
  gsap.utils.toArray('.stage-text-prelude .lead').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: i * 0.25,
      scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' }
    });
  });

  // splash は↑のonUpdateでルアー着水時に triggerSplash() を呼ぶ方式に統合

  // ---- Stage 1: 挨拶 ----
  gsap.timeline({
    scrollTrigger: { trigger: '.stage-text-surface', start: 'top 75%', toggleActions: 'play none none reverse' }
  })
    .to('.greeting', { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' })
    .to('.role',      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    .to('.info-line', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.18 }, '-=0.4');

  // ---- Stage 2: 海中 ----
  gsap.to('.undersea-lead', {
    opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.stage-undersea', start: 'top 60%', toggleActions: 'play none none reverse' }
  });
  gsap.utils.toArray('.genre').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1, duration: 1.0, ease: 'power2.out', delay: i * 0.15,
      scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none reverse' }
    });
  });
  gsap.to('.genre-note', {
    opacity: 1, y: 0, duration: 1.0, ease: 'power3.out',
    scrollTrigger: { trigger: '.genre-note', start: 'top 92%', toggleActions: 'play none none reverse' }
  });

  // ---- Stage 3: 深海 ----
  gsap.utils.toArray('.deep-step').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: i * 0.18,
      scrollTrigger: { trigger: '.stage-deep', start: 'top 65%', toggleActions: 'play none none reverse' }
    });
  });

  // ---- Stage 4: 宇宙 ----
  gsap.to('.space-lead', {
    opacity: 1, y: 0, duration: 1.0, ease: 'power3.out',
    scrollTrigger: { trigger: '.stage-space', start: 'top 55%', toggleActions: 'play none none reverse' }
  });

  // ---- Stage 5: Voice ----
  gsap.timeline({
    scrollTrigger: { trigger: '.stage-dawn', start: 'top 60%', toggleActions: 'play none none reverse' }
  })
    .to('.voice-row:nth-child(1)', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
    .to('.voice-row:nth-child(2)', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.35')
    .to('.voice-row:nth-child(3)', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.35')
    .to('.voice-row:nth-child(4)', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.35')
    .to('.voice-row:nth-child(5)', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.35')
    .to('.voice-row:nth-child(6)', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.35');

  // ---- Stage 6: 着水 ----
  gsap.timeline({
    scrollTrigger: { trigger: '.stage-landing', start: 'top 70%', toggleActions: 'play none none reverse' }
  })
    .to('.landing-lead',     { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    .to('.landing-cta',      { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' }, '-=0.4')
    .to('.landing-cta-sub',  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
    .to('.contact-form',     { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.4');

  // ---- お問い合わせフォーム送信 ----
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    const statusEl = contactForm.querySelector('.form-status');
    const submitBtn = contactForm.querySelector('.form-submit');

    // Shift+Enter で改行、Enter単体で送信（textareaのみ）
    const messageEl = contactForm.querySelector('#cf-message');
    if (messageEl) {
      messageEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
          e.preventDefault();
          if (typeof contactForm.requestSubmit === 'function') {
            contactForm.requestSubmit();
          } else {
            contactForm.dispatchEvent(new Event('submit', { cancelable: true }));
          }
        }
      });
    }
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const action = contactForm.action;

      // 必須項目チェック
      const name = contactForm.name.value.trim();
      const email = contactForm.email.value.trim();
      const message = contactForm.message.value.trim();
      if (!name || !email || !message) {
        statusEl.textContent = '※ お名前・メールアドレス・お問い合わせ内容は必須です。';
        statusEl.className = 'form-status is-error';
        return;
      }

      // バックエンド未接続時のフェイルセーフ
      if (action.includes('REPLACE_WITH_YOUR_FORMSPREE_ID') || !action.startsWith('http')) {
        statusEl.textContent = '※ 送信先が未設定です。フォーム送信機能の設定をご依頼ください。';
        statusEl.className = 'form-status is-error';
        console.warn('Contact form action URL is not configured. Set up Formspree at https://formspree.io and replace the action URL.');
        return;
      }

      submitBtn.disabled = true;
      statusEl.textContent = '送信中…';
      statusEl.className = 'form-status';

      try {
        const formData = new FormData(contactForm);
        const res = await fetch(action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          statusEl.textContent = 'ありがとうございます！送信完了しました。改めてご連絡いたします。';
          statusEl.className = 'form-status is-success';
          contactForm.reset();
        } else {
          throw new Error('Submit failed: ' + res.status);
        }
      } catch (err) {
        console.error(err);
        statusEl.textContent = '送信に失敗しました。少し時間をおいて再度お試しください。';
        statusEl.className = 'form-status is-error';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

});

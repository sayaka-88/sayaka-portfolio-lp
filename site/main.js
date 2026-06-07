/* ============================================================
   SAYAKA LP — Scroll Choreography (Playful 全振り)
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

  // ---- ハンバーガーメニュー ----
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (menuToggle && mobileMenu) {
    const setOpen = (open) => {
      menuToggle.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden', String(!open));
      mobileMenu.classList.toggle('is-open', open);
    };
    const toggle = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      setOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
    };
    menuToggle.addEventListener('click', toggle);
    // iOS Safari 対応：touchend でも反応させる
    menuToggle.addEventListener('touchend', toggle, { passive: false });
    // メニュー内リンク押下で閉じる
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => setOpen(false));
    });
  }

  const trail      = document.querySelector('.lure-trail');
  const lure       = document.querySelector('.trail-lure');
  const line       = document.querySelector('.trail-line');
  const castCurve  = document.querySelector('.cast-curve');
  const castPath   = document.querySelector('.cast-curve-path');
  const rodWrap    = document.querySelector('.fishing-rod-wrap');
  const narrative  = document.querySelector('.narrative');

  // ロッド先端の位置（rod画像内の比率：右下寄り）
  const ROD_TIP_RATIO_X = 0.895; // rod width × 0.895
  const ROD_TIP_RATIO_Y = 0.021; // rod height × 0.021
  const LURE_RING_Y = 4;

  const getRodTip = () => {
    const r = rodWrap.getBoundingClientRect();
    return {
      x: r.left + r.width  * ROD_TIP_RATIO_X,
      y: r.top  + r.height * ROD_TIP_RATIO_Y
    };
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

  // 糸の上端：ヘッダーの波の下から垂らす
  const siteHeaderEl = document.querySelector('.site-header');
  const getLineTopY = () => {
    const b = siteHeaderEl ? siteHeaderEl.getBoundingClientRect().bottom : 64;
    return b + 22; // ヘッダー波（22px）の下端あたり
  };

  // 垂直線（ヘッダー波の下→ルアー現在位置）
  const updateVerticalLine = () => {
    if (!castDone) return;
    const lr = lure.getBoundingClientRect();
    const lx = (lr.left + lr.right) / 2;
    const ly = lr.top + LURE_RING_Y;
    const topY = getLineTopY();
    line.style.left = (lx - 1.5) + 'px';
    line.style.top  = topY + 'px';
    line.style.height = Math.max(0, ly - topY) + 'px';
  };

  let splashed = false;
  const splashEl = document.querySelector('.splash');
  const rippleContainerEl = document.querySelector('.ripple-container');

  // 任意の座標で水しぶき＋波紋を出す（再利用可能）
  const doSplash = (splashX, splashY) => {
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

  // 初回着水（ガード付き）
  const triggerSplash = () => {
    if (splashed) return;
    splashed = true;
    const lureRect = lure.getBoundingClientRect();
    doSplash((lureRect.left + lureRect.right) / 2, lureRect.top + 6); // ルアー上端付近（=水面）
  };

  // ---- Hero抜けたら左キャストモーション発動 ----
  const playCast = () => {
    if (!rodWrap || !lure || !line || !trail || !castCurve || !castPath) return;

    const tip = getRodTip();
    const isMobile = window.innerWidth <= 720;
    const containerLeft = isMobile
      ? (window.innerWidth - 80) / 2  // モバイル：lure-trail はセンター付近 (right: 182, width: 80 だが PC値)。実測でも対応。
      : window.innerWidth - 262;
    const lureRestX = 0;
    // 跳ね上がり高さ：ロッド先端から上方向。画面が小さい時はビューポート連動で抑える
    const peakLift = Math.min(220, Math.max(80, window.innerHeight * 0.18));
    const peakY = tip.y - peakLift;
    const lureStartXInContainer = tip.x - containerLeft - 30;

    // 初期：ルアーを竿先付近、糸は曲線で表示開始
    gsap.set(lure, { left: lureStartXInContainer, top: tip.y - 40, rotation: -25, scale: 0.92 });
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
    tl.set(rodWrap, { rotation: -38 })
      .to(rodWrap, { rotation: 22, duration: 0.32, ease: 'power3.in' })
      .to(rodWrap, { rotation: 0,  duration: 0.55, ease: 'back.out(1.3)' }, '-=0.06');

    // ルアーの飛行：頂点まで上がる→着水位置に降りる（並列で開始）
    tl.to(lure, {
      left: lureStartXInContainer * 0.4,
      top: peakY,
      rotation: 90,
      scale: 1.0,
      duration: 0.5,
      ease: 'sine.out'
    }, 0.18)
    .to(lure, {
      left: lureRestX,
      top: 200,
      rotation: 180,
      duration: 0.55,
      ease: 'sine.in'
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

  // ============================================================
  //  タップして釣る（ルアーをクリック → ランダムで魚/お宝が釣れる）
  // ============================================================
  const catchEl     = document.querySelector('.trail-catch');
  const hintEl      = document.querySelector('.lure-hint');
  const bannerEl    = document.querySelector('.catch-banner');
  const bannerEmoji = bannerEl ? bannerEl.querySelector('.catch-banner-emoji') : null;
  const bannerName  = bannerEl ? bannerEl.querySelector('.catch-banner-name') : null;
  const countEl     = document.querySelector('.catch-count');
  const countNumEl  = document.querySelector('.catch-count-num');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 釣果カウンター
  let catchCount = 0;
  const bumpCount = () => {
    catchCount++;
    if (countNumEl) countNumEl.textContent = catchCount;
    if (countEl) {
      countEl.classList.add('is-show');
      countEl.classList.remove('bump');
      void countEl.offsetWidth;
      countEl.classList.add('bump');
    }
  };

  // 釣れるもの：魚 ＋ お宝（rare）がランダムで混ざる
  const CATCH_POOL = [
    { img: 'sea-tuna.png',         name: 'マグロ',             emoji: '🐟' },
    { img: 'sea-goldfish.png',     name: '金魚',               emoji: '🐠' },
    { img: 'sea-rainbowtrout.png', name: 'ニジマス',           emoji: '🐟' },
    { img: 'sea-crab.png',         name: 'カニ',               emoji: '🦀' },
    { img: 'sea-dolphin.png',      name: 'イルカ',             emoji: '🐬' },
    { img: 'sea-whale.png',        name: 'クジラ',             emoji: '🐳' },
    { img: 'sea-duck.png',         name: 'アヒル',             emoji: '🦆' },
    { img: 'deep-oarfish.png',     name: 'リュウグウノツカイ', emoji: '🐡' },
    { img: 'anglerfish.png',       name: 'アンコウ',           emoji: '🎣' },
    { img: 'deep-squid.png',       name: 'イカ',               emoji: '🦑' },
    { img: 'deep-jellyfish.png',   name: 'クラゲ',             emoji: '🪼' },
    { img: 'sea-shell.png',        name: '貝がら',             emoji: '🐚' },
    { img: 'sea-candies.png',      name: 'キャンディ',         emoji: '🍬' },
    { img: 'sea-beachball.png',    name: 'ビーチボール',       emoji: '🏐' },
    { img: 'deep-star.png',        name: 'ヒトデ',             emoji: '⭐' },
    // ---- お宝（レア）----
    { img: 'deep-diamond.png',     name: 'ダイヤモンド',       emoji: '💎', rare: true },
    { img: 'deep-crystal.png',     name: 'クリスタル',         emoji: '🔮', rare: true },
    { img: 'deep-crown.png',       name: '王冠',               emoji: '👑', rare: true },
    { img: 'space-crown.png',      name: '黄金の王冠',         emoji: '👑', rare: true },
    { img: 'deep-treasure.png',    name: '宝箱',               emoji: '🎁', rare: true },
    { img: 'deep-pearl-1.png',     name: '真珠',               emoji: '🫧', rare: true },
    { img: 'deep-pearl-2.png',     name: '大粒の真珠',         emoji: '🫧', rare: true },
    { img: 'deep-pearl-3.png',     name: '虹色の真珠',         emoji: '🫧', rare: true },
  ];
  const pickCatch = () => CATCH_POOL[Math.floor(Math.random() * CATCH_POOL.length)];

  let isReeling     = false; // 巻き上げ中はスクロール追従を止める
  let scrollLureTop = 200;   // スクロールで決まるルアーのtop
  let canCatch      = false; // 海中に入っていて釣れる状態か
  let swingTween    = null;  // 獲物のゆらゆら
  const CATCH_W = window.innerWidth <= 720 ? 60 : 76;
  const lureH = () => (lure.offsetHeight || 120);

  // 獲物をルアーのフック位置に置く
  const positionCatch = (top) => {
    if (!catchEl) return;
    const cx = lure.offsetLeft + lure.offsetWidth / 2;
    catchEl.style.left = (cx - CATCH_W / 2) + 'px';
    catchEl.style.top  = (top + lureH() * 0.6) + 'px';
  };

  // ルアーtopをまとめてセット（糸・ヒント・獲物も連動）
  const setLureTop = (top) => {
    lure.style.top = top + 'px';
    if (hintEl) hintEl.style.top = (top + lureH() * 0.42) + 'px';
    if (catchEl && catchEl.classList.contains('is-on')) positionCatch(top);
    updateVerticalLine();
  };

  const refreshCatchable = () => {
    if (!trail || isReeling) return;
    if (castDone && canCatch) {
      trail.classList.add('is-catchable');
      if (countEl) countEl.classList.add('is-show'); // 釣果カウンターを出す
    } else {
      trail.classList.remove('is-catchable');
    }
  };

  const showBanner = (item) => {
    if (!bannerEl) return;
    if (bannerEmoji) bannerEmoji.textContent = item.emoji || '🎣';
    if (bannerName)  bannerName.textContent  = (item.rare ? '✨ ' : '') + item.name + ' が釣れた！';
    bannerEl.classList.remove('is-hide', 'is-show');
    void bannerEl.offsetWidth;
    bannerEl.classList.add('is-show');
  };
  const hideBanner = () => {
    if (!bannerEl) return;
    bannerEl.classList.remove('is-show');
    bannerEl.classList.add('is-hide');
  };

  // 巻き上げ後：獲物を外して元の水深へ戻す
  function endCatch() {
    if (swingTween) { swingTween.kill(); swingTween = null; }
    hideBanner();
    if (catchEl) {
      gsap.to(catchEl, {
        opacity: 0, scale: 0.4, duration: 0.3, ease: 'power2.in',
        onComplete: () => { catchEl.classList.remove('is-on'); gsap.set(catchEl, { rotation: 0 }); }
      });
    }
    const back = scrollLureTop;
    const state = { top: parseFloat(lure.style.top) || back };
    gsap.to(state, {
      top: back, duration: 0.5, ease: 'power2.inOut',
      onUpdate: () => setLureTop(state.top),
      onComplete: () => {
        gsap.set(lure, { clearProps: 'transform' }); // CSSのゆらゆらを復帰
        trail.classList.remove('is-reeling');
        isReeling = false;
        refreshCatchable();
      }
    });
  }

  // 釣り上げ → わーっと巻き上げ
  const startCatch = () => {
    if (!castDone || isReeling || !canCatch || !catchEl) return;
    isReeling = true;
    trail.classList.remove('is-catchable');
    trail.classList.add('is-reeling');

    const item     = pickCatch();
    const startTop = parseFloat(lure.style.top) || scrollLureTop;
    const topPos   = Math.max(64, window.innerHeight * 0.08);

    catchEl.src = 'assets/img/' + item.img;
    catchEl.classList.add('is-on');
    positionCatch(startTop);
    gsap.set(catchEl, { opacity: 0, scale: 0.4, rotation: 0 });
    gsap.set(lure, { rotation: 0 });

    const state = { top: startTop };
    const apply = () => setLureTop(state.top);

    // 巻き上げ中に水面を突き抜けたら しぶき
    let surfaceDone = false;
    const checkSurface = () => {
      if (surfaceDone || !landingY) return;
      const r = lure.getBoundingClientRect();
      if (r.top + LURE_RING_Y <= landingY) {
        surfaceDone = true;
        doSplash((r.left + r.right) / 2, landingY);
      }
    };

    gsap.timeline({ onComplete: endCatch })
      // 1) ヒット：クッと引き込まれる
      .to(state, { top: startTop + (prefersReduced ? 6 : 22), duration: 0.14, ease: 'power2.in', onUpdate: apply })
      // 2) 獲物がフッキング ＋ バナー ＋ 釣果カウント
      .add(() => { showBanner(item); bumpCount(); })
      .to(catchEl, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' })
      .add(() => {
        if (!prefersReduced) {
          swingTween = gsap.to(catchEl, { rotation: 9, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 0' });
        }
      })
      // 3) わーっと巻き上げ
      .to(state, {
        top: topPos, duration: prefersReduced ? 0.6 : 1.0, ease: 'power2.inOut',
        onUpdate: () => { apply(); checkSurface(); }
      }, '>-0.05')
      // 4) 上でちょっと見せる
      .to({}, { duration: 0.9 });
  };

  if (lure) lure.addEventListener('click', startCatch);

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

        scrollLureTop = lureY;
        canCatch = progress > 0.1; // 海中に入ったら釣れる

        if (isReeling) return; // 巻き上げ中は見た目を動かさない

        // ルアー＋黄色糸＋ヒントを連動
        setLureTop(lureY);
        refreshCatchable();

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

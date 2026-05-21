/* ============================================================
   SAYAKA LP — Scroll Choreography (Playful 全振り)
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

  const trail     = document.querySelector('.lure-trail');
  const lure      = document.querySelector('.trail-lure');
  const line      = document.querySelector('.trail-line');
  const rodWrap   = document.querySelector('.fishing-rod-wrap');
  const narrative = document.querySelector('.narrative');

  // 竿先（rod-new.png の上端先端付近）と、ルアー画像内のリング位置の相対座標
  const ROD_TIP_Y_OFFSET = 10;
  const LURE_RING_Y = 4;

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

  // ---- Hero抜けたらルアー追従を活性化 ----
  if (trail) {
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'bottom 80%',
      onEnter:    () => trail.classList.add('is-active'),
      onLeaveBack:() => trail.classList.remove('is-active')
    });
  }

  // ---- ルアー＋糸: scroll進捗に応じて落ちていく ＋ 着水splashトリガー ----
  if (trail && lure && line && rodWrap && narrative) {
    const surfaceStage = document.querySelector('.stage-surface');

    ScrollTrigger.create({
      trigger: narrative,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
      onUpdate: (self) => {
        const progress = self.progress;
        const vh = window.innerHeight;

        const rodRect = rodWrap.getBoundingClientRect();
        const rodTipY = rodRect.top + ROD_TIP_Y_OFFSET;

        // 一気に落ちる演出：序盤でガッと落ちる
        const eased = progress < 0.12
          ? (progress / 0.12) * 0.8
          : 0.8 + (progress - 0.12) / 0.88 * 0.2;

        const startY = Math.max(rodTipY + 16, 140);
        const endY = vh - 100;
        const lureY = startY + (endY - startY) * eased;

        lure.style.top = lureY + 'px';

        const lineTopY = rodTipY;
        const lineBottomY = lureY + LURE_RING_Y;
        line.style.top = lineTopY + 'px';
        line.style.height = Math.max(0, lineBottomY - lineTopY) + 'px';

        // 着水splash判定：水面（stage-surface top）がルアー底に追いついた瞬間
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
    .to('.role',     { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    .to('.bio',      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4');

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

  // ---- Stage 3: 深海 ----
  gsap.utils.toArray('.deep-line').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: i * 0.35,
      scrollTrigger: { trigger: '.stage-deep', start: 'top 60%', toggleActions: 'play none none reverse' }
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
    .to('.dawn-quote:nth-child(1)',  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
    .to('.dawn-quote:nth-child(2)',  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    .to('.dawn-quote:nth-child(3)',  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    .to('.dawn-close',               { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' }, '-=0.3');

  // ---- Stage 6: 着水 ----
  gsap.timeline({
    scrollTrigger: { trigger: '.stage-landing', start: 'top 70%', toggleActions: 'play none none reverse' }
  })
    .to('.landing-lead',   { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    .to('.landing-cta',    { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' }, '-=0.4')
    .to('.landing-button', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.4');

});

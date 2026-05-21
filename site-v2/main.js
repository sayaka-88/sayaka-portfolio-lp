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

  const ROD_TIP_Y_IN_SVG = 188;
  const LURE_RING_Y = 22;

  // ---- Hero抜けたら trail を活性化 ----
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'bottom 80%',
    onEnter:    () => trail.classList.add('is-active'),
    onLeaveBack:() => trail.classList.remove('is-active')
  });

  // ---- ルアー＋糸 のスクロール追従 ----
  ScrollTrigger.create({
    trigger: narrative,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
    onUpdate: (self) => {
      const progress = self.progress;
      const vh = window.innerHeight;

      const rodRect = rodWrap.getBoundingClientRect();
      const rodTipY = rodRect.top + ROD_TIP_Y_IN_SVG;

      const startY = Math.max(rodTipY + 30, 200);
      const endY = vh - 80;
      const lureY = startY + (endY - startY) * progress;

      lure.style.top = lureY + 'px';

      const lineTopY = rodTipY;
      const lineBottomY = lureY + LURE_RING_Y;
      line.style.top = lineTopY + 'px';
      line.style.height = Math.max(0, lineBottomY - lineTopY) + 'px';
    }
  });

  // ---- Stage 0: 前奏文字 ----
  gsap.utils.toArray('.stage-text-prelude .lead').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: i * 0.25,
      scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' }
    });
  });

  // ---- 水しぶき + 波紋 ----
  const ripples = gsap.utils.toArray('.ripple');
  const drops = gsap.utils.toArray('.splash .drop');

  ScrollTrigger.create({
    trigger: '.stage-surface',
    start: 'top 70%',
    once: true,
    onEnter: () => {
      drops.forEach((drop, i) => {
        const angle = (i / drops.length) * Math.PI * 2 - Math.PI / 2;
        const dist = 70 + Math.random() * 45;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist * 0.55 - 24;
        gsap.fromTo(drop,
          { x: 0, y: 0, scale: 0, opacity: 0 },
          { x: dx, y: dy, scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out', delay: Math.random() * 0.08 }
        );
        gsap.to(drop, {
          y: '+=140', opacity: 0, scale: 0.4, duration: 0.8, ease: 'power2.in', delay: 0.5 + Math.random() * 0.08
        });
      });

      ripples.forEach((r, i) => {
        const stagger = i * 0.18 + Math.random() * 0.1;
        const duration = 2.4 + i * 0.3 + Math.random() * 0.3;
        const finalScale = 1.0 + i * 0.05;
        gsap.fromTo(r,
          { scale: 0.2, opacity: 0 },
          {
            scale: finalScale, opacity: 0,
            keyframes: { opacity: [0, 0.9, 0.6, 0], easeEach: 'power1.out' },
            duration: duration, ease: 'power2.out', delay: stagger
          }
        );
      });

      gsap.delayedCall(1.0, () => {
        ripples.slice(0, 4).forEach((r, i) => {
          gsap.fromTo(r,
            { scale: 0.2, opacity: 0 },
            {
              scale: 0.8 + i * 0.1, opacity: 0,
              keyframes: { opacity: [0, 0.5, 0.3, 0] },
              duration: 2.0 + i * 0.2, ease: 'power2.out', delay: i * 0.2
            }
          );
        });
      });
    }
  });

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

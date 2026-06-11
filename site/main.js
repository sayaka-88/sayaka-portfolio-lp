/* ============================================================
   SAYAKA LP — Scroll Choreography (Playful 全振り)
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

function sayakaInit() {
  // JS初期化が走った合図。これが付いた時だけテキストを一旦隠してアニメ表示する。
  // （付かない＝JS不達時は、下のCSSフォールバックでテキストを最初から表示する）
  document.documentElement.classList.add('js');

  // ---- 安全ラッパー：各セットアップを独立して実行する ----
  // 1つのブロックで例外が出ても、他のブロック（特に文字アニメ）は動き続ける。
  // ＝「どこかを直してミスっても、全部が道連れで真っ白」を防ぐ仕切り。
  const safe = (label, fn) => { try { fn(); } catch (e) { console.error('[init:' + label + ']', e); } };

  // ---- ハンバーガーメニュー ----
  safe('menu', () => {
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
  });

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
    return b + 24; // ヘッダー波（24px）の下端あたり
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

  // ---- Hero抜けたら「ルアーと糸」だけをそっと出す（竿の投げモーションは廃止） ----
  const playCast = () => {
    if (!lure || !line || !trail) return;
    if (castDone) return;

    // ルアーを定位置（糸の真下・水面手前）に置く
    gsap.set(lure, { left: 0, top: 200, rotation: 0, scale: 1 });
    trail.classList.add('is-active'); // lure-trail がふわっとフェードイン

    // 着水アンカー（垂直線の上端＝ヘッダー波下／下端＝ルアー）を実測
    const lr = lure.getBoundingClientRect();
    landingX = (lr.left + lr.right) / 2;
    landingY = lr.top + LURE_RING_Y;

    isCasting = false;
    castDone = true;
    line.classList.add('is-active'); // 糸を表示
    updateVerticalLine();
    ScrollTrigger.refresh();
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

  safe('cast-trigger', () => {
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'bottom 80%',
    once: true,
    onEnter: playCast
  });
  });

  // ============================================================
  //  タップして釣る（ルアーをクリック → ランダムで魚/お宝が釣れる）
  // ============================================================
  const catchEl     = document.querySelector('.trail-catch');
  const hintEl      = document.querySelector('.lure-hint');
  const bannerEl    = document.querySelector('.catch-banner');
  const bannerEmoji = bannerEl ? bannerEl.querySelector('.catch-banner-emoji') : null;
  const bannerName  = bannerEl ? bannerEl.querySelector('.catch-banner-name') : null;
  const bannerRank  = bannerEl ? bannerEl.querySelector('.catch-rank-badge') : null;
  const countEl     = document.querySelector('.catch-count');
  const countNumEl  = document.querySelector('.catch-count-num');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== レアリティ（ランク）=====
  // SS(超激レア) → C(よく釣れる)。weight が小さいほど釣れにくい
  const RANKS = {
    UR: { weight: 1,  color: 'linear-gradient(90deg,#ff7a9c,#ffd24d,#5be8a0,#5ab0ff,#b06bff)' }, // 奇跡（虹）
    SS: { weight: 2,  color: '#f6b21b' }, // 金
    S:  { weight: 6,  color: '#b06bff' }, // 紫
    A:  { weight: 14, color: '#3da5ff' }, // 青
    B:  { weight: 26, color: '#43c59e' }, // 緑
    C:  { weight: 40, color: '#9aa7b3' }, // グレー
  };
  const RANK_ORDER = ['UR', 'SS', 'S', 'A', 'B', 'C'];
  // 捕獲成功率（高ランクほど逃げられやすい＝ポケモンのボール的に100%ではない）
  // URは「たまにルアーにかかるが、ほぼ釣れない」奇跡枠
  const CATCH_RATE = { UR: 0.15, SS: 0.4, S: 0.6, A: 0.75, B: 0.88, C: 0.95 };

  // 釣れるもの（rank: SS最レア 〜 Cよく釣れる / size: 全長cm範囲 / desc: 特徴）
  // zone: そのアイテムが釣れるセクション（surface=海面 / undersea=海中 / deep=深海 / space=宇宙）
  const CATCH_POOL = [
    { img: 'sea-girl-donut.png',     name: 'さやか',             emoji: '🎀', rank: 'UR', zone: 'surface',                  desc: 'いつか一緒に釣り行きましょうね😆？笑' },

    { img: 'deep-oarfish.png',       name: 'リュウグウノツカイ', emoji: '🐉', rank: 'SS', zone: 'deep',    size: [300, 800],   desc: '深海に棲む伝説の巨大魚。めったに姿を見せない、まさに幻の存在。' },
    { img: 'deep-treasure.png',      name: '宝箱',               emoji: '🎁', rank: 'SS', zone: 'deep',    size: [30, 55],     desc: '海底に深く沈んでいた宝箱。中身が気になるけど開けてのお楽しみ。' },

    { img: 'sea-whale.png',          name: 'クジラ',             emoji: '🐳', rank: 'S',  zone: 'undersea', size: [1000, 2500], desc: '海でいちばん大きなほ乳類。ゆうゆうと泳ぐ海の主。' },
    { img: 'deep-diamond.png',       name: 'ダイヤモンド',       emoji: '💎', rank: 'S',  zone: 'deep',    size: [2, 6],       desc: '永遠の輝きを放つ宝石。光を受けてきらきらと反射する。' },
    { img: 'deep-crown.png',         name: '王冠',               emoji: '👑', rank: 'S',  zone: 'deep',    size: [15, 26],     desc: 'どこかの誰かが落とした立派な王冠。宝石の飾りが輝く。' },
    { img: 'space-astronaut.png',    name: '宇宙飛行士',         emoji: '🧑‍🚀', rank: 'S',  zone: 'space',   size: [150, 190],   desc: '宇宙からやってきた探検家。虹色のヘルメットがきれい。なぜか海に…？' },
    { img: 'land-dog-astronaut.png', name: '宇宙パグ',           emoji: '🐶', rank: 'S',  zone: 'space',   size: [25, 45],     desc: '宇宙服に身をつつんだまんまるパグ。地球の海を見にきたのかな。' },

    { img: 'sea-tuna.png',           name: 'マグロ',             emoji: '🐟', rank: 'A',  zone: 'undersea', size: [100, 300],   desc: '海を高速で泳ぎ続ける回遊魚の王者。力強い引きが自慢。' },
    { img: 'sea-dolphin.png',        name: 'イルカ',             emoji: '🐬', rank: 'A',  zone: 'undersea', size: [150, 400],   desc: '賢くて人なつっこい海の人気者。ジャンプが得意。' },
    { img: 'sea-turtle.png',         name: 'ウミガメ',           emoji: '🐢', rank: 'A',  zone: 'undersea', size: [40, 120],    desc: 'のんびり海を泳ぐウミガメ。ながーく生きる海の長老。' },
    { img: 'anglerfish.png',         name: 'アンコウ',           emoji: '🎣', rank: 'A',  zone: 'deep',    size: [40, 150],    desc: '深海で頭の光をともし、獲物をじっと待ちぶせる。' },
    { img: 'deep-pearl-1.png',       name: '真珠',               emoji: '🫧', rank: 'A',  zone: 'deep',    size: [1, 3],       desc: '小さくても上品な海の宝石。やさしい光をたたえる。' },
    { img: 'deep-crystal.png',       name: 'クリスタル',         emoji: '🔮', rank: 'A',  zone: 'deep',    size: [5, 16],      desc: '神秘的な光をたたえた水晶。眺めていると吸い込まれそう。' },
    { img: 'deep-pearl-2.png',       name: '大粒の真珠',         emoji: '🫧', rank: 'A',  zone: 'deep',    size: [3, 9],       desc: '貝が長い年月をかけて育てた、まんまるで上品な宝。' },
    { img: 'deep-pearl-3.png',       name: '虹色の真珠',         emoji: '🌈', rank: 'A',  zone: 'deep',    size: [3, 9],       desc: '見る角度で七色に輝く奇跡の真珠。出会えたらラッキー。' },

    { img: 'sea-rainbowtrout.png',   name: 'ニジマス',           emoji: '🐟', rank: 'B',  zone: 'undersea', size: [30, 70],     desc: '体に走る虹色の帯が美しい川魚。清流の人気者。' },
    { img: 'sea-crab.png',           name: 'カニ',               emoji: '🦀', rank: 'B',  zone: 'undersea', size: [10, 30],     desc: '横歩きの名人。立派なハサミにはご注意を。' },
    { img: 'deep-squid.png',         name: 'イカ',               emoji: '🦑', rank: 'B',  zone: 'deep',    size: [20, 60],     desc: 'いざという時は墨をはいてスッと逃げる知恵者。' },
    { img: 'deep-jellyfish.png',     name: 'クラゲ',             emoji: '🪼', rank: 'B',  zone: 'deep',    size: [10, 40],     desc: 'ふわふわと漂う海の妖精。透きとおった体が涼しげ。' },

    { img: 'sea-goldfish.png',       name: '金魚',               emoji: '🐠', rank: 'C',  zone: 'surface', size: [5, 20],      desc: 'おまつりでおなじみの愛されもの。ひらひら泳ぐ。' },
    { img: 'sea-duck.png',           name: 'アヒル',             emoji: '🦆', rank: 'C',  zone: 'surface', size: [15, 30],     desc: 'プカプカ浮かぶおふろの定番。なぜか海にいた。' },
    { img: 'sea-shell.png',          name: '貝がら',             emoji: '🐚', rank: 'C',  zone: 'surface', size: [3, 12],      desc: '波打ち際で見つかる小さな宝物。耳をあてると海の音。' },
    { img: 'sea-candies.png',        name: 'キャンディ',         emoji: '🍬', rank: 'C',  zone: 'surface', size: [3, 8],       desc: '海で拾った甘い忘れもの。だれの落としもの？' },
    { img: 'sea-beachball.png',      name: 'ビーチボール',       emoji: '🏐', rank: 'C',  zone: 'surface', size: [30, 50],     desc: '夏の海の思い出カラー。ぷかぷか流れてきた。' },
    { img: 'deep-star.png',          name: 'ヒトデ',             emoji: '⭐', rank: 'C',  zone: 'deep',    size: [10, 30],     desc: '海の底でのんびり過ごす星の形のいきもの。' },
    { img: 'treat-cake.png',         name: 'ケーキ',             emoji: '🍰', rank: 'C',  zone: 'surface', size: [10, 25],     desc: '海で見つけた甘い誘惑。だれのお祝いだったのかな？' },
    { img: 'treat-donut.png',        name: 'ドーナツ',           emoji: '🍩', rank: 'C',  zone: 'surface', size: [8, 15],      desc: 'ぷかぷか流れてきた輪っかのおやつ。だれの落としもの？' },

    // ▼ 宇宙ゾーンの追加アイテム
    { img: 'space-earth.png',          name: '地球',               emoji: '🌍', rank: 'SS', zone: 'space',                   desc: '青く輝く水の惑星。まさかの大物が釣れた…！' },
    { img: 'space-ufo.png',            name: 'UFO',                emoji: '🛸', rank: 'S',  zone: 'space',   size: [200, 600],   desc: '宇宙をびゅんびゅん飛ぶ円盤。中に誰かいる…？' },
    { img: 'space-moon-rainbow.png',   name: '虹色の月',           emoji: '🌙', rank: 'A',  zone: 'space',                   desc: '七色にきらめく不思議な月。眺めると願いが叶うかも。' },
    { img: 'space-planet-saturn.png',  name: '土星',               emoji: '🪐', rank: 'A',  zone: 'space',                   desc: '美しい環をもつ惑星。宇宙のアイドル的存在。' },
    { img: 'space-planet-pink.png',    name: 'ピンクの惑星',       emoji: '🪐', rank: 'B',  zone: 'space',                   desc: 'ふんわりピンクに輝く、かわいい惑星。' },
    { img: 'space-laptop.png',         name: 'ノートパソコン',     emoji: '💻', rank: 'B',  zone: 'space',   size: [25, 40],     desc: '宇宙を漂うデザイナーの相棒。どこでもお仕事。' },
    { img: 'space-macaron-yellow.png', name: 'マカロン',           emoji: '🟡', rank: 'C',  zone: 'space',   size: [3, 6],       desc: '宇宙に浮かぶ甘いお菓子。ふんわり食感。' },
    { img: 'space-lollipop-spiral.png',name: 'ペロペロキャンディ', emoji: '🍭', rank: 'C',  zone: 'space',   size: [8, 15],      desc: 'くるくる模様の甘いキャンディ。' },

    // ▼「釣りしませんか」（水面の上）ゾーン
    { img: 'flyingfish.png',           name: '飛魚',               emoji: '🐟', rank: 'A',  zone: 'prelude', size: [20, 40],     desc: '水面をスイーッと飛ぶように泳ぐ魚。ジャンプが得意。' },

    // ▼ ボイス（朝の空）ゾーンの追加アイテム
    { img: 'carpet-girl.png',          name: '絨毯の女の子',       emoji: '🪄', rank: 'SS', zone: 'dawn',                    desc: '魔法のじゅうたんで空をかける女の子。自由に飛びまわる。' },
    { img: 'butterfly.png',            name: 'チョウチョ',         emoji: '🦋', rank: 'B',  zone: 'dawn',    size: [3, 8],       desc: 'ひらひら舞う、朝の蝶。' },
    { img: 'ice-chocomint.png',        name: 'チョコミントアイス', emoji: '🍦', rank: 'C',  zone: 'dawn',    size: [8, 15],      desc: '空に浮かぶチョコミントアイス。さわやかな甘さ。' },
  ];

  // いま釣れるゾーン＝ルアーの中心がどのセクション上にあるか
  const ZONE_SECTIONS = [
    ['prelude',  '.stage-prelude'],
    ['surface',  '.stage-surface'],
    ['undersea', '.stage-undersea'],
    ['deep',     '.stage-deep'],
    ['space',    '.stage-space'],
    ['dawn',     '.stage-dawn'],
  ];
  const currentZone = () => {
    if (!lure) return null;
    const r = lure.getBoundingClientRect();
    const cy = (r.top + r.bottom) / 2;
    for (const [zone, sel] of ZONE_SECTIONS) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const sr = el.getBoundingClientRect();
      if (cy >= sr.top && cy < sr.bottom) return zone;
    }
    return null;
  };

  // 重み付き抽選（指定ゾーンの「まだ釣っていないもの」だけ／ランクが高いほど釣れにくい）
  // 一度釣ると catchHistory に入り対象外＝そのゾーンから消える。「海に逃がす」で全部戻る。
  const pickCatch = (zone) => {
    const pool = CATCH_POOL.filter(it => it.zone === zone && !catchHistory[it.img]);
    if (!pool.length) return null;
    const total = pool.reduce((s, it) => s + RANKS[it.rank].weight, 0);
    let r = Math.random() * total;
    for (const it of pool) { r -= RANKS[it.rank].weight; if (r <= 0) return it; }
    return pool[pool.length - 1];
  };

  // ===== 釣果履歴（localStorageに保存）=====
  const HISTORY_KEY = 'sayaka_catch_history';
  let catchHistory = {};
  try { catchHistory = JSON.parse(localStorage.getItem(HISTORY_KEY)) || {}; } catch (e) { catchHistory = {}; }
  const totalCaught = () => Object.values(catchHistory).reduce((a, b) => a + b, 0);
  let catchCount = totalCaught();
  const saveHistory = () => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(catchHistory)); } catch (e) {} };

  // ===== シーンの生き物：釣ったら消える / 海に逃がすと戻る =====
  const creatureEls = [...document.querySelectorAll(
    '.fish-school .fish, .anglerfish, .deep-decor img, .space-decor img, .dawn-decor img, .prelude-floater.pf-duck, .prelude-floater.pf-flyingfish, .sf-shell, .sf-shell-2, .sf-girl-donut'
  )];
  safe('creatures-setup', () => {
  creatureEls.forEach(el => {
    let key = (el.getAttribute('src') || '').split('/').pop();
    if (key === 'deep-jellyfish-small.png') key = 'deep-jellyfish.png'; // 小クラゲもクラゲ扱い
    el.dataset.creature = key;
    el.classList.add('caughtable');
  });
  });
  const applyCaughtCreatures = () => {
    creatureEls.forEach(el => {
      if (catchHistory[el.dataset.creature]) el.classList.add('caught');
      else el.classList.remove('caught');
    });
  };

  // 釣果カウンター更新（履歴に記録）
  const bumpCount = (item) => {
    if (item) { catchHistory[item.img] = (catchHistory[item.img] || 0) + 1; saveHistory(); }
    catchCount = totalCaught();
    if (countNumEl) countNumEl.textContent = catchCount;
    applyCaughtCreatures(); // 釣った生き物をシーンから消す
    if (countEl) {
      countEl.classList.add('is-show');
      countEl.classList.remove('bump');
      void countEl.offsetWidth;
      countEl.classList.add('bump');
    }
  };
  safe('creatures-apply', () => {
    if (countNumEl) countNumEl.textContent = catchCount; // 保存済みの釣果を反映
    applyCaughtCreatures(); // 読み込み時：すでに釣った生き物は消えた状態にする
  });

  // ===== 釣果コレクション（履歴パネル）=====
  const historyEl   = document.querySelector('.catch-history');
  const historyList = document.querySelector('.catch-history-list');
  const historySum  = document.querySelector('.catch-history-summary');
  const buildHistory = () => {
    if (!historyList) return;
    const entries = CATCH_POOL
      .filter(it => catchHistory[it.img])
      .map(it => Object.assign({}, it, { count: catchHistory[it.img] }))
      .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank) || b.count - a.count);
    if (historySum) historySum.textContent = `これまで ${totalCaught()} 匹 / ${entries.length} 種類（全${CATCH_POOL.length}種）`;
    if (!entries.length) {
      historyList.innerHTML = '<p class="catch-history-empty">まだ何も釣れていません。<br>ルアーをタップして釣ってみてね🎣</p>';
      return;
    }
    historyList.innerHTML = entries.map(e =>
      `<div class="ch-item"><span class="ch-rank" style="background:${RANKS[e.rank].color}">${e.rank}</span>` +
      `<img class="ch-img" src="assets/img/${e.img}" alt=""><span class="ch-name">${e.name}</span>` +
      `<span class="ch-count">×${e.count}</span></div>`
    ).join('');
  };
  const openHistory  = () => { disarmReset(); buildHistory(); if (historyEl) historyEl.classList.add('is-open'); };
  const closeHistory = () => { if (historyEl) historyEl.classList.remove('is-open'); };
  if (countEl) countEl.addEventListener('click', openHistory);
  if (historyEl) {
    historyEl.addEventListener('click', (e) => { if (e.target === historyEl) closeHistory(); });
    const cbtn = historyEl.querySelector('.catch-history-close');
    if (cbtn) cbtn.addEventListener('click', closeHistory);
  }

  // 逃がす演出：釣った生き物たちが画面中央からわーっと四方八方へ逃げていく
  const releaseBurst = (items) => {
    if (!items || !items.length || prefersReduced) return;
    const layer = document.createElement('div');
    layer.className = 'release-burst';
    document.body.appendChild(layer);
    // 種類×匹数（各種最大3・合計最大30）に展開してシャッフル
    const pool = [];
    items.forEach(it => { const n = Math.min(it.count || 1, 3); for (let i = 0; i < n; i++) pool.push(it.img); });
    const MAX = 30;
    const list = (pool.length > MAX ? pool.sort(() => Math.random() - 0.5).slice(0, MAX) : pool);
    const vw = window.innerWidth, vh = window.innerHeight;
    const cx = vw / 2, cy = vh * 0.5;
    let remaining = list.length;
    list.forEach((img, i) => {
      const el = document.createElement('img');
      el.src = 'assets/img/' + img;
      el.className = 'release-fish';
      el.alt = '';
      layer.appendChild(el);
      const ang  = Math.random() * Math.PI * 2;
      const dist = Math.max(vw, vh) * (0.8 + Math.random() * 0.6);
      const size = 70 + Math.random() * 60;
      gsap.set(el, { width: size, height: size, x: cx - size / 2, y: cy - size / 2, scale: 0.2, opacity: 0, rotation: 0 });
      gsap.timeline({
        delay: i * 0.045,
        onComplete: () => { el.remove(); if (--remaining <= 0) layer.remove(); }
      })
        .to(el, { scale: 1, opacity: 1, duration: 0.22, ease: 'back.out(2)' })
        .to(el, {
          x: cx - size / 2 + Math.cos(ang) * dist,
          y: cy - size / 2 + Math.sin(ang) * dist,
          rotation: (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360),
          scale: 0.55, opacity: 0,
          duration: 0.9 + Math.random() * 0.5, ease: 'power2.in'
        }, '>-0.05');
    });
  };

  // 釣果を全部リセット（海に逃がす）。誤タップ防止に2段階タップ。
  const resetBtn = historyEl ? historyEl.querySelector('.catch-history-reset') : null;
  const RESET_LABEL = '🌊 ぜんぶ海に逃がす';
  let resetArmed = false, resetTimer = null;
  const disarmReset = () => {
    resetArmed = false;
    if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
    if (resetBtn) { resetBtn.textContent = RESET_LABEL; resetBtn.classList.remove('is-confirm'); }
  };
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!resetArmed) {
        // 1回目：確認状態にする
        resetArmed = true;
        resetBtn.textContent = 'もう一度タップで全部逃がす';
        resetBtn.classList.add('is-confirm');
        resetTimer = setTimeout(disarmReset, 3000);
        return;
      }
      // 2回目：確定 → 釣果を全消去
      // 消去する前に、逃がす生き物のリストを取っておく
      const released = CATCH_POOL
        .filter(it => catchHistory[it.img])
        .map(it => ({ img: it.img, count: catchHistory[it.img] }));
      catchHistory = {};
      saveHistory();
      catchCount = 0;
      if (countNumEl) countNumEl.textContent = '0';
      applyCaughtCreatures(); // 海に逃がす → 生き物がシーンに戻る
      disarmReset();
      buildHistory();
      closeHistory();          // パネルを閉じて画面全体で逃がす演出を見せる
      releaseBurst(released);  // わーっと四方八方へ逃げていく
    });
  }

  // ===== 釣り図鑑（全画面：釣れた／逃げられた）=====
  const dexEl      = document.querySelector('.catch-dex');
  const dexNoEl    = dexEl ? dexEl.querySelector('.catch-dex-no') : null;
  const dexRankEl  = dexEl ? dexEl.querySelector('.catch-dex-rank') : null;
  const dexImgEl   = dexEl ? dexEl.querySelector('.catch-dex-img') : null;
  const dexEmojiEl = dexEl ? dexEl.querySelector('.catch-dex-emoji') : null;
  const dexNameEl  = dexEl ? dexEl.querySelector('.catch-dex-name') : null;
  const dexSizeEl  = dexEl ? dexEl.querySelector('.catch-dex-size') : null;
  const dexDescEl  = dexEl ? dexEl.querySelector('.catch-dex-desc') : null;

  const fmtSize = (cm) => (cm >= 100 ? (Math.round(cm / 10) / 10) + 'm' : Math.round(cm) + 'cm');
  const dexNo = (item) => String(CATCH_POOL.indexOf(item) + 1).padStart(2, '0');

  const openDex = (item) => {
    if (!dexEl) return;
    dexEl.classList.remove('is-miss', '-ss', '-ur');
    if (dexNoEl)    dexNoEl.textContent = 'No.' + dexNo(item);
    if (dexRankEl)  { dexRankEl.textContent = item.rank; dexRankEl.style.background = RANKS[item.rank].color; }
    if (dexImgEl)   dexImgEl.src = 'assets/img/' + item.img;
    if (dexEmojiEl) dexEmojiEl.textContent = item.emoji || '';
    if (dexNameEl)  dexNameEl.textContent = item.name;
    if (dexSizeEl) {
      if (item.size) {
        const [a, b] = item.size;
        dexSizeEl.textContent = 'サイズ ' + fmtSize(a + Math.random() * (b - a));
        if (dexSizeEl.parentElement) dexSizeEl.parentElement.style.display = '';
      } else {
        // さやか等、サイズの無いキャラはサイズ欄を隠す
        dexSizeEl.textContent = '';
        if (dexSizeEl.parentElement) dexSizeEl.parentElement.style.display = 'none';
      }
    }
    if (dexDescEl)  dexDescEl.textContent = item.desc || '';
    if (item.rank === 'UR') dexEl.classList.add('-ur');
    else if (item.rank === 'SS') dexEl.classList.add('-ss');
    dexEl.classList.add('is-open');
  };
  const openMiss = (item) => {
    if (!dexEl) return;
    dexEl.classList.remove('-ss');
    dexEl.classList.add('is-miss');
    if (dexImgEl)   dexImgEl.src = 'assets/img/' + item.img;
    if (dexEmojiEl) dexEmojiEl.textContent = '💦';
    if (dexNameEl)  dexNameEl.textContent = '逃げられた…💦';
    if (dexDescEl)  dexDescEl.textContent = '「' + item.name + '」は逃げてしまった…\nまた挑戦してね！';
    dexEl.classList.add('is-open');
  };
  const closeDex = () => { if (dexEl) dexEl.classList.remove('is-open'); };
  if (dexEl) {
    dexEl.addEventListener('click', (e) => { if (e.target === dexEl) closeDex(); });
    const dbtn = dexEl.querySelector('.catch-dex-close');
    if (dbtn) dbtn.addEventListener('click', closeDex);
  }

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
    const rank = item.rank || 'C';
    if (bannerRank)  { bannerRank.textContent = rank; bannerRank.style.background = RANKS[rank].color; }
    if (bannerEmoji) bannerEmoji.textContent = item.emoji || '🎣';
    if (bannerName)  bannerName.textContent  = item.name + ' が釣れた！';
    bannerEl.classList.remove('is-hide', 'is-show', 'is-ss', 'is-s', 'is-miss');
    if (rank === 'SS') bannerEl.classList.add('is-ss');
    else if (rank === 'S') bannerEl.classList.add('is-s');
    void bannerEl.offsetWidth;
    bannerEl.classList.add('is-show');
  };
  // 逃げられた時のバナー
  const showMiss = (item) => {
    if (!bannerEl) return;
    if (bannerRank)  { bannerRank.textContent = item.rank; bannerRank.style.background = RANKS[item.rank].color; }
    if (bannerEmoji) bannerEmoji.textContent = '💨';
    if (bannerName)  bannerName.textContent  = item.name + ' に逃げられた…';
    bannerEl.classList.remove('is-hide', 'is-show', 'is-ss', 'is-s', 'is-miss');
    bannerEl.classList.add('is-miss');
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
        onComplete: () => { catchEl.classList.remove('is-on'); gsap.set(catchEl, { rotation: 0, x: 0, y: 0 }); }
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

  // 釣り上げ → 粘って → 釣れる or 逃げられる（100%ではない）
  const startCatch = () => {
    if (!castDone || isReeling || !canCatch || !catchEl) return;

    // いまのゾーンで釣れるものを抽選。すでに全部釣り尽くした／対象がなければ何も起きない
    const item = pickCatch(currentZone());
    if (!item) return;

    isReeling = true;
    trail.classList.remove('is-catchable');
    trail.classList.add('is-reeling');

    const success  = Math.random() < (CATCH_RATE[item.rank] != null ? CATCH_RATE[item.rank] : 0.9);
    const startTop = parseFloat(lure.style.top) || scrollLureTop;
    const topPos   = Math.max(64, window.innerHeight * 0.08);

    catchEl.src = 'assets/img/' + item.img;
    catchEl.classList.add('is-on');
    positionCatch(startTop);
    gsap.set(catchEl, { opacity: 0, scale: 0.4, rotation: 0, x: 0, y: 0 });
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

    const wobbleReps = prefersReduced ? 1 : 5; // ブルブル粘る回数

    const tl = gsap.timeline({ onComplete: endCatch });
    // 1) ヒット：クッと引き込まれる
    tl.to(state, { top: startTop + (prefersReduced ? 6 : 22), duration: 0.14, ease: 'power2.in', onUpdate: apply })
      // 2) 獲物がフッキング（出現）
      .to(catchEl, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' })
      // 3) ブルブル粘る（釣れるか逃げるか…の溜め）
      .to(catchEl, { rotation: 14, duration: 0.11, ease: 'sine.inOut', yoyo: true, repeat: wobbleReps, transformOrigin: '50% 0' })
      .to(lure,    { rotation: -7, duration: 0.11, ease: 'sine.inOut', yoyo: true, repeat: wobbleReps }, '<');

    if (success) {
      // 釣れた → わーっと巻き上げ → 図鑑を全画面表示
      tl.add(() => {
        bumpCount(item);
        if (!prefersReduced) {
          swingTween = gsap.to(catchEl, { rotation: 9, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 0' });
        }
      })
      .to(state, {
        top: topPos, duration: prefersReduced ? 0.5 : 0.8, ease: 'power2.inOut',
        onUpdate: () => { apply(); checkSurface(); }
      }, '>-0.02')
      .add(() => openDex(item))
      .to({}, { duration: 0.3 });
    } else {
      // 逃げられた → プイッと外れて消える → 全画面で「逃げられた」
      tl.to(catchEl, {
        x: (Math.random() < 0.5 ? -34 : 34), y: 30, opacity: 0, scale: 0.5, rotation: 35,
        duration: 0.45, ease: 'power2.in'
      })
      .add(() => openMiss(item))
      .to({}, { duration: 0.3 });
    }
  };

  safe('lure-click', () => { if (lure) lure.addEventListener('click', startCatch); });

  // ---- ルアー＋糸: scroll進捗で落ちていく ＋ 着水splashトリガー ----
  safe('lure-scroll', () => {
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
        // 最深位置：画面最下部まで落とすと釣果/タップボタンに被って押しにくいので
        // 下のボタン類より上で止まるよう余白を多めに取る
        const endY = vh - 240;
        const lureY = startY + (endY - startY) * eased;

        scrollLureTop = lureY;
        canCatch = (progress > 0.05) && (currentZone() !== null); // 釣りゾーン上にいる時だけ釣れる

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
  });

  // リサイズ時にも糸の描画を更新
  safe('resize-line', () => {
  window.addEventListener('resize', () => { if (castDone) updateVerticalLine(); });
  });

  // ---- Stage 0: 前奏文字 ----
  safe('stage0-prelude', () => {
  gsap.utils.toArray('.stage-text-prelude .lead').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: i * 0.25,
      scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' }
    });
  });
  });

  // splash は↑のonUpdateでルアー着水時に triggerSplash() を呼ぶ方式に統合

  // ---- Stage 1: 挨拶 ----
  safe('stage1-greeting', () => {
  gsap.timeline({
    scrollTrigger: { trigger: '.stage-text-surface', start: 'top 75%', toggleActions: 'play none none reverse' }
  })
    .to('.greeting', { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' })
    .to('.role',      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    .to('.info-line', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.18 }, '-=0.4');
  });

  // ---- Stage 2: 海中 ----
  safe('stage2-undersea', () => {
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
  });

  // ---- Stage 3: 深海 ----
  safe('stage3-deep', () => {
  gsap.utils.toArray('.deep-step').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: i * 0.18,
      scrollTrigger: { trigger: '.stage-deep', start: 'top 65%', toggleActions: 'play none none reverse' }
    });
  });
  });

  // ---- Stage 4: 宇宙 ----
  safe('stage4-space', () => {
  gsap.to('.space-lead', {
    opacity: 1, y: 0, duration: 1.0, ease: 'power3.out',
    scrollTrigger: { trigger: '.stage-space', start: 'top 55%', toggleActions: 'play none none reverse' }
  });
  });

  // ---- Stage 5: Voice ----
  safe('stage5-voice', () => {
  gsap.timeline({
    scrollTrigger: { trigger: '.stage-dawn', start: 'top 60%', toggleActions: 'play none none reverse' }
  })
    .to('.voice-row', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.25 });
  });

  // ---- Stage 6: 着水 ----
  safe('stage6-landing', () => {
  gsap.timeline({
    scrollTrigger: { trigger: '.stage-landing', start: 'top 70%', toggleActions: 'play none none reverse' }
  })
    .to('.landing-lead',     { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    .to('.landing-cta',      { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' }, '-=0.4')
    .to('.landing-cta-sub',  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
    .to('.contact-form',     { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.4');
  });

  // ---- お問い合わせフォーム送信 ----
  safe('contact-form', () => {
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

}

// DOM準備ができ次第、確実に初期化（スクリプトがDOMContentLoaded後に実行されても動くように）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', sayakaInit);
} else {
  sayakaInit();
}

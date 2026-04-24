const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");
const yearElement = document.getElementById("year");
const contactForm = document.getElementById("contactForm");
const themeToggle = document.getElementById("themeToggle");

const THEME_KEY = "portfolio-theme";

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function setThemeAttr(theme) {
  if (theme !== "light" && theme !== "dark") return;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    /* ignore */
  }
  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  }
}

if (themeToggle) {
  setThemeAttr(getTheme());
  themeToggle.addEventListener("click", () => {
    setThemeAttr(getTheme() === "light" ? "dark" : "light");
    themeToggle.classList.remove("theme-toggle--spin");
    void themeToggle.offsetWidth;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      themeToggle.classList.add("theme-toggle--spin");
      window.setTimeout(() => {
        themeToggle.classList.remove("theme-toggle--spin");
      }, 500);
    }
  });
} else if (!document.documentElement.getAttribute("data-theme")) {
  document.documentElement.setAttribute("data-theme", "dark");
}

if (menuToggle && navMenu) {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = navMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
  const siteHeader = document.querySelector(".site-header");
  document.addEventListener("click", (e) => {
    if (!navMenu.classList.contains("open")) return;
    const t = e.target;
    if (siteHeader && (siteHeader.contains(t) || t === siteHeader)) return;
    navMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
}

if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}

if (contactForm) {
  const params = new URLSearchParams(window.location.search);
  if (params.get("success") === "1") {
    const notice = document.getElementById("formSuccess");
    if (notice) notice.removeAttribute("hidden");
    contactForm.setAttribute("hidden", "");
  }
}

/** While the user is actively scrolling, skip parallax CSS updates (less main-thread work). */
let userIsScrolling = false;
let userScrollEndTimer = 0;
function onUserScrollForFx() {
  userIsScrolling = true;
  clearTimeout(userScrollEndTimer);
  userScrollEndTimer = window.setTimeout(() => {
    userIsScrolling = false;
  }, 130);
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealEls = document.querySelectorAll("main .card");
  if (revealEls.length > 0) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("reveal-in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    revealEls.forEach((el) => {
      el.classList.add("reveal-prep");
      io.observe(el);
    });
  }
}

function initBackgroundEffects() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  if (window.matchMedia("(max-width: 940px)").matches) {
    const canvasEl = document.getElementById("fxCanvas");
    if (canvasEl) canvasEl.style.display = "none";
    return;
  }
  const canvas = document.getElementById("fxCanvas");
  const backdrop = document.getElementById("fxBackdrop");
  if (!canvas || !backdrop) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let dpr = 1;
  /** @type {Array<{x:number;y:number;vx:number;vy:number}>} */
  let nodes = [];
  const linkDist = 150;
  const linkDist2 = linkDist * linkDist;
  let tmx = 0;
  let tmy = 0;
  let smx = 0;
  let smy = 0;
  let raf = 0;
  let lastParallaxKey = "";

  window.addEventListener("scroll", onUserScrollForFx, { passive: true });

  function setParallax() {
    if (userIsScrolling) return;
    const x = smx.toFixed(3);
    const y = smy.toFixed(3);
    const key = `${x},${y}`;
    if (key === lastParallaxKey) return;
    lastParallaxKey = key;
    backdrop.style.setProperty("--parallax-x", x);
    backdrop.style.setProperty("--parallax-y", y);
  }

  function onPointer(sx, sy) {
    tmx = (sx / window.innerWidth - 0.5) * 2;
    tmy = (sy / window.innerHeight - 0.5) * 2;
  }

  document.addEventListener(
    "mousemove",
    (e) => onPointer(e.clientX, e.clientY),
    { passive: true }
  );
  document.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (t) onPointer(t.clientX, t.clientY);
    },
    { passive: true }
  );

  function makeNodes() {
    const n = w < 720 ? 22 : w < 1200 ? 32 : 42;
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
    }));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeNodes();
  }

  function step() {
    smx += (tmx - smx) * 0.05;
    smy += (tmy - smy) * 0.05;
    setParallax();

    ctx.clearRect(0, 0, w, h);

    for (const p of nodes) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) {
        p.x = 0;
        p.vx *= -1;
      } else if (p.x > w) {
        p.x = w;
        p.vx *= -1;
      }
      if (p.y < 0) {
        p.y = 0;
        p.vy *= -1;
      } else if (p.y > h) {
        p.y = h;
        p.vy *= -1;
      }
    }

    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    const n = nodes.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < linkDist2) {
          const d = Math.sqrt(d2);
          const t = 1 - d / linkDist;
          const base = isLight ? 0.04 : 0.08;
          const span = isLight ? 0.12 : 0.1;
          const r0 = isLight ? 37 : 100;
          const g0 = isLight ? 99 : 170;
          const b0 = isLight ? 235 : 255;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${r0}, ${g0}, ${b0}, ${base + t * span})`;
          ctx.lineWidth = 0.45 + t * 0.4;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const p of nodes) {
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 2.2);
      if (isLight) {
        grd.addColorStop(0, "rgba(29, 78, 216, 0.45)");
        grd.addColorStop(0.5, "rgba(37, 99, 235, 0.18)");
      } else {
        grd.addColorStop(0, "rgba(200, 230, 255, 0.45)");
        grd.addColorStop(0.5, "rgba(100, 160, 255, 0.15)");
      }
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.fillStyle = grd;
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(step);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  raf = requestAnimationFrame(step);
  window.addEventListener(
    "beforeunload",
    () => {
      if (raf) cancelAnimationFrame(raf);
    },
    { once: true }
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBackgroundEffects);
} else {
  initBackgroundEffects();
}

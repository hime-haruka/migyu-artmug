// =====================
// CSV URLs
// =====================
const INTRO_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=0&single=true&output=csv";

const POINTS_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=1382001230&single=true&output=csv";

// =====================
// Small helpers (app-local)
// =====================
async function fetchCSV(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${res.statusText}`);
  return await res.text();
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nl2brHtml(plainText) {
  return escapeHtml(plainText).replace(/\n/g, "<br>");
}

/**
 * utils.js 의존성 체크 (원인 파악 쉽게)
 * - csvToObjects, toDirectDriveImage, toBool, toNum, sanitizeBasicHtml 가 있어야 함
 */
function assertUtils() {
  const required = ["csvToObjects", "toDirectDriveImage", "toBool", "toNum", "sanitizeBasicHtml"];
  const missing = required.filter((k) => typeof window[k] !== "function");
  if (missing.length) {
    throw new Error(
      `utils.js not roaded: ${missing.join(", ")}\n` +
        `please check`
    );
  }
}

// =====================
// Loaders
// =====================
async function loadIntro() {
  const text = await fetchCSV(INTRO_CSV);
  const rows = csvToObjects(text);
  const first = rows[0] ?? { image_url: "", quote: "", desc: "" };

  return {
    imageUrl: toDirectDriveImage(first.image_url),
    quote: first.quote ?? "",
    desc: first.desc ?? "",
  };
}

async function loadPoints() {
  const text = await fetchCSV(POINTS_CSV);
  const rows = csvToObjects(text);

  return rows
    .map((r) => ({
      order: toNum(r.order, 9999),
      title: r.title ?? "",
      desc: r.desc ?? "",
      active: toBool(r.active, true),
    }))
    .filter((p) => p.active && (p.title.trim() || p.desc.trim()))
    .sort((a, b) => a.order - b.order);
}

// =====================
// Render
// =====================
function renderIntroWithPoints(intro, points) {
  const root = document.getElementById("intro");
  if (!root) return;

  const items = points
    .map((p, idx) => {
      const panelId = `acc-panel-${idx}`;
      const num = idx + 1;
      const circled = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"][idx] ?? String(num);

      return `
        <div class="accItem">
          <button class="accBtn" type="button"
            aria-expanded="false"
            aria-controls="${panelId}">
            <span class="accHead">
              <span class="accPoint italiana">Point</span>
              <span class="accNo">${circled}</span>
              <span class="accTitle heiro">${escapeHtml(p.title)}</span>
            </span>
            <span class="accChevron" aria-hidden="true">
            <svg viewBox="0 0 16 16">
                <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
            </svg>
            </span>
          </button>

          <div class="accPanel" id="${panelId}" role="region" aria-hidden="true">
            <div class="accPanel__inner">
              <div class="accDesc paper">${nl2brHtml(p.desc)}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

    root.innerHTML = `
    <img class="heroDeco" src="./static/images/intro-top.png" alt="">
    <section class="hero">
        <div class="heroBg" style="background-image:url('${intro.imageUrl ? escapeHtml(intro.imageUrl) : ""}')"></div>
        <div class="heroFog"></div>
        <div class="heroQuote heiro">${escapeHtml(intro.quote)}</div>
    </section>

    <section class="about">
        <h2 class="aboutTitle italiana">About the Artist</h2>
        <div class="aboutRule" aria-hidden="true"></div>
        <div class="aboutBody paper">${sanitizeBasicHtml(intro.desc)}</div>
    </section>

    <section class="points">
        <div class="accordion" data-accordion>
        ${items}
        </div>
    </section>
    `;

  setupAccordion(root.querySelector("[data-accordion]"), { singleOpen: true });
}

// =====================
// Accordion
// =====================
function setupAccordion(container, { singleOpen = true } = {}) {
  if (!container) return;

  const buttons = Array.from(container.querySelectorAll(".accBtn"));

  function close(btn, panel) {
    btn.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");

    const inner = panel.firstElementChild;
    const start = inner.scrollHeight;

    panel.style.height = start + "px";
    panel.offsetHeight; // reflow
    panel.style.height = "0px";
    panel.dataset.open = "0";
  }

  function open(btn, panel) {
    btn.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");

    const inner = panel.firstElementChild;
    panel.style.height = "0px";
    panel.offsetHeight; // reflow
    const target = inner.scrollHeight;

    panel.style.height = target + "px";
    panel.dataset.open = "1";

    const onEnd = (e) => {
      if (e.propertyName !== "height") return;
      panel.removeEventListener("transitionend", onEnd);
      if (panel.dataset.open === "1") panel.style.height = "auto";
    };
    panel.addEventListener("transitionend", onEnd);
  }

  buttons.forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;

    // init
    panel.style.height = "0px";
    panel.dataset.open = "0";

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";

      if (singleOpen) {
        buttons.forEach((b) => {
          if (b === btn) return;
          const p = document.getElementById(b.getAttribute("aria-controls"));
          if (p && b.getAttribute("aria-expanded") === "true") close(b, p);
        });
      }

      if (isOpen) close(btn, panel);
      else open(btn, panel);
    });
  });

  window.addEventListener("resize", () => {
    buttons.forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;

      if (btn.getAttribute("aria-expanded") === "true") {
        const inner = panel.firstElementChild;
        panel.style.height = "auto";
        const target = inner.scrollHeight;
        panel.style.height = target + "px";
        panel.offsetHeight;
        panel.style.height = "auto";
      }
    });
  });
}

// =====================
// Boot
// =====================
(async function init() {
  try {
    assertUtils();
    const [intro, points] = await Promise.all([loadIntro(), loadPoints()]);
    renderIntroWithPoints(intro, points);
  } catch (err) {
    console.error(err);
  }
})();
// =====================
// CSV URLs
// =====================
const SECTION_IMAGE_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=676002089&single=true&output=csv";

const INTRO_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=0&single=true&output=csv";

const POINTS_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=1382001230&single=true&output=csv";

// =====================
// Small helpers
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

async function loadSectionImages() {
  const text = await fetchCSV(SECTION_IMAGE_CSV);
  const rows = csvToObjects(text);

  return rows.map(r => ({
    sectionId: r.section_id?.trim(),
    imageUrl: toDirectDriveImage(r.image_url ?? "")
  }));
}

// =====================
// Render
// =====================
function renderIntroWithPoints(intro, points, sectionImages) {
  const root = document.getElementById("intro");
  if (!root) return;

  const introImageRow = sectionImages.find(s => s.sectionId === "intro");
  const bgUrl = introImageRow?.imageUrl
    ? escapeHtml(introImageRow.imageUrl)
    : "";

  const items = points
    .map((p, idx) => {
      const circled = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"][idx] ?? String(idx + 1);
      return `
        <div class="pointItem">
          <div class="pointHead">
            <span class="pointLabel italiana">Point</span>
            <span class="pointNo">${circled}</span>
            <span class="pointTitle heiro">${escapeHtml(p.title)}</span>
          </div>
          <div class="pointDesc paper">${nl2brHtml(p.desc)}</div>
        </div>
      `;
    })
    .join("");

  root.innerHTML = `
    <div class="introBgWide" style="background-image:url('${bgUrl}')"></div>

    <div class="introTopDeco">
      <img src="./static/images/intro-top.png" alt="">
    </div>

    <section class="hero">
      <div class="heroBg" style="background-image:url('${bgUrl}')"></div>
      <div class="heroQuote heiro">${escapeHtml(intro.quote)}</div>
    </section>

    <section class="about">
      <h2 class="aboutTitle italiana">About the Artist</h2>
      <div class="aboutRule" aria-hidden="true"></div>
      <div class="aboutBody paper">${sanitizeBasicHtml(intro.desc)}</div>
    </section>

    <section class="points">
      <div class="pointsList">
        ${items}
      </div>
    </section>
  `;
}



// =====================
// CSV URL
// =====================
const NOTICE_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=1984969816&single=true&output=csv";

// =====================
// Loader
// =====================
async function loadNotice() {
  const text = await fetchCSV(NOTICE_CSV);
  const rows = csvToObjects(text);

  return rows
    .map((r) => ({
      order: toNum(r.order, 9999),
      desc: r.desc ?? "",
    }))
    .filter((n) => (n.desc || "").trim())
    .sort((a, b) => a.order - b.order);
}

// =====================
// Render
// =====================
function renderNotice(noticeRows, sectionImages) {
  const root = document.getElementById("notice");
  if (!root) return;

  const map = new Map(
    (Array.isArray(sectionImages) ? sectionImages : []).map((r) => [
      String(r.sectionId || "").trim(),
      toDirectDriveImage(r.imageUrl || ""),
    ])
  );

  const bgUrl = (map.get("notice") || map.get("intro") || "").trim();

  const itemsHtml = (Array.isArray(noticeRows) ? noticeRows : [])
    .map((n) => `<li class="noticeItem paper">${nl2brHtml(n.desc)}</li>`)
    .join("");

  root.innerHTML = `
    <div class="noticeBgWide" style="${bgUrl ? `background-image:url('${escapeHtml(bgUrl)}')` : ""}"></div>
    <div class="noticeBg" style="${bgUrl ? `background-image:url('${escapeHtml(bgUrl)}')` : ""}"></div>

    <div class="noticeInner">
      <h2 class="noticeTitle heiro">공지 사항</h2>
      <div class="noticeRule" aria-hidden="true"></div>

    <ul class="noticeList paper">
      ${itemsHtml}
    </ul>
    </div>
  `;
}



// =====================
// Boot
// =====================
(async function init() {
  try {
    assertUtils();

    const [intro, points, sectionImages, noticeRows] = await Promise.all([
      loadIntro(),
      loadPoints(),
      loadSectionImages(),
      loadNotice(),
    ]);


  renderIntroWithPoints(intro, points, sectionImages);
  renderNotice(noticeRows, sectionImages);
  renderChapters(sectionImages);
  
  } catch (err) {
    console.error(err);
  }
})();
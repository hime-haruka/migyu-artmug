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
// CSV URL
// =====================
const scope_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=2123006757&single=true&output=csv";

// =====================
// Loader
// =====================
async function loadscope() {
  const text = await fetchCSV(scope_CSV);
  const rows = csvToObjects(text);

  return rows
    .map(r => ({
      order: toNum(r.order, 9999),
      title: r.title ?? "",
      desc: r.desc ?? ""
    }))
    .filter(s => s.title.trim() || s.desc.trim())
    .sort((a, b) => a.order - b.order);
}

function renderscope(scopeRows, sectionImages) {
  const root = document.getElementById("scope");
  if (!root) return;

  const map = new Map(
    (Array.isArray(sectionImages) ? sectionImages : []).map((r) => [
      String(r.sectionId || "").trim(),
      toDirectDriveImage(r.imageUrl || "")
    ])
  );

  const bgUrl = (map.get("scope") || "").trim();

  const itemsHtml = scopeRows.map(row => `
    <div class="scopeItem">
      ${row.title ? `<div class="scopeLabel heiro">${escapeHtml(row.title)}</div>` : ""}
      <div class="scopeDesc paper">${sanitizeBasicHtml(row.desc)}</div>
    </div>
  `).join("");

  root.innerHTML = `
    <div class="scopeBgWide" style="${bgUrl ? `background-image:url('${escapeHtml(bgUrl)}')` : ""}"></div>
    <div class="scopeBg" style="${bgUrl ? `background-image:url('${escapeHtml(bgUrl)}')` : ""}"></div>

    <div class="scopeInner">
      <h2 class="scopeTitle heiro">작업 범위 및 사양</h2>
      <div class="scopeRule"></div>

      <div class="scopeList">
        ${itemsHtml}
      </div>
    </div>
  `;
}



// =====================
// CSV URL (PRICE)
// =====================
const PRICE_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=1338012782&single=true&output=csv";

// =====================
// Loader (PRICE)
// =====================
async function loadPrice() {
  const text = await fetchCSV(PRICE_CSV);
  const rows = csvToObjects(text);

  const cleaned = rows
    .map((r) => ({
      group: (r.group ?? "").trim(),
      small: (r.small ?? "").trim(),
      label: (r.label ?? "").trim(),
      desc: (r.desc ?? "").trim(),
      price: (r.price ?? "").trim(),
    }))
    .filter((r) => r.group || r.label || r.price || r.desc);

  const groupOrder = new Map();
  cleaned.forEach((r) => {
    if (!groupOrder.has(r.group)) groupOrder.set(r.group, groupOrder.size);
  });

  const groupsMap = new Map();
  for (const r of cleaned) {
    const key = r.group || "etc";
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        group: key,
        small: r.small,
        items: [],
        order: groupOrder.get(key) ?? 9999,
      });
    }
    const g = groupsMap.get(key);
    if (!g.small && r.small) g.small = r.small;
    g.items.push(r);
  }

  return Array.from(groupsMap.values()).sort((a, b) => a.order - b.order);
}

// =====================
// Render (PRICE)
// =====================
function renderPrice(priceGroups, sectionImages) {
  const root = document.getElementById("price");
  if (!root) return;

  const map = new Map(
    (Array.isArray(sectionImages) ? sectionImages : []).map((r) => [
      String(r.sectionId || "").trim(),
      toDirectDriveImage(r.imageUrl || ""),
    ])
  );

  const bgUrl = (map.get("price") || map.get("notice") || map.get("intro") || "").trim();

  const groupsHtml = (Array.isArray(priceGroups) ? priceGroups : [])
    .map((g) => {
      const itemsHtml = (Array.isArray(g.items) ? g.items : [])
        .map((it) => {
          const descHtml = it.desc ? `<span class="priceDesc paper">${sanitizeBasicHtml(it.desc)}</span>` : "";
          return `
            <li class="priceRow">
              <div class="priceLeft">
                <span class="priceBullet">·</span>
                <span class="priceLabel paper">${escapeHtml(it.label)}</span>
                ${descHtml}
              </div>
              <div class="priceRight paper">${escapeHtml(it.price)}</div>
            </li>
          `;
        })
        .join("");

      return `
        <section class="priceGroup">
          <div class="priceGroupHead">
            <div class="priceGroupEn italiana">${escapeHtml(g.group)}</div>
            ${g.small ? `<div class="priceGroupKo paper">${escapeHtml(g.small)}</div>` : ""}
          </div>
          <div class="priceGroupRule" aria-hidden="true"></div>
          <ul class="priceList">
            ${itemsHtml}
          </ul>
        </section>
      `;
    })
    .join("");

  root.innerHTML = `
    <div class="priceBgTex" style="${bgUrl ? `background-image:url('${escapeHtml(bgUrl)}')` : ""}"></div>

    <div class="priceInner">
      <h2 class="priceTitle heiro">가격표</h2>
      <div class="priceRule" aria-hidden="true"></div>

      <div class="priceGroups">
        ${groupsHtml}
      </div>
    </div>
  `;
}



// =====================
// CSV URL (PROCESS)
// =====================
const PROCESS_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=495957801&single=true&output=csv";

// =====================
// Loader (PROCESS)
// =====================
async function loadProcess() {
  const text = await fetchCSV(PROCESS_CSV);
  const rows = csvToObjects(text);

  const cleaned = rows
    .map((r) => ({
      type: (r.type ?? "").trim(),
      order: toNum(r.order, 9999),
      title: (r.title ?? "").trim(),
      subtitle: (r.subtitle ?? "").trim(),
      description: (r.description ?? "").trim(),
    }))
    .filter((r) => r.type);

  const byType = new Map();
  for (const r of cleaned) {
    if (!byType.has(r.type)) byType.set(r.type, []);
    byType.get(r.type).push(r);
  }

  for (const [k, arr] of byType) {
    arr.sort((a, b) => a.order - b.order);
    byType.set(k, arr);
  }

  return {
    steps: byType.get("작업 진행 순서") ?? [],
    duration: byType.get("작업 기간 안내") ?? [],
    confirm: byType.get("컨펌 안내") ?? [],
  };
}

// =====================
// Render (PROCESS)
// =====================
function renderProcess(processData, sectionImages) {
  const root = document.getElementById("process");
  if (!root) return;

  const map = new Map(
    (Array.isArray(sectionImages) ? sectionImages : []).map((r) => [
      String(r.sectionId || "").trim(),
      toDirectDriveImage(r.imageUrl || ""),
    ])
  );

  const bgUrl = (map.get("process") || map.get("intro") || "").trim();

  const stepsHtml = (processData.steps ?? [])
    .map((s) => {
      const num = toNum(s.order, 0);
      const sub = s.subtitle
      ? `<div class="procStepSub paper">: ${escapeHtml(s.subtitle)}</div>`
      : "";

    const small = s.description
      ? `<div class="procStepSmall paper">${sanitizeBasicHtml(s.description)}</div>`
      : "";
      return `
        <li class="procStep">
          <div class="procStepRail" aria-hidden="true">
            <span class="procDot ${num === 3 ? 'isFix' : ''}"><span class="procDotIcon"></span></span>
          </div>

          <div class="procStepNo italiana">Step ${escapeHtml(num)}.</div>

          <div class="procStepBody">
            <div class="procStepTitle heiro">${escapeHtml(s.title)}</div>
            ${sub}
            ${small}
          </div>
        </li>
      `;
    })
    .join("");

    function renderNoteItem(r) {
      const main = (r.subtitle || r.title || r.description || "").trim();
      const small = (r.description && (r.subtitle || r.title)) ? r.description.trim() : "";

      if (!main && !small) return "";

      if (!small) {
        return `<li class="procNoteItem paper">${sanitizeBasicHtml(main)}</li>`;
      }

      return `
        <li class="procNoteItem paper">
          <span class="procNoteMain">${sanitizeBasicHtml(main)}</span>
          <span class="procNoteSmall">${sanitizeBasicHtml(small)}</span>
        </li>
      `;
    }

    const durationHtml = (processData.duration ?? [])
      .map(renderNoteItem)
      .join("");

    const confirmHtml = (processData.confirm ?? [])
      .map(renderNoteItem)
      .join("");

  root.innerHTML = `
    <div class="processBgWide" style="${bgUrl ? `background-image:url('${escapeHtml(bgUrl)}')` : ""}"></div>

    <section class="processHero">
      <div class="processHeroBg" style="${bgUrl ? `background-image:url('${escapeHtml(bgUrl)}')` : ""}"></div>
      <div class="processHeroFog" aria-hidden="true"></div>
    </section>

    <div class="processInner">
      <h2 class="processTitle heiro">진행 프로세스</h2>
      <div class="processHint paper">※ 본 작업은 단계별 승인 방식으로 진행되며, 각 단계가 확정된 후 다음 공정으로 넘어갑니다.</div>
      <div class="processRule" aria-hidden="true"></div>

      <div class="processBadge heiro">작업 진행 순서</div>

      <ol class="procSteps">
        ${stepsHtml}
      </ol>

      <div class="processBadge heiro">작업 기간 안내</div>
      <ul class="procNotes">
        ${durationHtml}
      </ul>

      <div class="processBadge heiro">컨펌 안내</div>
      <ul class="procNotes">
        ${confirmHtml}
      </ul>
    </div>
  `;
}




// =====================
// Process CSV URLs
// =====================
const PROCESS_FORM_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=1183730687&single=true&output=csv";

const PROCESS_STEPS_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=676862727&single=true&output=csv";

// =====================
// Loaders
// =====================
async function loadProcessForm() {
  const text = await fetchCSV(PROCESS_FORM_CSV);
  const rows = csvToObjects(text);

  return rows
    .map((r) => ({
      order: toNum(r.order, 9999),
      title: (r.title ?? "").trim(),
      description: (r.description ?? "").trim(),
    }))
    .filter((x) => x.title || x.description)
    .sort((a, b) => a.order - b.order);
}

async function loadProcessSteps() {
  const text = await fetchCSV(PROCESS_STEPS_CSV);
  const rows = csvToObjects(text);

  const parsed = rows
    .map((r) => ({
      order: toNum(r.order, 9999),
      depth: toNum(r.depth, 1),
      parentOrder: toNum(r.parent_order, 0),
      title: (r.title ?? "").trim(),
      description: (r.description ?? "").trim(),
    }))
    .filter((x) => x.title || x.description);

  const steps = parsed
    .filter((x) => x.depth === 1)
    .sort((a, b) => a.order - b.order);

  const childrenByParent = new Map();
  parsed
    .filter((x) => x.depth === 2 && x.parentOrder)
    .sort((a, b) => a.order - b.order)
    .forEach((c) => {
      if (!childrenByParent.has(c.parentOrder)) childrenByParent.set(c.parentOrder, []);
      childrenByParent.get(c.parentOrder).push(c);
    });

  return { steps, childrenByParent };
}

// =====================
// Render
// =====================
function renderProcess(processFormRows, processStepsData, sectionImages) {
  const root = document.getElementById("process");
  if (!root) return;

  const map = new Map(
    (Array.isArray(sectionImages) ? sectionImages : []).map((r) => [
      String(r.sectionId || "").trim(),
      toDirectDriveImage(r.imageUrl || ""),
    ])
  );

  // process 전용 이미지가 없으면 price/intro 등으로 폴백
  const bgUrl = (map.get("process") || map.get("price") || map.get("intro") || "").trim();

  const formItemsHtml = (Array.isArray(processFormRows) ? processFormRows : [])
    .map((r) => {
      const title = escapeHtml(r.title);
      const desc = r.description ? `<span class="procHint paper">${escapeHtml(r.description)}</span>` : "";
      return `<li class="procFormItem"><span class="procDot">·</span><span class="procFormText"><strong>${title}</strong>${desc}</span></li>`;
    })
    .join("");

  const steps = processStepsData?.steps ?? [];
  const childrenByParent = processStepsData?.childrenByParent ?? new Map();

  const stepRowsHtml = steps
    .map((s) => {
      const stepNo = escapeHtml(String(s.order));
      const title = escapeHtml(s.title);
      const desc = s.description ? `<div class="procStepDesc paper">${sanitizeBasicHtml(s.description)}</div>` : "";

      const children = childrenByParent.get(s.order) || [];
      const childBox =
        children.length
          ? `
            <div class="procSubBox paper">
              ${children
                .map((c) => {
                  const ct = escapeHtml(c.title);
                  const cd = c.description ? sanitizeBasicHtml(c.description) : "";
                  return `
                    <div class="procSubRow">
                      <div class="procSubTitle heiro">${ct}</div>
                      <div class="procSubDesc paper">${cd}</div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          `
          : "";

      return `
        <div class="procTLRow">
          <div class="procRail">
            <div class="procMark ${s.order === 3 ? "isEnd" : ""}"></div>
          </div>

          <div class="procStep">
            <div class="procStepHead">
              <div class="procStepNo italiana">Step ${stepNo}.</div>
              <div class="procStepTitle heiro">${title}</div>
            </div>
            ${desc}
            ${childBox}
          </div>
        </div>
      `;
    })
    .join("");

  root.innerHTML = `
    <div class="procBgTex" style="${bgUrl ? `background-image:url('${escapeHtml(bgUrl)}')` : ""}"></div>

    <div class="procInner">
      <h2 class="procTitle heiro">신청 방법</h2>

      <p class="procLead paper">
        ※ 전문적인 상담과 정확한 조형 설계를 위해 아래 양식을 상세히 작성해 주시기 바랍니다.<br>
        레퍼런스 이미지나 설정 자료가 있다면 함께 첨부해 주시는 것이 좋습니다.
      </p>

      <div class="procRule" aria-hidden="true"></div>

      <div class="procBadge heiro">신청 양식</div>
      <ul class="procFormList">
        ${formItemsHtml}
      </ul>

      <div class="procBadge heiro">단계별 안내</div>

      <div class="procTimeline">
        ${stepRowsHtml}
      </div>
    </div>
  `;
}


// =====================
// Form CSV URLs
// =====================
const FORM_LIST_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=1183730687&single=true&output=csv";

const FORM_STEPS_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=676862727&single=true&output=csv";

// =====================
// Loaders
// =====================
async function loadFormList() {
  const text = await fetchCSV(FORM_LIST_CSV);
  const rows = csvToObjects(text);

  return rows
    .map((r) => ({
      order: toNum(r.order, 9999),
      title: (r.title ?? "").trim(),
      description: (r.description ?? "").trim(),
    }))
    .filter((x) => x.title || x.description)
    .sort((a, b) => a.order - b.order);
}

async function loadFormSteps() {
  const text = await fetchCSV(FORM_STEPS_CSV);
  const rows = csvToObjects(text);

  const parsed = rows
    .map((r) => ({
      order: toNum(r.order, 9999),
      depth: toNum(r.depth, 1),
      parentOrder: toNum(r.parent_order, 0),
      title: (r.title ?? "").trim(),
      description: (r.description ?? "").trim(),
    }))
    .filter((x) => x.title || x.description);

  const steps = parsed
    .filter((x) => x.depth === 1)
    .sort((a, b) => a.order - b.order);

  const childrenByParent = new Map();
  parsed
    .filter((x) => x.depth === 2 && x.parentOrder)
    .sort((a, b) => a.order - b.order)
    .forEach((c) => {
      if (!childrenByParent.has(c.parentOrder)) childrenByParent.set(c.parentOrder, []);
      childrenByParent.get(c.parentOrder).push(c);
    });

  return { steps, childrenByParent };
}

// =====================
// Render
// =====================
function renderForm(formListRows, formStepsData, sectionImages) {
  const root = document.getElementById("form");
  if (!root) return;

  const map = new Map(
    (Array.isArray(sectionImages) ? sectionImages : []).map((r) => [
      String(r.sectionId || "").trim(),
      toDirectDriveImage(r.imageUrl || ""),
    ])
  );

  // form 전용 배경을 최우선으로 사용 (없으면 기존 섹션들로 폴백)
  const bgUrl = (map.get("form") || map.get("price") || map.get("intro") || "").trim();

  const listHtml = (Array.isArray(formListRows) ? formListRows : [])
    .map((r) => {
      const title = escapeHtml(r.title);
      const desc = r.description
        ? `<span class="formHint paper">${escapeHtml(r.description)}</span>`
        : "";
      return `<li class="formItem"><span class="formDot">·</span><span class="formText"><strong>${title}</strong>${desc}</span></li>`;
    })
    .join("");

  const steps = formStepsData?.steps ?? [];
  const childrenByParent = formStepsData?.childrenByParent ?? new Map();

  const stepsHtml = steps
    .map((s) => {
      const stepNo = escapeHtml(String(s.order));
      const title = escapeHtml(s.title);
      const desc = s.description ? `<div class="formStepDesc paper">${sanitizeBasicHtml(s.description)}</div>` : "";

      const children = childrenByParent.get(s.order) || [];
      const childBox =
        children.length
          ? `
            <div class="formSubBox paper">
              ${children
                .map((c) => {
                  const ct = escapeHtml(c.title);
                  const cd = c.description ? sanitizeBasicHtml(c.description) : "";
                  return `
                    <div class="formSubRow">
                      <div class="formSubTitle heiro">${ct}</div>
                      <div class="formSubDesc paper">${cd}</div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          `
          : "";

      return `
        <div class="formTLRow">
          <div class="formRail">
            <div class="formMark"></div>
          </div>

          <div class="formStep">
            <div class="formStepHead">
              <div class="formStepNo italiana">Step ${stepNo}.</div>
              <div class="formStepTitle heiro">${title}</div>
            </div>
            ${desc}
            ${childBox}
          </div>
        </div>
      `;
    })
    .join("");

  root.innerHTML = `
    <div class="formBgTex" style="${bgUrl ? `background-image:url('${escapeHtml(bgUrl)}')` : ""}"></div>

    <div class="formInner">
      <h2 class="formTitle heiro">신청 방법</h2>

      <p class="formLead paper">
        ※ 전문적인 상담과 정확한 조형 설계를 위해 아래 양식을 상세히 작성해 주시기 바랍니다.<br>
        레퍼런스 이미지나 설정 자료가 있다면 함께 첨부해 주시는 것이 좋습니다.
      </p>

      <div class="formRule" aria-hidden="true"></div>

      <div class="formBadge heiro">신청 양식</div>
      <ul class="formList">
        ${listHtml}
      </ul>

      <div class="formBadge heiro">단계별 안내</div>

      <div class="formTimeline">
        ${stepsHtml}
      </div>
    </div>
  `;
}



const PORTFOLIO_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFz4EomXDXyyN5SfiL56DmZMgrdcobq_f0YbgJfW8XenuK_ehyMr4xTUQRQaeluY-9vUb_O4rZISt5/pub?gid=1384952795&single=true&output=csv";

async function loadPortfolio() {
  const text = await fetchCSV(PORTFOLIO_CSV);
  const rows = csvToObjects(text);

  return rows
    .map((r) => ({
      groupOrder: toNum(r.group_order, 9999),
      group: (r.group ?? "").trim(),
      order: toNum(r.order, 9999),
      imageUrl: toDirectDriveImage(r.image_url ?? ""),
    }))
    .filter((x) => x.group && x.imageUrl)
    .sort((a, b) => a.groupOrder - b.groupOrder || a.order - b.order);
}

// ===== Portfolio Modal (body attach) =====
function ensurePortfolioModal() {
  let modal = document.getElementById("pfModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "pfModal";
  modal.id = "pfModal";
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <button class="pfModalBg" type="button" data-close="1" aria-label="close"></button>
    <figure class="pfModalBox">
      <button class="pfModalClose" type="button" data-close="1" aria-label="close">×</button>
      <img class="pfModalImg" alt="">
    </figure>
  `;

  document.body.appendChild(modal);
  return modal;
}

function openPortfolioModal(src, alt) {
  const modal = ensurePortfolioModal();
  const img = modal.querySelector(".pfModalImg");

  img.setAttribute("src", src);
  img.setAttribute("alt", alt || "");

  modal.classList.add("on");
  modal.setAttribute("aria-hidden", "false");

  document.documentElement.classList.add("isModalOpen");
}

function closePortfolioModal() {
  const modal = document.getElementById("pfModal");
  if (!modal) return;

  const img = modal.querySelector(".pfModalImg");
  modal.classList.remove("on");
  modal.setAttribute("aria-hidden", "true");
  img.removeAttribute("src");

  document.documentElement.classList.remove("isModalOpen");
}

function bindPortfolioModalEventsOnce() {
  if (window.__pfModalBound) return;
  window.__pfModalBound = true;

  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest(".pfBtn");
    if (openBtn) {
      const src = openBtn.getAttribute("data-full");
      if (!src) return;

      const img = openBtn.querySelector("img");
      openPortfolioModal(src, img ? img.alt : "");
      return;
    }

    if (e.target.closest("#pfModal [data-close]")) {
      closePortfolioModal();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePortfolioModal();
  });
}

// ===== Render =====
function renderPortfolio(rows, sectionImages) {
  const root = document.getElementById("portfolio");
  if (!root) return;

  bindPortfolioModalEventsOnce();

  const map = new Map(
    (Array.isArray(sectionImages) ? sectionImages : []).map((r) => [
      String(r.sectionId || "").trim(),
      toDirectDriveImage(r.imageUrl || ""),
    ])
  );

  const bgUrl = (map.get("portfolio") || map.get("intro") || "").trim();

  const groups = new Map();
  for (const r of Array.isArray(rows) ? rows : []) {
    const key = `${r.groupOrder}__${r.group}`;
    if (!groups.has(key)) groups.set(key, { groupOrder: r.groupOrder, group: r.group, items: [] });
    groups.get(key).items.push(r);
  }
  const groupList = [...groups.values()].sort((a, b) => a.groupOrder - b.groupOrder);

  const navHtml = groupList
    .map((g, idx) => {
      const id = `pf-${idx + 1}`;
      return `<a class="pfNavBtn heiro" href="#${id}">${escapeHtml(g.group)}</a>`;
    })
    .join("");

  const bodyHtml = groupList
    .map((g, idx) => {
      const id = `pf-${idx + 1}`;
      const items = g.items
        .map((it) => {
          const full = escapeHtml(it.imageUrl);
          const alt = escapeHtml(`${g.group} ${it.order}`);
          return `
            <figure class="pfCard">
              <button class="pfBtn" type="button" data-full="${full}" aria-label="${alt}">
                <img class="pfImg" src="${full}" alt="${alt}" loading="lazy" decoding="async">
              </button>
            </figure>
          `;
        })
        .join("");

      return `
        <section class="pfGroup" id="${id}">
          <div class="pfGroupHead">
            <h3 class="pfGroupTitle heiro">${escapeHtml(g.group)}</h3>
            <div class="pfGroupRule" aria-hidden="true"></div>
          </div>
          <div class="pfMasonry">
            ${items}
          </div>
        </section>
      `;
    })
    .join("");

  root.innerHTML = `
    <div class="pfBgWide" style="${bgUrl ? `background-image:url('${escapeHtml(bgUrl)}')` : ""}"></div>
    <div class="pfBg" style="${bgUrl ? `background-image:url('${escapeHtml(bgUrl)}')` : ""}"></div>

    <div class="pfInner">
      <div class="pfHead">
        <h2 class="pfTitle heiro">Portfolio</h2>
        <div class="pfRule" aria-hidden="true"></div>
        <nav class="pfNav">${navHtml}</nav>
      </div>

      <div class="pfBody">
        ${bodyHtml}
      </div>
    </div>
  `;
}

function smoothScrollToTarget(target) {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    target.scrollIntoView({ block: "start" });
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function enableSmoothAnchors() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    const id = href.slice(1);
    const el = document.getElementById(id);
    if (!el) return;

    e.preventDefault();
    smoothScrollToTarget(el);

    history.pushState(null, "", href);
  });
}

// =====================
// Boot
// =====================
(async function init() {
  try {
    assertUtils();

  const [intro, points, sectionImages, noticeRows, scopeRows, priceGroups, processData, formListRows, formStepsData, portfolioRows] = await Promise.all([
    loadIntro(),
    loadPoints(),
    loadSectionImages(),
    loadNotice(),
    loadscope(),
    loadPrice(),
    loadProcess(),
    loadFormList(),
    loadFormSteps(),
    loadPortfolio(),
  ]);

  renderIntroWithPoints(intro, points, sectionImages);
  renderNotice(noticeRows, sectionImages);
  renderscope(scopeRows, sectionImages);
  renderPrice(priceGroups, sectionImages);
  renderProcess(processData, sectionImages);
  renderForm(formListRows, formStepsData, sectionImages);
  renderPortfolio(portfolioRows, sectionImages);

  renderChapters(sectionImages);

  enableSmoothAnchors();
  
  } catch (err) {
    console.error(err);
  }
})();

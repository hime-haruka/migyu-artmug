const CHAPTER_CONFIG = [
  { id: "notice", label: "01", title: "Notice", span: 5 },
  { id: "scope", label: "02", title: "Scope", span: 3 },
  { id: "price", label: "03", title: "Price", span: 4 },

  { id: "process", label: "04", title: "Process", span: 4 },
  { id: "form", label: "05", title: "Form", span: 3 },
  { id: "portfolio", label: "06", title: "Portfolio", span: 5 },

  { id: "collab", label: "07", title: "Collab", span: 4 },
  { id: "copyright", label: "08", title: "Copyright", span: 5 },
  { id: "guide", label: "09", title: "Guide", span: 3 },
];

function setCssVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function measureItems(container) {
  const items = Array.from(container.querySelectorAll(".tocItem"));
  const map = new Map();
  for (const el of items) map.set(el, el.getBoundingClientRect());
  return map;
}

function playFLIP(container, firstRects, duration = 520) {
  const items = Array.from(container.querySelectorAll(".tocItem"));
  const lastRects = new Map();
  for (const el of items) lastRects.set(el, el.getBoundingClientRect());

  for (const el of items) {
    const first = firstRects.get(el);
    const last = lastRects.get(el);
    if (!first || !last) continue;

    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const sx = first.width / (last.width || 1);
    const sy = first.height / (last.height || 1);

    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) continue;

    el.animate(
      [
        { transformOrigin: "top left", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transformOrigin: "top left", transform: "translate(0px, 0px) scale(1, 1)" },
      ],
      { duration, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  }
}

function setPanelHeight(panel, open) {
  const inner = panel.firstElementChild;
  if (!inner) return;

  panel.style.transition = "none";
  if (open) {
    panel.style.height = "0px";
  } else {
    const h = panel.getBoundingClientRect().height;
    panel.style.height = `${h}px`;
  }
  panel.offsetHeight;
  panel.style.transition = "";

  if (open) {
    const target = inner.scrollHeight;
    panel.style.height = `${target}px`;

    const onEnd = (e) => {
      if (e.target !== panel || e.propertyName !== "height") return;
      panel.style.height = "auto";
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);
  } else {
    requestAnimationFrame(() => {
      panel.style.height = "0px";
    });
  }
}

function extractSectionToPanel(sectionId, panelBody) {
  const src = document.getElementById(sectionId);
  if (!src) {
    panelBody.innerHTML = "";
    return;
  }

  panelBody.innerHTML = "";
  panelBody.appendChild(src);

  src.hidden = false;
}

function applyItemTextures(toc, sectionImages) {
  const rows = Array.isArray(sectionImages) ? sectionImages : [];
  const map = new Map(
    rows.map(r => [
      String(r.sectionId || "").trim(),
      toDirectDriveImage(r.imageUrl || "")
    ])
  );

  const fallback = (map.get("intro") || "").trim();

  const items = toc.querySelectorAll(".tocItem[data-id]");
  for (const item of items) {
    const id = item.getAttribute("data-id");
    const url = ((map.get(id) || "").trim() || fallback);
    if (url) item.style.setProperty("--itemTexture", `url("${url}")`);
  }
}

function renderChapters(sectionImages) {
  const toc = document.getElementById("magToc");
  if (!toc) return;

  const itemsHtml = CHAPTER_CONFIG.map((c, idx) => {
    const panelId = `chapter-panel-${c.id}`;
    const btnId = `chapter-btn-${c.id}`;
    return `
      <div class="tocItem" data-id="${escapeHtml(c.id)}" style="--span:${Number(c.span) || 4}">
        <button
          class="tocBtn"
          type="button"
          id="${btnId}"
          aria-expanded="false"
          aria-controls="${panelId}"
        >
          <div class="tocMeta">
            <span class="tocLabel italiana">section</span>
            <span class="tocNo">${escapeHtml(c.label || String(idx + 1).padStart(2, "0"))}</span>
          </div>
          <div class="tocTitle heiro">${escapeHtml(c.title || c.id)}</div>
        </button>

        <div class="tocPanel" id="${panelId}" role="region" aria-labelledby="${btnId}">
          <div class="panelInner">
            <div class="panelBody paper" data-body="${escapeHtml(c.id)}"></div>
          </div>
        </div>
      </div>
    `;
  }).join("");


  toc.innerHTML = itemsHtml;
  applyItemTextures(toc, sectionImages);

  for (const c of CHAPTER_CONFIG) {
    const body = toc.querySelector(`.panelBody[data-body="${CSS.escape(c.id)}"]`);
    if (body) extractSectionToPanel(c.id, body);
  }

  const reduce = prefersReducedMotion();

  toc.addEventListener("click", (e) => {
    const btn = e.target.closest(".tocBtn");
    if (!btn) return;

    const item = btn.closest(".tocItem");
    if (!item) return;

    const panel = item.querySelector(".tocPanel");
    if (!panel) return;

    const isOpen = item.classList.contains("is-open");
    const willOpen = !isOpen;

    const first = reduce ? null : measureItems(toc);

    item.classList.toggle("is-open", willOpen);
    btn.setAttribute("aria-expanded", willOpen ? "true" : "false");

    if (reduce) {
      panel.style.height = willOpen ? "auto" : "0px";
      return;
    }

    setPanelHeight(panel, willOpen);

    requestAnimationFrame(() => {
      playFLIP(toc, first, 520);
    });
  });

  toc.addEventListener("keydown", (e) => {
    const btn = e.target.closest(".tocBtn");
    if (!btn) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    btn.click();
  });
}
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (ch === "\r") {
        // ignore
      } else {
        cell += ch;
      }
    }
  }
  row.push(cell);
  rows.push(row);

  while (rows.length && rows[rows.length - 1].every(v => (v ?? "").trim() === "")) {
    rows.pop();
  }
  return rows;
}

function csvToObjects(csvText) {
  const rows = parseCSV(csvText);
  if (!rows.length) return [];

  const header = rows[0].map(h => (h ?? "").trim());
  const out = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const obj = {};
    header.forEach((key, idx) => {
      obj[key] = (row[idx] ?? "").trim();
    });
    if (Object.values(obj).every(v => v === "")) continue;
    out.push(obj);
  }
  return out;
}


// url 변환
function toDirectDriveImage(url) {
  if (!url) return "";

  const u = String(url).trim();

  if (/^https:\/\/lh3\.googleusercontent\.com\/d\/[a-zA-Z0-9_-]+/.test(u)) return u;

  const m1 = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return `https://lh3.googleusercontent.com/d/${m1[1]}`;

  try {
    const parsed = new URL(u);
    if (parsed.hostname.includes("drive.google.com")) {
      const id = parsed.searchParams.get("id");
      if (id) return `https://lh3.googleusercontent.com/d/${id}`;
    }
  } catch (_) {}

  return u;
}

function toBool(v, fallback = false) {
  if (v == null) return fallback;
  const s = String(v).trim().toLowerCase();
  if (["true", "1", "y", "yes", "t"].includes(s)) return true;
  if (["false", "0", "n", "no", "f"].includes(s)) return false;
  return fallback;
}

function toNum(v, fallback = 0) {
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : fallback;
}

function nl2br(str) {
  return String(str ?? "").replace(/\n/g, "<br>");
}

function sanitizeBasicHtml(input) {
  const allowed = new Set(["STRONG", "B", "EM", "I", "BR"]);

  const tpl = document.createElement("template");
  tpl.innerHTML = String(input ?? "");

  const walk = (node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowed.has(child.tagName)) {
          const frag = document.createDocumentFragment();
          while (child.firstChild) frag.appendChild(child.firstChild);
          child.replaceWith(frag);
          continue;
        }

        for (const attr of Array.from(child.attributes)) child.removeAttribute(attr);

        walk(child);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
      } else if (child.nodeType === Node.TEXT_NODE) {
      } else {
        child.remove();
      }
    }
  };

  walk(tpl.content);
  const html = tpl.innerHTML
    .replace(/\r\n/g, "\n")
    .replace(/\n\n+/g, "<br><br>")
    .replace(/\n/g, "<br>");

  return html;
}
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\*[^*\s][^*\n]*\*)|(_[^_\s][^_\n]*_)|(\[[^\]\n]+\]\([^)\s]+\))/g;

function inline(text: string, into: HTMLElement): void {
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) into.appendChild(document.createTextNode(text.slice(last, at)));
    const t = m[0];
    let node: HTMLElement;
    if (m[1]) { node = document.createElement('code'); node.textContent = t.slice(1, -1); }
    else if (m[2] || m[3]) { node = document.createElement('strong'); inline(t.slice(2, -2), node); }
    else if (m[4] || m[5]) { node = document.createElement('em'); inline(t.slice(1, -1), node); }
    else {
      const parts = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t);
      node = document.createElement('span');
      node.className = 'fs-md-link';
      node.textContent = parts?.[1] ?? t;
      node.title = parts?.[2] ?? '';
      node.dataset.href = parts?.[2] ?? '';
    }
    into.appendChild(node);
    last = at + t.length;
  }
  if (last < text.length) into.appendChild(document.createTextNode(text.slice(last)));
}

const LIST = /^\s*(?:[-*+]|\d+[.)])\s+/;
const ORDERED = /^\s*\d+[.)]\s+/;
const ROW = /^\s*\|.*\|\s*$/;
const RULE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

function cells(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
}

export function splitFrontMatter(text: string): { meta: [string, string][]; body: string } {
  const lines = text.replace(/\r/g, '').split('\n');
  if (lines[0]?.trim() !== '---') return { meta: [], body: text };
  const end = lines.indexOf('---', 1);
  const close = end > 0 ? end : lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (close < 0) return { meta: [], body: text };
  const meta: [string, string][] = [];
  for (const line of lines.slice(1, close)) {
    const m = /^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (m) meta.push([m[1], m[2].replace(/^["']|["']$/g, '')]);
    else if (meta.length && line.trim()) meta[meta.length - 1][1] = `${meta[meta.length - 1][1]} ${line.trim()}`.trim();
  }
  return { meta: meta.map(([k, v]) => [k, /^[>|][-+]?$/.test(v) ? '' : v.replace(/^[>|][-+]?\s+/, '')]), body: lines.slice(close + 1).join('\n') };
}

export function renderMarkdown(text: string): HTMLElement[] {
  const out: HTMLElement[] = [];
  const lines = text.replace(/\r/g, '').split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }
    if (/^\s*```/.test(line)) {
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) { body.push(lines[i]); i += 1; }
      i += 1;
      code.textContent = body.join('\n');
      pre.appendChild(code);
      out.push(pre);
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const node = document.createElement('div');
      node.className = `fs-md-h fs-md-h${Math.min(3, h[1].length)}`;
      inline(h[2], node);
      out.push(node);
      i += 1;
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { out.push(document.createElement('hr')); i += 1; continue; }
    if (/^\s*>\s?/.test(line)) {
      const quote = document.createElement('blockquote');
      const body: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { body.push(lines[i].replace(/^\s*>\s?/, '')); i += 1; }
      quote.append(...renderMarkdown(body.join('\n')));
      out.push(quote);
      continue;
    }
    if (LIST.test(line)) {
      const list = document.createElement(ORDERED.test(line) ? 'ol' : 'ul');
      while (i < lines.length && (LIST.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && list.lastElementChild))) {
        if (LIST.test(lines[i])) {
          const li = document.createElement('li');
          inline(lines[i].replace(LIST, ''), li);
          list.appendChild(li);
        } else if (list.lastElementChild) {
          inline(` ${lines[i].trim()}`, list.lastElementChild as HTMLElement);
        }
        i += 1;
      }
      out.push(list);
      continue;
    }
    if (ROW.test(line)) {
      const table = document.createElement('table');
      let head = true;
      while (i < lines.length && ROW.test(lines[i])) {
        if (RULE.test(lines[i])) { i += 1; continue; }
        const tr = document.createElement('tr');
        for (const c of cells(lines[i])) { const td = document.createElement(head ? 'th' : 'td'); inline(c, td); tr.appendChild(td); }
        table.appendChild(tr);
        head = false;
        i += 1;
      }
      const wrap = document.createElement('div');
      wrap.className = 'fs-md-table';
      wrap.appendChild(table);
      out.push(wrap);
      continue;
    }
    const p = document.createElement('p');
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !LIST.test(lines[i]) && !ROW.test(lines[i]) && !/^\s*```/.test(lines[i]) && !/^#{1,4}\s/.test(lines[i]) && !/^\s*>/.test(lines[i])) { para.push(lines[i].trim()); i += 1; }
    if (!para.length) { para.push(line.trim()); i += 1; }
    inline(para.join(' '), p);
    out.push(p);
  }
  return out;
}

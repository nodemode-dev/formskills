export type Row = { kind: "same" | "add" | "del"; text: string };

const CAP = 2500;

export function lineDiff(before: string, after: string): Row[] {
  const a = before.split("\n");
  const b = after.split("\n");
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail += 1;
  const x = a.slice(head, a.length - tail);
  const y = b.slice(head, b.length - tail);
  const rows: Row[] = a.slice(0, head).map((text) => ({ kind: "same", text }));
  if (x.length * y.length > CAP * CAP) {
    rows.push(...x.map((text): Row => ({ kind: "del", text })), ...y.map((text): Row => ({ kind: "add", text })));
  } else {
    const width = y.length + 1;
    const table = new Uint32Array((x.length + 1) * width);
    for (let i = x.length - 1; i >= 0; i -= 1) {
      for (let j = y.length - 1; j >= 0; j -= 1) {
        table[i * width + j] = x[i] === y[j] ? table[(i + 1) * width + j + 1] + 1 : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < x.length && j < y.length) {
      if (x[i] === y[j]) {
        rows.push({ kind: "same", text: x[i] });
        i += 1;
        j += 1;
      } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
        rows.push({ kind: "del", text: x[i] });
        i += 1;
      } else {
        rows.push({ kind: "add", text: y[j] });
        j += 1;
      }
    }
    for (; i < x.length; i += 1) rows.push({ kind: "del", text: x[i] });
    for (; j < y.length; j += 1) rows.push({ kind: "add", text: y[j] });
  }
  rows.push(...a.slice(a.length - tail).map((text): Row => ({ kind: "same", text })));
  return rows;
}

export function hunks(rows: Row[], context = 2): Row[][] {
  const keep = new Array<boolean>(rows.length).fill(false);
  rows.forEach((r, i) => {
    if (r.kind === "same") return;
    for (let k = Math.max(0, i - context); k <= Math.min(rows.length - 1, i + context); k += 1) keep[k] = true;
  });
  const out: Row[][] = [];
  let cur: Row[] | null = null;
  rows.forEach((r, i) => {
    if (!keep[i]) {
      cur = null;
      return;
    }
    if (!cur) {
      cur = [];
      out.push(cur);
    }
    cur.push(r);
  });
  return out;
}

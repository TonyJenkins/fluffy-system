'use strict';

const LESSONS = [
  ['Headings', '# Heading 1\n## Heading 2\n### Heading 3', 'Start a line with 1–6 # characters.'],
  ['Emphasis', '*italic* or _italic_\n\n**bold** or __bold__\n\n~~strikethrough~~', 'One mark = italic, two = bold.'],
  ['Unordered list', '- apple\n- banana\n- cherry', 'Use -, * or + at the start of each line.'],
  ['Ordered list', '1. first\n2. second\n3. third', 'Numbers followed by a full stop.'],
  ['Links', '[GitHub](https://github.com)', 'Text in [brackets], URL in (parentheses).'],
  ['Images', '![A cat](cat.png)', 'Like a link, with a leading !'],
  ['Inline code', 'Use `print()` to show output.', 'Wrap code in single backticks.'],
  ['Code block', '```python\nprint("hi")\n```', 'Fence with three backticks; add a language name for highlighting.'],
  ['Blockquote', '> Quoted text', 'Start the line with >.'],
  ['Horizontal rule', '---', 'Three hyphens on their own line.'],
  ['Table', '| Name | Age |\n|------|-----|\n| Ann  | 30  |', 'Pipes separate columns; the second row of hyphens is required.'],
];

const QUIZ = [
  ['Which Markdown makes a level-2 heading?', ['# Title', '## Title', '2# Title', '== Title =='], 1],
  ['How do you write bold text?', ['*text*', '**text**', '~~text~~', '`text`'], 1],
  ['How do you write a link?', ['(text)[url]', '<text>(url)', '[text](url)', '{text}[url]'], 2],
  ['Which creates inline code?', ['`code`', '"code"', '|code|', '^code^'], 0],
  ['In Jupyter, which key switches a cell to Markdown (command mode)?', ['C', 'M', 'Y', 'R'], 1],
  ['How do you render a Markdown cell in Jupyter?', ['Ctrl+S', 'Shift+Enter', 'Tab', 'Esc twice'], 1],
  ['Which Markdown feature works on GitHub but not in Jupyter?', ['Headings', 'Tables', 'Task lists', 'Links'], 2],
  ['How do you write an unticked task item on GitHub?', ['- [ ] item', '- (x) item', '[] item', '* {} item'], 0],
  ['How do you write inline maths in a Jupyter Markdown cell?', ['$x^2$', '#x^2#', '%x^2%', '@x^2@'], 0],
  ['How do you get syntax highlighting in a fenced block?', ['Indent it', 'Put the language after the opening ```', 'Use bold', 'Add a comment'], 1],
  ['What does `> text` produce?', ['A heading', 'A blockquote', 'A list', 'A table'], 1],
  ['Which file does GitHub show on a repo home page?', ['index.md', 'README.md', 'HOME.md', 'main.md'], 1],
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s) {
  const codes = [];
  s = esc(s).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => safeUrl(u) ? `<img alt="${a}" src="${u}">` : _)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => safeUrl(u) ? `<a href="${u}">${t}</a>` : _)
    .replace(/(\*\*|__)(.+?)\1/g, '<strong>$2</strong>')
    .replace(/(\*|_)(.+?)\1/g, '<em>$2</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}

function safeUrl(u) {
  return !/^\s*(javascript|data|vbscript):/i.test(u.replace(/&amp;/g, '&'));
}

function render(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  while (i < lines.length) {
    const l = lines[i];
    let m;
    if (/^```/.test(l)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
    } else if ((m = l.match(/^(#{1,6})\s+(.*)$/))) {
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); i++;
    } else if (/^(-{3,}|\*{3,})\s*$/.test(l)) {
      out.push('<hr>'); i++;
    } else if (/^>/.test(l)) {
      const buf = [];
      while (i < lines.length && /^>/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${render(buf.join('\n'))}</blockquote>`);
    } else if (/^\s*([-*+]|\d+\.)\s+/.test(l)) {
      const tag = /^\s*\d+\./.test(l) ? 'ol' : 'ul';
      const items = [];
      while (i < lines.length && (m = lines[i].match(/^\s*(?:[-*+]|\d+\.)\s+(.*)$/))) { items.push(`<li>${inline(m[1])}</li>`); i++; }
      out.push(`<${tag}>${items.join('')}</${tag}>`);
    } else if (/\|/.test(l) && i + 1 < lines.length && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const head = cells(l);
      i += 2;
      const rows = [];
      while (i < lines.length && /\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push('<table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        rows.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>');
    } else if (!l.trim()) {
      i++;
    } else {
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|>|\s*([-*+]|\d+\.)\s)/.test(lines[i])) buf.push(lines[i++]);
      if (!buf.length) buf.push(lines[i++]);
      out.push(`<p>${inline(buf.join('\n'))}</p>`);
    }
  }
  return out.join('\n');
}

// Lessons
document.getElementById('basics-list').innerHTML = LESSONS.map(([title, src, tip]) =>
  `<div class="ex"><h3>${esc(title)} <small class="note">– ${esc(tip)}</small></h3>` +
  `<pre>${esc(src)}</pre><div class="out">${render(src)}</div></div>`).join('');

// Playground
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const update = () => { preview.innerHTML = render(editor.value); };
editor.addEventListener('input', update);
update();

// Flashcards
const card = document.getElementById('card');
const count = document.getElementById('card-count');
let deck = LESSONS.map(([t, src, tip]) => ({ q: `How do you write: ${t}?`, a: `${src}\n\n${tip}` }));
let idx = 0, flipped = false;
function showCard() {
  card.textContent = flipped ? deck[idx].a : deck[idx].q;
  card.classList.toggle('back', flipped);
  count.textContent = `${idx + 1} / ${deck.length}`;
}
const go = d => { idx = (idx + d + deck.length) % deck.length; flipped = false; showCard(); };
const flip = () => { flipped = !flipped; showCard(); };
card.addEventListener('click', flip);
card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
document.getElementById('flip').onclick = flip;
document.getElementById('prev').onclick = () => go(-1);
document.getElementById('next').onclick = () => go(1);
document.getElementById('shuffle').onclick = () => {
  for (let k = deck.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [deck[k], deck[j]] = [deck[j], deck[k]]; }
  idx = 0; flipped = false; showCard();
};
showCard();

// Quiz
const box = document.getElementById('quiz-box');
let qi = 0, score = 0;
function showQuestion() {
  if (qi >= QUIZ.length) {
    box.innerHTML = `<p><strong>Score: ${score} / ${QUIZ.length}</strong></p><button id="restart">Try again</button>`;
    document.getElementById('restart').onclick = () => { qi = 0; score = 0; showQuestion(); };
    return;
  }
  const [q, opts, ans] = QUIZ[qi];
  box.innerHTML = `<p>${qi + 1}/${QUIZ.length}. ${inline(q)}</p>` +
    opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)}</button>`).join('');
  box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    const k = +b.dataset.k;
    if (k === ans) score++;
    box.querySelectorAll('.opt').forEach(x => { x.disabled = true; x.classList.add(+x.dataset.k === ans ? 'right' : 'wrong'); if (+x.dataset.k !== ans && x !== b) x.classList.remove('wrong'); });
    const n = document.createElement('button');
    n.textContent = qi + 1 === QUIZ.length ? 'Finish' : 'Next';
    n.onclick = () => { qi++; showQuestion(); };
    box.appendChild(n);
  });
}
showQuestion();

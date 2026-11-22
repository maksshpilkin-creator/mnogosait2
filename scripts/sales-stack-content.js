'use strict';
const crypto = require('crypto');

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// The guide is data: never evaluate HTML or commands from Markdown.
function inlineMarkdown(text) {
  const tokens = /(`[^`]+`|\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*)/g;
  let result = '', start = 0;
  for (const match of text.matchAll(tokens)) {
    result += escapeHtml(text.slice(start, match.index));
    const value = match[0];
    if (value.startsWith('`')) result += '<code>' + escapeHtml(value.slice(1, -1)) + '</code>';
    else if (value.startsWith('**')) result += '<strong>' + inlineMarkdown(value.slice(2, -2)) + '</strong>';
    else {
      const link = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      // Relative repository references stay readable at all three station URLs.
      result += /^https?:\/\//i.test(link[2])
        ? '<a href="' + escapeHtml(link[2]) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(link[1]) + '</a>'
        : escapeHtml(link[1]) + ' <code>(' + escapeHtml(link[2]) + ')</code>';
    }
    start = match.index + value.length;
  }
  return result + escapeHtml(text.slice(start));
}

function plainMarkdown(text) {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');
}

function renderMarkdown(markdown) {
  const lines = markdown.trim().split('\n');
  const output = [];
  const tableCells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(s => s.trim());
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^```/.test(line)) {
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      i++;
      output.push('<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>');
    } else if (/^#{1,6} /.test(line)) {
      const heading = line.match(/^(#{1,6}) (.+)$/);
      const tag = Math.min(heading[1].length + 1, 6);
      output.push('<h' + tag + '>' + inlineMarkdown(heading[2]) + '</h' + tag + '>');
      i++;
    } else if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(tableCells(lines[i++]));
      const head = rows.shift();
      if (rows.length && rows[0].every(cell => /^:?-+:?$/.test(cell))) rows.shift();
      output.push('<div class="stack-table-scroll"><table><thead><tr>' + head.map(c => '<th>' + inlineMarkdown(c) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + row.map(c => '<td>' + inlineMarkdown(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>');
    } else if (/^>/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>/.test(lines[i])) quote.push(lines[i++].replace(/^> ?/, ''));
      output.push('<blockquote>' + quote.join('\n').split(/\n\s*\n/).map(p => '<p>' + inlineMarkdown(p.replace(/\n/g, ' ')) + '</p>').join('') + '</blockquote>');
    } else if (/^(?:- |\d+\. )/.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const pattern = ordered ? /^\d+\. / : /^- /;
      const items = [];
      while (i < lines.length && pattern.test(lines[i])) items.push(lines[i++].replace(pattern, ''));
      const tag = ordered ? 'ol' : 'ul';
      output.push('<' + tag + '>' + items.map(p => '<li>' + inlineMarkdown(p) + '</li>').join('') + '</' + tag + '>');
    } else {
      const paragraph = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !/^(?:#{1,6} |> |\||```|- |\d+\. )/.test(lines[i])) paragraph.push(lines[i++]);
      output.push('<p>' + inlineMarkdown(paragraph.join(' ')) + '</p>');
    }
  }
  return output.join('\n');
}

function readSalesStack(markdown) {
  const normalized = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const chunks = normalized.split(/^## /m);
  const intro = chunks.shift().trim();
  const sections = chunks.map((chunk, index) => {
    const end = chunk.indexOf('\n');
    return { id: 'stack-section-' + index, title: chunk.slice(0, end), body: chunk.slice(end + 1).trim() };
  });
  function section(number) {
    const match = sections.find(s => s.title.startsWith(number + '. '));
    if (!match) throw new Error('FULL_SALES_STACK.md: нет раздела ' + number);
    return match;
  }
  function subsection(number, title) {
    const body = section(number).body;
    const marker = '### ' + title + '\n';
    const start = body.indexOf(marker);
    if (start < 0) throw new Error('FULL_SALES_STACK.md: нет подраздела ' + title);
    const rest = body.slice(start + marker.length);
    return rest.split(/^### /m)[0].trim();
  }
  function quoteAfter(number, marker) {
    const body = section(number).body;
    const start = body.indexOf(marker);
    if (start < 0) throw new Error('FULL_SALES_STACK.md: нет метки ' + marker);
    const rest = body.slice(start + marker.length);
    const quote = rest.match(/(?:^|\n)(>[^\n]*(?:\n>[^\n]*)*)/);
    if (!quote) throw new Error('FULL_SALES_STACK.md: нет цитаты после ' + marker);
    return plainMarkdown(quote[1].split('\n').map(line => line.replace(/^> ?/, '')).join('\n'));
  }
  function paragraph(number, startsWith) {
    const value = section(number).body.split(/\n\s*\n/).find(p => p.startsWith(startsWith));
    if (!value) throw new Error('FULL_SALES_STACK.md: нет абзаца ' + startsWith);
    return plainMarkdown(value);
  }
  const quick = sections.find(s => s.title === 'Быстрая памятка на один экран');
  if (!quick) throw new Error('FULL_SALES_STACK.md: нет быстрой памятки');
  const quickSteps = [...quick.body.matchAll(/^\d+\. (.+)$/gm)].map(m => plainMarkdown(m[1]));
  const routeMatch = intro.match(/Рабочая схема: (.+)\./);
  if (!routeMatch) throw new Error('FULL_SALES_STACK.md: нет рабочей схемы');
  const genericNote = paragraph(6, 'Заполни скобки');
  const templates = {
    admin: quoteAfter(5, '**Основное сообщение:**'),
    ownerHasSite: quoteAfter(6, '### Сайт есть'),
    ownerNoSite: quoteAfter(6, '### Сайт не найден'),
    review: quoteAfter(7, '### Сообщение вместе с готовым видео'),
    call: quoteAfter(9, '**Приглашение:**')
  };
  const notes = {
    admin: paragraph(5, 'Пиши в опубликованный') + '\n\n' + paragraph(5, 'Для первого обращения'),
    ownerHasSite: genericNote + '\n\n' + paragraph(6, 'Можно добавить'),
    ownerNoSite: genericNote + '\n\n' + paragraph(6, 'Когда ссылку дали'),
    review: quickSteps[4] + '\n\n' + paragraph(7, 'Прикрепи видео'),
    call: paragraph(9, 'Созвон полезен') + '\n\n' + paragraph(9, 'Если предлагаешь')
  };
  const guideHtml = '<div class="stack-markdown">' + renderMarkdown(intro) + sections.map(s => '<details id="' + s.id + '"' + (s === quick ? ' open' : '') + '><summary>' + inlineMarkdown(s.title) + '</summary><div class="stack-section-content">' + renderMarkdown(s.body) + '</div></details>').join('\n') + '</div>';
  const faqFragments = [
    { title: 'Если спросили стоимость сразу', body: subsection(6, 'Если спросили стоимость сразу') },
    { title: 'Постоянная поддержка после запуска', body: subsection(3, 'Постоянная поддержка после запуска') },
    { title: 'Если попросили примеры', body: subsection(6, 'Если попросили примеры') },
    { title: section(8).title, body: section(8).body },
    { title: section(11).title, body: section(11).body }
  ];
  const faqHtml = '<div class="stack-markdown">' + faqFragments.map(f => '<details><summary>' + inlineMarkdown(f.title) + '</summary><div class="stack-section-content">' + renderMarkdown(f.body) + '</div></details>').join('\n') + '</div>';
  return {
    hash: crypto.createHash('sha256').update(markdown).digest('hex'),
    sections,
    route: plainMarkdown(routeMatch[1]),
    quickSteps,
    templates,
    notes,
    guideHtml,
    faqHtml,
    contactNote: paragraph(4, 'Название, часы'),
    videoGuideHtml: renderMarkdown(subsection(7, 'Структура обзора — речь формулируешь сам')),
    callGuideHtml: renderMarkdown(section(9).body + '\n\n## ' + section(10).title + '\n\n' + section(10).body)
  };
}

module.exports = { readSalesStack, renderMarkdown, plainMarkdown };

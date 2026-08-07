import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const ROOT = process.cwd()

export { dominantNewline, cleanup, findComments, stripTs, stripCss, stripSql, scanLeftovers }

function dominantNewline(text) {
  const crlf = (text.match(/\r\n/g) || []).length
  const lf = (text.match(/(?<!\r)\n/g) || []).length
  return crlf > lf ? '\r\n' : '\n'
}

function cleanup(text, nl) {
  let lines = text.split(/\r\n|\r|\n/)
  lines = lines.map((line) => line.replace(/[ \t]+$/, ''))
  const result = []
  for (const line of lines) {
    const isBlank = line.trim() === ''
    if (isBlank) {
      if (result.length === 0 || result[result.length - 1] === '') continue
      result.push('')
    } else {
      result.push(line)
    }
  }
  while (result.length && result[result.length - 1] === '') result.pop()
  let out = result.join(nl)
  out = out.replace(/[ \t]+$/, '')
  if (!out.endsWith(nl)) out += nl
  return out
}

function findComments(source, isJsx) {
  const sf = ts.createSourceFile('x' + (isJsx ? '.tsx' : '.ts'), source, ts.ScriptTarget.Latest, true)
  const positions = new Set()
  const tokenSpans = new Set()
  const visit = (node) => {
    const s = node.getStart(sf)
    const e = node.getEnd()
    positions.add(s)
    positions.add(e)
    if (node.kind >= ts.SyntaxKind.FirstToken && node.kind <= ts.SyntaxKind.LastToken && e > s) {
      tokenSpans.add(s + ',' + e)
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  positions.add(0)
  positions.add(source.length)
  const sorted = [...positions].sort((a, b) => a - b)

  const comments = []
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    isJsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard,
  )
  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = sorted[i]
    const gapEnd = sorted[i + 1]
    if (gapEnd <= gapStart) continue
    if (tokenSpans.has(gapStart + ',' + gapEnd)) continue
    const gap = source.slice(gapStart, gapEnd)
    scanner.setText(gap)
    let token = scanner.scan()
    while (token !== ts.SyntaxKind.EndOfFileToken) {
      if (token === ts.SyntaxKind.MultiLineCommentTrivia || token === ts.SyntaxKind.SingleLineCommentTrivia) {
        const start = gapStart + scanner.getTokenPos()
        const end = gapStart + scanner.getTextPos()
        comments.push([start, end, token === ts.SyntaxKind.MultiLineCommentTrivia, source.slice(start, end)])
      }
      token = scanner.scan()
    }
  }
  return comments
}

function stripTs(source, isJsx) {
  let out = ''
  let cursor = 0
  for (const [start, end, multi] of findComments(source, isJsx)) {
    if (start < cursor) continue
    out += source.slice(cursor, start)
    if (multi) {
      const nls = source.slice(start, end).match(/\r\n|\r|\n/g)
      out += nls ? nls.join('') : ' '
    }
    cursor = end
  }
  out += source.slice(cursor)
  return out
}

function stripCss(source) {
  let out = ''
  let i = 0
  const n = source.length
  while (i < n) {
    const c = source[i]
    if (c === "'" || c === '"') {
      let j = i + 1
      while (j < n) {
        if (source[j] === '\\') { j += 2; continue }
        if (source[j] === c) { j++; break }
        j++
      }
      out += source.slice(i, j)
      i = j
      continue
    }
    if (c === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2)
      if (end !== -1) {
        const body = source.slice(i, end + 2)
        const nls = body.match(/\r\n|\r|\n/g)
        out += nls ? nls.join('') : ' '
        i = end + 2
        continue
      }
    }
    out += c
    i++
  }
  return out
}

function stripSql(source) {
  let out = ''
  let i = 0
  const n = source.length
  const isLineStart = () => {
    let j = out.length - 1
    while (j >= 0 && (out[j] === ' ' || out[j] === '\t' || out[j] === '\n' || out[j] === '\r')) j--
    return j < 0 || out[j] === '\n' || out[j] === '\r'
  }
  while (i < n) {
    const c = source[i]
    const next = source[i + 1]
    if (c === "'") {
      let j = i + 1
      while (j < n) {
        if (source[j] === "'" && source[j + 1] === "'") { j += 2; continue }
        if (source[j] === "'") { j++; break }
        j++
      }
      out += source.slice(i, j)
      i = j
      continue
    }
    if (c === '"') {
      let j = i + 1
      while (j < n) {
        if (source[j] === '"' && source[j + 1] === '"') { j += 2; continue }
        if (source[j] === '"') { j++; break }
        j++
      }
      out += source.slice(i, j)
      i = j
      continue
    }
    if (c === '$') {
      const m = source.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/)
      if (m) {
        const tag = m[0]
        const end = source.indexOf(tag, i + tag.length)
        if (end !== -1) {
          out += source.slice(i, end + tag.length)
          i = end + tag.length
          continue
        }
      }
    }
    if (c === '-' && next === '-') {
      let j = i + 2
      while (j < n && source[j] !== '\n' && source[j] !== '\r') j++
      const eol = j < n ? source[j] : ''
      if (!isLineStart()) out += ' '
      out += eol
      if (eol === '\r' && source[j + 1] === '\n') out += '\n'
      i = j + (eol === '\r' && source[j + 1] === '\n' ? 2 : 1)
      continue
    }
    if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      if (end !== -1) {
        const body = source.slice(i, end + 2)
        const nls = body.match(/\r\n|\r|\n/g)
        if (nls) {
          out += nls.join('')
        } else {
          out += ' '
        }
        i = end + 2
        continue
      }
    }
    out += c
    i++
  }
  return out
}

function scanLeftovers(source, isJsx) {
  return findComments(source, isJsx).map(([start, end, , text]) => ({ start, end, text }))
}

function collectFiles() {
  const files = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else files.push(full)
    }
  }
  walk(path.join(ROOT, 'src'))
  for (const f of ['scripts/prerender.mjs', 'vite.config.ts', 'vitest.config.ts', 'eslint.config.js']) {
    const full = path.join(ROOT, f)
    if (fs.existsSync(full)) files.push(full)
  }
  const migDir = path.join(ROOT, 'supabase', 'migrations')
  if (fs.existsSync(migDir)) {
    for (const f of fs.readdirSync(migDir)) {
      if (f.endsWith('.sql')) files.push(path.join(migDir, f))
    }
  }
  return [...new Set(files)]
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  let changed = 0
  let skipped = 0
  const leftoverReports = []
  for (const file of collectFiles()) {
    if (file.endsWith('.d.ts')) {
      skipped++
      continue
    }
    const raw = fs.readFileSync(file, 'utf8')
    const nl = dominantNewline(raw)
    let stripped
    if (file.endsWith('.css')) {
      stripped = stripCss(raw)
    } else if (file.endsWith('.sql')) {
      stripped = stripSql(raw)
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(file)) {
      stripped = stripTs(raw, /\.(tsx|jsx)$/.test(file))
    } else {
      skipped++
      continue
    }
    const leftovers = /\.(ts|tsx|js|jsx|mjs)$/.test(file) ? scanLeftovers(stripped, /\.(tsx|jsx)$/.test(file)) : []
    if (leftovers.length) {
      leftoverReports.push([path.relative(ROOT, file), leftovers.map((l) => JSON.stringify(l.text))])
    }
    const final = cleanup(stripped, nl)
    if (final !== raw) {
      fs.writeFileSync(file, final, 'utf8')
      changed++
      console.log('stripped:', path.relative(ROOT, file))
    }
  }
  console.log(`\n${changed} files cleaned, ${skipped} skipped`)
  if (leftoverReports.length) {
    console.log('\nLEFT OVER COMMENTS (unprotected, NOT stripped):')
    for (const [file, texts] of leftoverReports) {
      console.log(`  ${file}`)
      for (const t of texts) console.log(`    ${t}`)
    }
  } else {
    console.log('No leftover comments in TS/JS output.')
  }
}

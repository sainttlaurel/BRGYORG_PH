import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { cleanup, dominantNewline, stripCss, stripSql, stripTs } from './clean-comments.mjs'

const ROOT = process.cwd()

function transform(file, raw) {
  const nl = dominantNewline(raw)
  let stripped
  if (file.endsWith('.css')) {
    stripped = stripCss(raw)
  } else if (file.endsWith('.sql')) {
    stripped = stripSql(raw)
  } else {
    stripped = stripTs(raw, /\.(tsx|jsx)$/.test(file))
  }
  return cleanup(stripped, nl)
}

const changed = execSync('git diff --name-only', { cwd: ROOT, encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((f) => /\.(ts|tsx|js|jsx|mjs|css|sql)$/.test(f))

let mismatches = 0
for (const rel of changed) {
  const full = path.join(ROOT, rel)
  if (!fs.existsSync(full)) continue
  const head = execSync(`git show HEAD:${rel.replace(/\\/g, '/')}`, { cwd: ROOT, encoding: 'utf8' })
  const expected = transform(rel, head).replace(/\r\n/g, '\n')
  const actual = fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n')
  if (expected !== actual) {
    mismatches++
    console.log(`\nMISMATCH: ${rel}`)
    const e = expected.split(/\r\n|\r|\n/)
    const a = actual.split(/\r\n|\r|\n/)
    const max = Math.max(e.length, a.length)
    for (let i = 0; i < max; i++) {
      if (e[i] !== a[i]) {
        console.log(`  line ${i + 1}:`)
        console.log(`    expected: ${JSON.stringify(e[i] ?? '')}`)
        console.log(`    actual:   ${JSON.stringify(a[i] ?? '')}`)
      }
    }
  }
}
console.log(`\n${changed.length} code files checked, ${mismatches} mismatched (expected only known manual fixes)`)

import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const projectRoot = path.resolve(import.meta.dirname, '../../..')
const srcRoot = path.join(projectRoot, 'src')
const generatedClientRoot = path.join(srcRoot, 'client')
const sourceExtensions = new Set(['.ts', '.vue'])
const explicitAnyPattern = /\b(as\s+any|any\[\]|:\s*any\b|<\s*any\b|Record<[^>]*\bany\b[^>]*>)/g

async function collectSourceFiles(dir) {
  if (dir === generatedClientRoot) {
    return []
  }

  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectSourceFiles(fullPath))
      continue
    }
    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

function lineNumberFor(source, index) {
  return source.slice(0, index).split('\n').length
}

test('business frontend source does not use explicit any', async () => {
  const files = await collectSourceFiles(srcRoot)
  const violations = []

  for (const file of files) {
    const source = await readFile(file, 'utf8')
    for (const match of source.matchAll(explicitAnyPattern)) {
      violations.push(`${path.relative(projectRoot, file)}:${lineNumberFor(source, match.index ?? 0)} ${match[0]}`)
    }
  }

  assert.deepEqual(violations, [])
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { findCanonicalWebDir } from '../project-paths.mjs'

test('findCanonicalWebDir resolves a web directory paired with api/desc/main.api', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'swagger-paths-'))

  try {
    const webDir = path.join(root, 'web')
    const nestedDir = path.join(webDir, 'scripts', 'swagger')
    const apiDescDir = path.join(root, 'api', 'desc')
    await mkdir(nestedDir, { recursive: true })
    await mkdir(apiDescDir, { recursive: true })
    await writeFile(path.join(apiDescDir, 'main.api'), 'syntax = "v1"\n')

    assert.equal(findCanonicalWebDir(nestedDir), webDir)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

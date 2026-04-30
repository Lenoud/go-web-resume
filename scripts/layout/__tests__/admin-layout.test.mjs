import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const adminLayoutPath = path.resolve('src/layouts/AdminLayout.vue')

test('AdminLayout uses a fixed viewport shell with isolated sidebar and content scroll areas', async () => {
  const source = await readFile(adminLayoutPath, 'utf8')

  assert.match(source, /<a-layout class="admin-shell">/)
  assert.match(source, /class="admin-sider"/)
  assert.match(source, /<a-layout class="admin-main">/)
  assert.match(source, /<a-layout-content class="admin-content">/)
  assert.match(source, /\.admin-sider\s*\{[^}]*height:\s*100vh/s)
  assert.match(source, /\.admin-main\s*\{[^}]*height:\s*100vh/s)
  assert.match(source, /\.admin-content\s*\{[^}]*overflow:\s*auto/s)
})

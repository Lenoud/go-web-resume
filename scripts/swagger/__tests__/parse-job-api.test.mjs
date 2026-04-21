import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { parseJobApi } from '../parse-job-api.mjs'

const fixturePath = new URL('../__fixtures__/job.api.fixture', import.meta.url)

test('parseJobApi extracts types, response kinds, and route returns', async () => {
  const source = await readFile(fixturePath, 'utf8')
  const parsed = parseJobApi(source)

  assert.equal(parsed.typesByName.CompanyListResp.data.kind, 'ref')
  assert.equal(parsed.typesByName.CompanyListResp.data.typeName, 'CompanyListData')
  assert.equal(parsed.typesByName.CompanyDeleteResp.data.kind, 'none')
  assert.equal(parsed.typesByName.PostUserInterviewListResp.data.kind, 'array')
  assert.equal(parsed.typesByName.PostUserInterviewListResp.data.typeName, 'InterviewWithJobInfo')

  assert.deepEqual(parsed.routes[0], {
    method: 'GET',
    path: '/api/company/list',
    requestType: 'CompanyListReq',
    responseType: 'CompanyListResp',
  })
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { parseJobApi } from '../parse-job-api.mjs'

const fixturePath = new URL('../__fixtures__/job.api.fixture', import.meta.url)

test('parseJobApi extracts types, response kinds, and route returns', async () => {
  const source = await readFile(fixturePath, 'utf8')
  const parsed = parseJobApi(source)

  assert.equal(parsed.typesByName.CompanyInfo.fieldsByName.id.kind, 'primitive')
  assert.equal(parsed.typesByName.CompanyListData.fieldsByName.list.kind, 'array')
  assert.equal(parsed.typesByName.CompanyListData.fieldsByName.list.typeName, 'CompanyInfo')
  assert.equal(parsed.typesByName.CompanyListResp.data.kind, 'ref')
  assert.equal(parsed.typesByName.CompanyListResp.data.typeName, 'CompanyListData')
  assert.equal(parsed.typesByName.CompanyDeleteResp.data.kind, 'none')
  assert.equal(parsed.typesByName.PostUserInterviewListResp.data.kind, 'array')
  assert.equal(parsed.typesByName.PostUserInterviewListResp.data.typeName, 'InterviewWithJobInfo')

  assert.deepEqual(parsed.routes.find((route) => route.path === '/api/company/list'), {
    method: 'GET',
    path: '/api/company/list',
    requestType: 'CompanyListReq',
    responseType: 'CompanyListResp',
  })
})

test('parseJobApi strips block comments and tolerates trailing field tags', () => {
  const parsed = parseJobApi([
    'syntax = "v1"',
    '',
    '/*',
    'type Ignored {',
    '    Nope string `json:"nope"`',
    '}',
    '*/',
    '',
    'type (',
    '    CommentedInfo {',
    '        Value string `json:"value"`',
    '    }',
    '    CommentedResp {',
    '        BaseResp',
    '        Data *CommentedInfo `json:"data,omitempty"` yaml:"data,omitempty" xml:"data,omitempty"',
    '    }',
    ')',
    '',
    'service server-api {',
    '    // route comment should be ignored',
    '    @handler commentRoute',
    '    get /api/commented (CommentedReq) returns (CommentedResp)',
    '}',
  ].join('\n'))

  assert.equal(parsed.typesByName.Ignored, undefined)
  assert.equal(parsed.typesByName.CommentedInfo.fieldsByName.value.kind, 'primitive')
  assert.equal(parsed.typesByName.CommentedResp.data.kind, 'ref')
  assert.equal(parsed.typesByName.CommentedResp.data.typeName, 'CommentedInfo')
  assert.deepEqual(parsed.routes[0], {
    method: 'GET',
    path: '/api/commented',
    requestType: 'CommentedReq',
    responseType: 'CommentedResp',
  })
})

// Codex 모드 시험: node --test tests/codex-mode.test.mjs
// 가짜 codex 스크립트로 `queue --thread <ID> --message <text>` 호출을 확인한다(실제 Codex·브라우저 없음).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const tmp = mkdtempSync(join(tmpdir(), 'pm-codex-test-'))
const goal = join(tmp, 'goal')
const log = join(tmp, 'codex.log')
const fake = join(tmp, 'codex')
const portFile = join(tmp, 'url')
let child, url, token

before(async () => {
  mkdirSync(goal)
  writeFileSync(join(goal, 'PLAN.md'), '# PLAN\n\n## 마일스톤 1: 시험\n- [ ] M1-T1: 첫 작업\n')
  writeFileSync(join(goal, 'PROGRESS.md'), '# PROGRESS\n\n## 현재 골\n시험.\n')
  writeFileSync(fake, `#!/bin/sh\nprintf '%s\\n' "$@" >> "${log}"\n`)
  chmodSync(fake, 0o755)
  child = spawn(process.execPath, [new URL('../web/server.mjs', import.meta.url).pathname, '--dir', goal, '--port', '4891', '--port-file', portFile, '--codex', fake, '--thread', 'test-thread'], { stdio: 'ignore' })
  for (let i = 0; i < 50 && !(existsSync(portFile) && readFileSync(portFile, 'utf8')); i++) await new Promise(r => setTimeout(r, 100))
  url = readFileSync(portFile, 'utf8')
})

after(() => { child?.kill(); rmSync(tmp, { recursive: true, force: true }) })

test('board: M1-T1이 있고 연결 정보가 Codex 스레드로 보인다', async () => {
  const b = await (await fetch(url + 'api/board')).json()
  assert.ok(JSON.stringify(b.milestones).includes('M1-T1'))
  assert.equal(b.link.name, 'Codex 스레드 test-thr')
})

test('send: 페이지의 토큰 + 같은 출처로 보내면 codex queue --thread --message로 불린다', async () => {
  const html = await (await fetch(url)).text()
  token = /[0-9a-f]{32}/.exec(html)?.[0]
  assert.ok(token)
  const bad = await fetch(url + 'api/send', { method: 'POST', headers: { 'content-type': 'application/json', 'x-playmaker-token': token, origin: 'http://evil.example' }, body: '{"text":"x"}' })
  assert.equal(bad.status, 403)
  const r = await (await fetch(url + 'api/send', { method: 'POST', headers: { 'content-type': 'application/json', 'x-playmaker-token': token, origin: url.replace(/\/$/, '') }, body: JSON.stringify({ text: '[playmaker · M1-T1] 확인', task: 'M1-T1', label: '승인' }) })).json()
  assert.equal(r.ok, true)
  assert.deepEqual(readFileSync(log, 'utf8').trim().split('\n'), ['queue', '--thread', 'test-thread', '--message', '[playmaker · M1-T1] 확인'])
})

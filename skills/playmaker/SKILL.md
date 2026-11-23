---
name: playmaker
description: goaljaby 골 진행 보드(PLAN.md·PROGRESS.md·LOOP.md)를 연다. "골 보드", "진행 보드", "playmaker", "/playmaker", "골 진행 상황 보여줘" 요청에 쓴다. Codex에서는 브라우저 웹 보드 주소를 알려 준다.
---

# playmaker — 골 진행 보드

## 실행 환경 (Claude Code / Codex)

- Claude Code: mod 패널이 자동으로 뜬다. 패널이 없는 호스트(Paseo 등)면 `commands/playmaker.md`의 절차를 따른다.
- Codex: 아래 절차대로 웹 보드를 띄우고 주소만 알려 준다. 브라우저 창은 열지 않는다(사용자가 연다).
- Codex에서는 `${CLAUDE_PLUGIN_ROOT}`를 이 플러그인 루트(이 SKILL.md에서 두 단계 위 폴더)로 바꿔 읽는다. 아래 `<플러그인 루트>`가 그것이다.

## Codex 절차

1. 골 폴더를 정한다. 인자가 폴더 경로면 그 폴더, 없으면 현재 폴더에서 `docs/goals/*/PLAN.md` 등 하위 2단계 안에서 `PLAN.md`와 `PROGRESS.md`가 함께 있는 가장 최근 폴더. 못 찾으면 "골 폴더를 찾지 못했습니다. 경로를 알려 주세요"라고만 답하고 끝낸다.
2. 이미 떠 있는지 본다: 임시 파일 `${TMPDIR:-/tmp}/playmaker-web-<골 폴더 해시>.url`(해시는 `printf %s "<골 폴더>" | shasum | cut -c1-8`)에 주소가 있고 `curl -fsS <주소>api/health`의 `dir`이 골 폴더와 같으면 다시 띄우지 않고 그 주소를 쓴다.
3. 없으면 서버를 **끝나지 않는 명령 하나로** 띄운다. `&`·`nohup`으로 떼어 내지 않는다 — Codex는 끝난 명령이 남긴 자식 프로세스를 정리하므로, 떼어 낸 서버는 응답 직후 죽는다(2026-11-23 실측: 헬스 체크는 통과했는데 턴이 끝난 뒤 보드 요청에 응답 없음). 끝나지 않는 명령은 Codex가 백그라운드 터미널로 살려 두고, 도구는 yield 시간(3초 정도) 뒤 돌아온다:

   ```
   : > "$F"; node "<플러그인 루트>/web/server.mjs" --dir "<골 폴더>" --port-file "$F" --codex "$(command -v codex)" --thread "$CODEX_THREAD_ID" >"$F.log" 2>&1 </dev/null
   ```

   이 명령은 **샌드박스 밖 권한(escalated)으로** 실행하고 사용자에게 이유를 한 줄로 말한다 — 카드 행동이 이 서버에서 `codex queue`를 부르는데, 샌드박스 안에서 띄운 서버는 그 제한을 물려받아 `failed to start embedded app server: Operation not permitted`로 실패한다(2026-11-23 실측). `$F`는 2번의 임시 파일이다. 다음 명령에서 포트 파일이 채워질 때까지 최대 5초 기다린 뒤 읽는다. 안 뜨면 `$F.log` 끝 5줄을 보여 준다. Node 22.18 이상이 필요하다(`web/start.sh`와 같은 요건). 보드는 이 Codex 세션이 열려 있는 동안 떠 있다.
4. 사용자에게 `http://127.0.0.1:<포트>/` 주소를 알려 준다. 카드의 승인·진행 질문·보류·직접 쓰기는 이 스레드로 메시지가 돌아온다(`codex queue`). 보드는 골 폴더를 읽기만 한다.

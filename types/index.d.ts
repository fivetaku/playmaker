export type TaskState = 'todo' | 'doing' | 'done' | 'waiting'

export type Task = {
  /** M2-T1 같은 안정 ID (goaljaby 0.7+ 체크리스트) */
  id?: string
  text: string
  state: TaskState
  /** 체크리스트가 아니라 마일스톤 상태에서 추정한 상태 */
  inferred: boolean
}

export type Milestone = {
  id: string
  name: string
  status: 'todo' | 'current' | 'done'
  /** 진행 중이지만 사람 판단·외부 입력을 기다리는 중 */
  waiting: boolean
  tasks: Task[]
  /** 이 마일스톤을 왜 하는지 (goaljaby 0.7.2+ `- 목적:` 줄) */
  purpose: string
  /** 이 마일스톤에서 하는 일 (`- 범위(Scope):` 줄) */
  scope: string
  doneWhen: string
  /** checklist: PLAN 체크리스트 / legacy: PROGRESS·범위에서 추정 */
  source: 'checklist' | 'legacy'
}

/** insane-loop 저널(LOOP.md)에서 읽은 루프 상태. 못 읽으면 Board에 붙지 않는다 */
export type Loop = {
  status: 'active' | 'gate_pending' | 'done' | 'stopped'
  /** 마지막 회차 번호 (회차 기록이 없으면 0) */
  round: number
  /** 마지막 회차 검증 통과 수 / 전체 수 */
  passed: number | null
  total: number | null
  /** 마지막 회차 사다리 단계 (1~3) */
  ladder: number | null
  /** 마지막 회차에 쓴 리뷰어, 없으면 머리말의 reviewer */
  reviewer: string
  /** 판정이 gate_pending일 때 사람에게 묻는 질문 */
  gateQuestion: string
}

export type Board = {
  dir: string
  goal: string
  milestones: Milestone[]
  failed: number
  lastValidation: string
  allDone: boolean
  /** PLAN 체크리스트와 PROGRESS가 서로 다르게 말하는 곳 */
  mismatch: string[]
  updatedAt: number
  /** 끝나지 않았고 최근 7일 안에 PLAN 또는 PROGRESS가 바뀐 골 */
  active?: boolean
  /** band·자동 표시 여부 (자동: active, /playmaker 실행 시 항상) */
  show?: boolean
  /** 골 폴더나 그 위 2단계에 insane-loop LOOP.md가 있고 읽을 수 있을 때만 */
  loop?: Loop
}

declare module 'claude-code' {
  // 카드에서 세션에 보낸 지시: 그 턴이 끝날 때까지 다른 카드 행동을 잠근다
  type Pending = { task: string; label: string; at: number; started: boolean }

  interface PluginState {
    playmaker: {
      board: Board | null
      view: 'state' | 'milestone'
      expandDone: boolean
      pending: Pending | null
      selected: { key: string; compose: boolean } | null
      webUrl: string | null
    }
  }
}

import { useEffect, useMemo, useState } from 'react'
import { chooseMove, type Level } from './game/ai'
import {
  countStones,
  createInitialState,
  type GameState,
  legalMoves,
  play,
  type Player,
  winner,
} from './game/board'

type Mode = 'cpu' | 'pvp'

interface Settings {
  mode: Mode
  /** CPU 対戦で人が持つ色 */
  human: Player
  level: Level
}

const SETTINGS_KEY = 'reversi.settings'
const DEFAULT_SETTINGS: Settings = { mode: 'cpu', human: 'black', level: 'normal' }

// localStorage は使えない環境もあるので、失敗しても既定値で動かす
function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    // 読めなければ既定値
  }
  return DEFAULT_SETTINGS
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {
    // 保存できなくても対局は続けられる
  }
}

const NAME: Record<Player, string> = { black: '黒', white: '白' }
const LEVEL_NAME: Record<Level, string> = { easy: 'よわい', normal: 'ふつう', hard: 'つよい' }

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [game, setGame] = useState<GameState>(createInitialState)
  const [showHints, setShowHints] = useState(true)

  const cpu: Player | null = settings.mode === 'cpu' ? (settings.human === 'black' ? 'white' : 'black') : null
  const cpuThinking = game.turn !== null && game.turn === cpu

  const hints = useMemo(
    () => (game.turn && !cpuThinking ? new Set(legalMoves(game.board, game.turn)) : new Set<number>()),
    [game, cpuThinking],
  )
  const score = countStones(game.board)

  // CPU の手番なら少し間を置いてから打つ
  useEffect(() => {
    if (!cpuThinking || game.turn === null) return
    const timer = setTimeout(() => {
      const move = chooseMove(game.board, game.turn!, settings.level)
      if (move !== null) setGame((g) => play(g, move) ?? g)
    }, 450)
    return () => clearTimeout(timer)
  }, [game, cpuThinking, settings.level])

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
    setGame(createInitialState())
  }

  const onCellClick = (pos: number) => {
    if (cpuThinking) return
    const next = play(game, pos)
    if (next) setGame(next)
  }

  let status: string
  if (game.turn === null) {
    const w = winner(game.board)
    status = w === 'draw' ? '引き分け' : `${NAME[w]}の勝ち（${score.black} 対 ${score.white}）`
  } else if (cpuThinking) {
    status = 'CPU が考えています…'
  } else {
    status = `${NAME[game.turn]}の番です`
  }

  return (
    <main className="app">
      <h1>リバーシ</h1>

      <section className="scores" aria-label="石の数">
        <div className={`score ${game.turn === 'black' ? 'active' : ''}`}>
          <span className="stone black" aria-hidden /> 黒 {score.black}
          {cpu === 'black' && <small>CPU</small>}
        </div>
        <div className={`score ${game.turn === 'white' ? 'active' : ''}`}>
          <span className="stone white" aria-hidden /> 白 {score.white}
          {cpu === 'white' && <small>CPU</small>}
        </div>
      </section>

      <p className="status" role="status">
        {game.passed && game.turn && `${NAME[game.passed]}は打てる場所がないのでパスです。`}
        {status}
      </p>

      <div className="board" role="grid" aria-label="盤面">
        {game.board.map((cell, pos) => {
          const isHint = showHints && hints.has(pos)
          return (
            <button
              key={pos}
              className={`cell ${isHint ? 'hint' : ''} ${pos === game.lastMove ? 'last' : ''}`}
              onClick={() => onCellClick(pos)}
              disabled={!hints.has(pos)}
              aria-label={`${Math.floor(pos / 8) + 1}行${(pos % 8) + 1}列 ${cell ? NAME[cell] : '空き'}`}
            >
              {cell && <span className={`stone ${cell}`} />}
            </button>
          )
        })}
      </div>

      <section className="controls">
        <button className="primary" onClick={() => setGame(createInitialState())}>
          最初から
        </button>
        <label>
          <input type="checkbox" checked={showHints} onChange={(e) => setShowHints(e.target.checked)} />
          打てる場所を表示
        </label>
      </section>

      <section className="settings" aria-label="対局の設定">
        <div className="segmented">
          <button className={settings.mode === 'cpu' ? 'on' : ''} onClick={() => updateSettings({ mode: 'cpu' })}>
            CPU と対戦
          </button>
          <button className={settings.mode === 'pvp' ? 'on' : ''} onClick={() => updateSettings({ mode: 'pvp' })}>
            2 人で対戦
          </button>
        </div>
        {settings.mode === 'cpu' && (
          <>
            <div className="segmented">
              {(['black', 'white'] as const).map((p) => (
                <button key={p} className={settings.human === p ? 'on' : ''} onClick={() => updateSettings({ human: p })}>
                  {p === 'black' ? '先手（黒）' : '後手（白）'}
                </button>
              ))}
            </div>
            <div className="segmented">
              {(['easy', 'normal', 'hard'] as const).map((l) => (
                <button key={l} className={settings.level === l ? 'on' : ''} onClick={() => updateSettings({ level: l })}>
                  {LEVEL_NAME[l]}
                </button>
              ))}
            </div>
          </>
        )}
        <p className="note">設定を変えると新しい対局になります。</p>
      </section>
    </main>
  )
}

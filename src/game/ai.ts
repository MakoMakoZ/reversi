// CPU の思考。ミニマックス法 + αβ枝刈り。

import { applyMove, type Board, countStones, legalMoves, opponent, type Player } from './board'

export type Level = 'easy' | 'normal' | 'hard'

const DEPTH: Record<Level, number> = { easy: 1, normal: 3, hard: 5 }

// 位置ごとの重み。角は強く、角の隣（X打ち・C打ち）は弱い。
const WEIGHTS = [
  120, -20, 20, 5, 5, 20, -20, 120,
  -20, -40, -5, -5, -5, -5, -40, -20,
  20, -5, 15, 3, 3, 15, -5, 20,
  5, -5, 3, 3, 3, 3, -5, 5,
  5, -5, 3, 3, 3, 3, -5, 5,
  20, -5, 15, 3, 3, 15, -5, 20,
  -20, -40, -5, -5, -5, -5, -40, -20,
  120, -20, 20, 5, 5, 20, -20, 120,
]

/** me から見た盤面の評価値 */
export function evaluate(board: Board, me: Player): number {
  const you = opponent(me)
  let score = 0
  for (let i = 0; i < board.length; i++) {
    if (board[i] === me) score += WEIGHTS[i]
    else if (board[i] === you) score -= WEIGHTS[i]
  }
  // 打てる手の多さ（着手可能数）も加味する
  score += 5 * (legalMoves(board, me).length - legalMoves(board, you).length)
  return score
}

function finalScore(board: Board, me: Player): number {
  const count = countStones(board)
  const diff = count[me] - count[opponent(me)]
  return diff * 10000
}

function search(
  board: Board,
  toMove: Player,
  me: Player,
  depth: number,
  alpha: number,
  beta: number,
): number {
  const moves = legalMoves(board, toMove)
  if (moves.length === 0) {
    if (legalMoves(board, opponent(toMove)).length === 0) return finalScore(board, me)
    // パス
    return search(board, opponent(toMove), me, depth, alpha, beta)
  }
  if (depth === 0) return evaluate(board, me)

  if (toMove === me) {
    let best = -Infinity
    for (const m of moves) {
      const v = search(applyMove(board, m, toMove)!, opponent(toMove), me, depth - 1, alpha, beta)
      best = Math.max(best, v)
      alpha = Math.max(alpha, v)
      if (alpha >= beta) break
    }
    return best
  }
  let best = Infinity
  for (const m of moves) {
    const v = search(applyMove(board, m, toMove)!, opponent(toMove), me, depth - 1, alpha, beta)
    best = Math.min(best, v)
    beta = Math.min(beta, v)
    if (alpha >= beta) break
  }
  return best
}

/** 最善手の添字を返す。打てる手がなければ null。 */
export function chooseMove(board: Board, me: Player, level: Level, random = Math.random): number | null {
  const moves = legalMoves(board, me)
  if (moves.length === 0) return null
  let bestScore = -Infinity
  let bestMoves: number[] = []
  for (const m of moves) {
    const v = search(applyMove(board, m, me)!, opponent(me), me, DEPTH[level] - 1, -Infinity, Infinity)
    if (v > bestScore) {
      bestScore = v
      bestMoves = [m]
    } else if (v === bestScore) {
      bestMoves.push(m)
    }
  }
  // 同点の手からはランダムに選び、毎回同じ展開にならないようにする
  return bestMoves[Math.floor(random() * bestMoves.length)]
}

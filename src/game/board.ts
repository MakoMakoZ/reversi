// リバーシの盤面ルール。UI に依存しない純粋な関数だけを置く。

export const SIZE = 8

export type Player = 'black' | 'white'
export type Cell = Player | null
/** 盤面は 64 要素の配列。添字 = row * 8 + col */
export type Board = readonly Cell[]

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
] as const

export const opponent = (p: Player): Player => (p === 'black' ? 'white' : 'black')

export const index = (row: number, col: number): number => row * SIZE + col

const inside = (row: number, col: number): boolean =>
  row >= 0 && row < SIZE && col >= 0 && col < SIZE

export function createInitialBoard(): Board {
  const board: Cell[] = Array(SIZE * SIZE).fill(null)
  board[index(3, 3)] = 'white'
  board[index(3, 4)] = 'black'
  board[index(4, 3)] = 'black'
  board[index(4, 4)] = 'white'
  return board
}

/** pos に player が置いたときに裏返る石の添字。置けないなら空配列。 */
export function flipsFor(board: Board, pos: number, player: Player): number[] {
  if (board[pos] !== null) return []
  const row = Math.floor(pos / SIZE)
  const col = pos % SIZE
  const enemy = opponent(player)
  const result: number[] = []
  for (const [dr, dc] of DIRECTIONS) {
    const line: number[] = []
    let r = row + dr
    let c = col + dc
    while (inside(r, c) && board[index(r, c)] === enemy) {
      line.push(index(r, c))
      r += dr
      c += dc
    }
    if (line.length > 0 && inside(r, c) && board[index(r, c)] === player) {
      result.push(...line)
    }
  }
  return result
}

export function legalMoves(board: Board, player: Player): number[] {
  const moves: number[] = []
  for (let pos = 0; pos < SIZE * SIZE; pos++) {
    if (flipsFor(board, pos, player).length > 0) moves.push(pos)
  }
  return moves
}

/** 石を置いた後の新しい盤面を返す。置けない手なら null。 */
export function applyMove(board: Board, pos: number, player: Player): Board | null {
  const flips = flipsFor(board, pos, player)
  if (flips.length === 0) return null
  const next = board.slice()
  next[pos] = player
  for (const f of flips) next[f] = player
  return next
}

export function countStones(board: Board): Record<Player, number> {
  let black = 0
  let white = 0
  for (const cell of board) {
    if (cell === 'black') black++
    else if (cell === 'white') white++
  }
  return { black, white }
}

export interface GameState {
  board: Board
  /** 次に打つ側。終局していれば null */
  turn: Player | null
  /** 直前に打てずにパスした側 */
  passed: Player | null
  lastMove: number | null
}

export function createInitialState(): GameState {
  return { board: createInitialBoard(), turn: 'black', passed: null, lastMove: null }
}

/** 手番を進める。相手に打つ手がなければパスし、両者とも打てなければ終局。 */
export function play(state: GameState, pos: number): GameState | null {
  if (state.turn === null) return null
  const board = applyMove(state.board, pos, state.turn)
  if (board === null) return null
  const next = opponent(state.turn)
  if (legalMoves(board, next).length > 0) {
    return { board, turn: next, passed: null, lastMove: pos }
  }
  if (legalMoves(board, state.turn).length > 0) {
    return { board, turn: state.turn, passed: next, lastMove: pos }
  }
  return { board, turn: null, passed: null, lastMove: pos }
}

export function winner(board: Board): Player | 'draw' {
  const { black, white } = countStones(board)
  if (black === white) return 'draw'
  return black > white ? 'black' : 'white'
}

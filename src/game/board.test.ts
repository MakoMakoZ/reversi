import { describe, expect, it } from 'vitest'
import {
  applyMove,
  type Board,
  type Cell,
  countStones,
  createInitialBoard,
  createInitialState,
  index,
  legalMoves,
  play,
  winner,
} from './board'
import { chooseMove } from './ai'

/** 'B' 'W' '.' の 8 行文字列から盤面を作る */
function parse(rows: string[]): Board {
  return rows.join('').split('').map((ch): Cell => (ch === 'B' ? 'black' : ch === 'W' ? 'white' : null))
}

describe('初期盤面', () => {
  it('中央に 2 個ずつ置かれている', () => {
    expect(countStones(createInitialBoard())).toEqual({ black: 2, white: 2 })
  })

  it('黒の合法手は 4 つ', () => {
    expect(legalMoves(createInitialBoard(), 'black').sort((a, b) => a - b)).toEqual(
      [index(2, 3), index(3, 2), index(4, 5), index(5, 4)].sort((a, b) => a - b),
    )
  })
})

describe('石を置く', () => {
  it('挟んだ石が裏返る', () => {
    const next = applyMove(createInitialBoard(), index(2, 3), 'black')!
    expect(next[index(3, 3)]).toBe('black')
    expect(countStones(next)).toEqual({ black: 4, white: 1 })
  })

  it('置けないマスには置けない', () => {
    expect(applyMove(createInitialBoard(), index(0, 0), 'black')).toBeNull()
    expect(applyMove(createInitialBoard(), index(3, 3), 'black')).toBeNull()
  })

  it('複数方向を同時に裏返す', () => {
    const board = parse([
      'B.B.....',
      '.WW.....',
      'BW......',
      '........',
      '........',
      '........',
      '........',
      '........',
    ])
    // (2,2) に置くと 上(1,2)・左(2,1)・左上(1,1) が裏返る
    const next = applyMove(board, index(2, 2), 'black')!
    expect(next[index(1, 2)]).toBe('black')
    expect(next[index(2, 1)]).toBe('black')
    expect(next[index(1, 1)]).toBe('black')
  })

  it('盤の端をまたいで裏返さない', () => {
    const board = parse([
      '.......W',
      'B.......',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
    ])
    // (0,6) の右は (0,7)=白 で盤外へ。行をまたいで (1,0) の黒と挟んだことにはならない
    expect(applyMove(board, index(0, 6), 'black')).toBeNull()
  })
})

describe('手番の進行', () => {
  it('打つと手番が相手に移る', () => {
    const s = play(createInitialState(), index(2, 3))!
    expect(s.turn).toBe('white')
    expect(s.lastMove).toBe(index(2, 3))
  })

  it('相手が打てなければパスして同じ手番が続く', () => {
    const state = {
      board: parse([
        'BW......',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '......WB',
      ]),
      turn: 'black' as const,
      passed: null,
      lastMove: null,
    }
    // 黒 (0,2) の後、白は (7,6) しか残らず打てない。黒は (7,5) に打てる
    const s = play(state, index(0, 2))!
    expect(s.turn).toBe('black')
    expect(s.passed).toBe('white')
  })

  it('両者とも打てなければ終局', () => {
    const state = {
      board: parse([
        'BW......',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
      ]),
      turn: 'black' as const,
      passed: null,
      lastMove: null,
    }
    // 黒 (0,2) で白が消え、どちらも打てなくなる
    const s = play(state, index(0, 2))!
    expect(s.turn).toBeNull()
    expect(winner(s.board)).toBe('black')
  })
})

describe('CPU', () => {
  it('角が取れるなら角を取る', () => {
    const board = parse([
      '........',
      '.W......',
      '..B.....',
      '........',
      '........',
      '........',
      '........',
      '........',
    ])
    expect(chooseMove(board, 'black', 'normal')).toBe(index(0, 0))
  })

  it('打てる手がなければ null', () => {
    const board = parse(['B'.repeat(8), ...Array(7).fill('........')])
    expect(chooseMove(board, 'white', 'hard')).toBeNull()
  })

  it('CPU 同士で最後まで対局できる', () => {
    let s = createInitialState()
    let guard = 0
    while (s.turn !== null && guard++ < 100) {
      const m = chooseMove(s.board, s.turn, 'easy', () => 0)!
      s = play(s, m)!
    }
    expect(s.turn).toBeNull()
    const { black, white } = countStones(s.board)
    expect(black + white).toBeGreaterThan(4)
  })
})

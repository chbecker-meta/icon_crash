export const SIZE = 10

export type ShipSpec = { name: string; size: number }

export const SHIPS: ShipSpec[] = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
]

export type Ship = { name: string; size: number; cells: number[] }

export type Board = {
  ships: Ship[]
  hits: Set<number>
  misses: Set<number>
}

export type FireResult = "hit" | "miss" | "sunk" | "repeat"

export function idx(row: number, col: number): number {
  return row * SIZE + col
}

export function rowOf(i: number): number {
  return Math.floor(i / SIZE)
}

export function colOf(i: number): number {
  return i % SIZE
}

/** Convert a cell index to notation like "A1" (column letter + row number). */
export function toNotation(i: number): string {
  return String.fromCharCode(65 + colOf(i)) + (rowOf(i) + 1)
}

function shipCells(row: number, col: number, size: number, vertical: boolean): number[] | null {
  const cells: number[] = []
  for (let i = 0; i < size; i++) {
    const r = vertical ? row + i : row
    const c = vertical ? col : col + i
    if (r >= SIZE || c >= SIZE) return null
    cells.push(idx(r, c))
  }
  return cells
}

/** Randomly place every ship on a fresh board with no overlaps. */
export function placeShips(rand: () => number = Math.random): Ship[] {
  const ships: Ship[] = []
  const occupied = new Set<number>()

  for (const spec of SHIPS) {
    let placed = false
    while (!placed) {
      const vertical = rand() < 0.5
      const row = Math.floor(rand() * SIZE)
      const col = Math.floor(rand() * SIZE)
      const cells = shipCells(row, col, spec.size, vertical)
      if (cells && !cells.some((c) => occupied.has(c))) {
        for (const c of cells) occupied.add(c)
        ships.push({ name: spec.name, size: spec.size, cells })
        placed = true
      }
    }
  }
  return ships
}

export function createBoard(rand: () => number = Math.random): Board {
  return { ships: placeShips(rand), hits: new Set(), misses: new Set() }
}

export function isSunk(board: Board, ship: Ship): boolean {
  return ship.cells.every((c) => board.hits.has(c))
}

export function shipAt(board: Board, cell: number): Ship | undefined {
  return board.ships.find((s) => s.cells.includes(cell))
}

export function allSunk(board: Board): boolean {
  return board.ships.every((s) => isSunk(board, s))
}

export function remainingShips(board: Board): string[] {
  return board.ships.filter((s) => !isSunk(board, s)).map((s) => s.name)
}

/**
 * Fire at a cell. Mutates a copied board is the caller's job; this returns a
 * new board plus the result so React state stays immutable.
 */
export function fire(board: Board, cell: number): { board: Board; result: FireResult; sunkShip?: Ship } {
  if (board.hits.has(cell) || board.misses.has(cell)) {
    return { board, result: "repeat" }
  }

  const next: Board = {
    ships: board.ships,
    hits: new Set(board.hits),
    misses: new Set(board.misses),
  }

  const ship = shipAt(board, cell)
  if (!ship) {
    next.misses.add(cell)
    return { board: next, result: "miss" }
  }

  next.hits.add(cell)
  if (isSunk(next, ship)) {
    return { board: next, result: "sunk", sunkShip: ship }
  }
  return { board: next, result: "hit" }
}

"use client"

import { useMemo, useState } from "react"
import { type Board, SIZE, allSunk, createBoard, fire, remainingShips, shipAt, toNotation } from "@/lib/battleship"

type Status = "playing" | "won"

type Shot = { cell: number; result: string }

export function BattleshipGame() {
  const [board, setBoard] = useState<Board>(() => createBoard())
  const [status, setStatus] = useState<Status>("playing")
  const [message, setMessage] = useState("Fire at the enemy grid to find and sink the fleet.")
  const [lastShot, setLastShot] = useState<Shot | null>(null)
  const [shots, setShots] = useState(0)

  const remaining = useMemo(() => remainingShips(board), [board])

  function handleFire(cell: number) {
    if (status !== "playing") return
    if (board.hits.has(cell) || board.misses.has(cell)) return

    const { board: next, result, sunkShip } = fire(board, cell)
    setBoard(next)
    setShots((s) => s + 1)
    setLastShot({ cell, result: sunkShip ? "sunk" : result })

    if (allSunk(next)) {
      setStatus("won")
      setMessage(`Victory! Entire fleet sunk in ${shots + 1} shots.`)
    } else if (result === "sunk" && sunkShip) {
      setMessage(`You sank the enemy ${sunkShip.name}!`)
    } else if (result === "hit") {
      setMessage("Direct hit!")
    } else {
      setMessage("Splash — a miss.")
    }
  }

  function reset() {
    setBoard(createBoard())
    setStatus("playing")
    setMessage("Fire at the enemy grid to find and sink the fleet.")
    setLastShot(null)
    setShots(0)
  }

  const cells = []
  const sunkCells = new Set<number>()
  for (const ship of board.ships) {
    if (ship.cells.every((c) => board.hits.has(c))) {
      for (const c of ship.cells) sunkCells.add(c)
    }
  }

  for (let i = 0; i < SIZE * SIZE; i++) {
    const isHit = board.hits.has(i)
    const isMiss = board.misses.has(i)
    const isSunkCell = sunkCells.has(i)
    const fireable = status === "playing" && !isHit && !isMiss

    let cls = "bs-cell"
    if (isSunkCell) cls += " sunk"
    else if (isHit) cls += " hit"
    else if (isMiss) cls += " miss"
    if (fireable) cls += " fireable"

    cells.push(
      <button
        key={i}
        type="button"
        className={cls}
        data-cell={i}
        disabled={!fireable}
        aria-label={`Cell ${toNotation(i)}${isHit ? ", hit" : isMiss ? ", miss" : ""}`}
        onClick={() => handleFire(i)}
      />,
    )
  }

  const lastText = lastShot ? ` (last: ${toNotation(lastShot.cell)} → ${lastShot.result})` : ""

  return (
    <main className="bs-app">
      <header className="bs-header">
        <h1 className="bs-title">Battleship</h1>
        <p className="bs-subtitle">Single-player • sink all 5 enemy ships</p>
      </header>

      <section className="bs-board-wrap" aria-label="Enemy board">
        <div className="bs-grid" style={{ ["--size" as string]: String(SIZE) }}>
          {cells}
        </div>
      </section>

      <p className="bs-status" role="status">
        {status === "won" ? message : message + lastText}
      </p>

      <div className="bs-footer">
        <span className="bs-remaining">
          {remaining.length > 0 ? `Afloat: ${remaining.join(", ")}` : "All ships sunk"}
        </span>
        <button type="button" className="bs-reset" onClick={reset}>
          New game
        </button>
      </div>
    </main>
  )
}

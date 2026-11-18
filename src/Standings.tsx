import {useState} from 'react'

import {type Messages} from './language'
import {countWins, individualFinalists, teamChampions, type Tournament} from './tournament'

const columns = [
  'rank', 'name', 'wins', 'losses', 'skipped', 'status',
] as const
type Column = typeof columns[number]
type Direction = 'ascending' | 'descending'

export function Standings({tournament, text}: {tournament: Tournament; text: Messages}) {
  const [sort, setSort] = useState<{column: Column; direction: Direction}>({column: 'rank', direction: 'ascending'})
  const wins = countWins(tournament.players.length, tournament.rounds)
  const skipped = tournament.players.map(() => 0)
  for (const round of tournament.rounds) {
    if (!round.winners) continue
    for (const id of round.byes.flat()) skipped[id]++
  }
  const current = tournament.rounds.at(-1)
  const finalists = current?.stage === 'final' ? current.matches[0].flat() : []
  const contenders = current?.stage === 'sudden-death' ? current.matches[0].flat() : []
  const champions = teamChampions(tournament)
  const [individualWinner, individualRunnerUp] = individualFinalists(tournament)

  const ranked = tournament.players.map((name, id) => ({
    id, name, wins: wins[id], losses: tournament.losses[id], skipped: skipped[id],
    champion: champions.includes(id) || id === individualWinner,
    runnerUp: id === individualRunnerUp,
    finalist: finalists.includes(id),
    contender: contenders.includes(id),
    out: finalists.length > 0 ? !finalists.includes(id) : tournament.losses[id] >= tournament.lossLimit,
  }))
  const compareRank = (a: typeof ranked[number], b: typeof ranked[number]) =>
    Number(b.champion) - Number(a.champion) || (a.champion && b.champion ? 0
      : Number(b.runnerUp) - Number(a.runnerUp) || Number(a.out) - Number(b.out) || b.wins - a.wins || a.losses - b.losses)
  ranked.sort((a, b) => compareRank(a, b) || a.name.localeCompare(b.name) || a.id - b.id)

  let rank = 0
  const rows = ranked.map((player, index) => {
    if (index === 0 || compareRank(player, ranked[index - 1]) !== 0) rank = index + 1
    if (player.champion) return {...player, rank, status: text.champion}
    if (player.runnerUp) return {...player, rank, status: text.runnerUp}
    return {...player, rank, status: player.finalist ? (tournament.finished ? text.runnerUp : text.finalist)
      : player.contender ? text.suddenDeath : player.out ? text.out : text.in}
  })
  rows.sort((a, b) => {
    const first = a[sort.column]
    const second = b[sort.column]
    const comparison = typeof first === 'number' && typeof second === 'number'
      ? first - second : String(first).localeCompare(String(second))
    return comparison * (sort.direction === 'ascending' ? 1 : -1) || a.rank - b.rank || a.name.localeCompare(b.name)
  })

  function sortBy(column: Column) {
    setSort(previous => ({
      column,
      direction: previous.column === column
        ? (previous.direction === 'ascending' ? 'descending' : 'ascending')
        : (column === 'wins' || column === 'skipped' ? 'descending' : 'ascending'),
    }))
  }

  return (
    <div className="standings-scroll">
    <table className="standings" aria-labelledby="standings-heading" aria-describedby="standings-help">
      <thead><tr>{columns.map(key => (
        <th key={key} scope="col" aria-sort={sort.column === key ? sort.direction : undefined}>
          <button type="button" onClick={() => sortBy(key)}>
            {text[key]}{sort.column === key && <span aria-hidden="true">{sort.direction === 'ascending' ? ' ↑' : ' ↓'}</span>}
          </button>
        </th>
      ))}</tr></thead>
      <tbody>{rows.map(player => (
        <tr key={player.id}>
          <td>{player.rank}</td><th scope="row">{player.name}</th>
          <td>{player.wins}</td><td>{player.losses}</td><td>{player.skipped}</td><td>{player.status}</td>
        </tr>
      ))}</tbody>
    </table>
    </div>
  )
}

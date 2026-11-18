import {duplicateNames, hasMarkupDelimiters} from './pairing.ts'

export type Pair = [number, number]
export type GameMode = 'individuals' | 'teams'
export type Side = [number] | Pair
type ByeGroup = Side | [number, number, number]
export type Match = [Side, Side]
export type Winner = 0 | 1

export type TournamentRound = {
  stage?: 'sudden-death' | 'final' | 'individual-final'
  matches: Match[]
  byes: ByeGroup[]
  winners?: Winner[]
}

export type Tournament = {
  players: readonly string[]
  mode: GameMode
  rounds: TournamentRound[]
  lossLimit: number
  losses: number[]
  finished: boolean
}

export function playersPerMatch(mode: GameMode): number {
  return mode === 'teams' ? 4 : 2
}

export function countWins(playerCount: number, rounds: readonly TournamentRound[]): number[] {
  const wins = Array<number>(playerCount).fill(0)
  for (const round of rounds) {
    round.winners?.forEach((winner, index) => {
      for (const id of round.matches[index][winner]) wins[id]++
    })
  }
  return wins
}

export function teamChampions(tournament: Tournament): readonly number[] {
  const last = tournament.rounds.at(-1)
  return last?.stage === 'final' && last.winners ? last.matches[0][last.winners[0]] : []
}

export function individualFinalists(tournament: Tournament): number[] {
  if (!tournament.finished || tournament.mode !== 'individuals') return []
  const last = tournament.rounds.at(-1)
  if (!last?.winners) return []
  const match = last.matches[0]
  const winner = last.winners[0]
  return [match[winner][0], match[1 - winner][0]]
}

export function tournamentPodium(tournament: Tournament): number[][] {
  if (!tournament.finished) return []

  const {players, rounds, losses, lossLimit} = tournament
  const last = rounds.at(-1)
  if (tournament.mode === 'teams') {
    if (!last?.winners) return []
    const results = last.winners
    return [
      last.matches.flatMap((match, index) => match[results[index]]),
      last.matches.flatMap((match, index) => match[1 - results[index]]),
    ]
  }
  const wins = countWins(players.length, rounds)
  const ranked = players.map((_, id) => id).sort((a, b) =>
    Number(losses[a] >= lossLimit) - Number(losses[b] >= lossLimit) ||
    wins[b] - wins[a] || losses[a] - losses[b] || players[a].localeCompare(players[b]) || a - b,
  )
  const finalists = individualFinalists(tournament)
  return [...finalists, ...ranked.filter(id => !finalists.includes(id))].slice(0, 3).map(id => [id])
}

export function reopenLatestRound(tournament: Tournament): Tournament {
  const index = tournament.rounds.length - (tournament.rounds.at(-1)?.winners ? 1 : 2)
  const round = tournament.rounds[index]
  if (!round?.winners) return tournament

  const losses = [...tournament.losses]
  round.winners.forEach((winner, match) => {
    for (const id of round.matches[match][1 - winner]) losses[id]--
  })
  const {winners: _winners, ...reopened} = round
  return {...tournament, losses, finished: false, rounds: [...tournament.rounds.slice(0, index), reopened]}
}

export function startTournament(players: readonly string[], mode: GameMode, lossLimit: number, random = Math.random): Tournament {
  if (hasMarkupDelimiters(players)) throw new Error('Player names cannot contain < or >.')
  if (duplicateNames(players).length > 0) throw new Error('Each player must have a unique name.')
  const matchSize = playersPerMatch(mode)
  if (players.length < matchSize) throw new Error(`Add at least ${matchSize} players for this setup.`)
  if (!Number.isSafeInteger(lossLimit) || lossLimit < 1) {
    throw new Error('Enter a loss limit of at least 1.')
  }
  const playerIds = players.map((_, id) => id)
  const losses = playerIds.map(() => 0)
  return {
    players: [...players], mode, lossLimit, losses, finished: false,
    rounds: [drawRound(playerIds, mode, [], random)],
  }
}

export function completeRound(tournament: Tournament, winners: Winner[], random = Math.random): Tournament {
  const current = tournament.rounds.at(-1)
  if (tournament.finished || !current || current.winners) throw new Error('There is no open round to complete.')
  if (winners.length !== current.matches.length) throw new Error('Select a winner for every match.')

  const losses = [...tournament.losses]
  for (const [index, winner] of winners.entries()) {
    if (winner !== 0 && winner !== 1) throw new Error('Select a winner for every match.')
    for (const id of current.matches[index][1 - winner]) losses[id]++
  }
  const rounds = [...tournament.rounds.slice(0, -1), {...current, winners: [...winners]}]
  const eligible = losses.flatMap((loss, id) => loss < tournament.lossLimit ? [id] : [])
  if (current.stage === 'final' || current.stage === 'individual-final') {
    return {...tournament, rounds, losses, finished: true}
  }

  if (current.stage === 'sudden-death') {
    const qualifier = current.matches[0][winners[0]][0]
    const final = drawRound([...eligible, qualifier], 'teams', rounds.slice(0, -1), random)
    rounds.push({...final, stage: 'final'})
    return {...tournament, rounds, losses, finished: false}
  }

  if (tournament.mode === 'teams' && eligible.length === 3) {
    const wins = countWins(tournament.players.length, rounds)
    const [first, second] = losses.flatMap((loss, id) => loss >= tournament.lossLimit ? [id] : [])
      .sort((a, b) => wins[b] - wins[a] || losses[a] - losses[b] ||
        tournament.players[a].localeCompare(tournament.players[b]) || a - b)
    if (second !== undefined) {
      rounds.push({stage: 'sudden-death', matches: [[[first], [second]]], byes: []})
      return {...tournament, rounds, losses, finished: false}
    }
    if (first !== undefined) {
      rounds.push({...drawRound([...eligible, first], 'teams', rounds, random), stage: 'final'})
      return {...tournament, rounds, losses, finished: false}
    }
  }

  const finished = eligible.length < playersPerMatch(tournament.mode)
  if (!finished) rounds.push(drawRound(eligible, tournament.mode, rounds, random))
  return {...tournament, rounds, losses, finished}
}

export function drawRound(playerIds: number[], mode: GameMode, rounds: readonly TournamentRound[], random = Math.random): TournamentRound {
    const matchSize = playersPerMatch(mode)
    const previous = rounds.at(-1)
    const byeCounts = new Map<number, number>()
    for (const round of rounds) {
      for (const side of round.byes) {
        for (const id of side) byeCounts.set(id, (byeCounts.get(id) ?? 0) + 1)
      }
    }
    const shuffled = [...playerIds]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const returning = new Set(previous?.byes.flat())
    const sittingOut = shuffled
      .filter(id => !returning.has(id))
      .sort((a, b) => (byeCounts.get(a) ?? 0) - (byeCounts.get(b) ?? 0))
      .slice(0, playerIds.length % matchSize)
    const byeIds = new Set(sittingOut)
    const active = shuffled.filter(id => !byeIds.has(id))
    const byes: ByeGroup[] = []
    if (sittingOut.length === 3) byes.push([sittingOut[0], sittingOut[1], sittingOut[2]])
    else if (sittingOut.length === 2) byes.push([sittingOut[0], sittingOut[1]])
    else if (sittingOut.length === 1) byes.push([sittingOut[0]])

    const pairs: Pair[] = []
    for (let i = 0; i < active.length; i += 2) pairs.push([active[i], active[i + 1]])

    if (previous && pairs.length > 1) {
      const oldPartners = new Map<number, number>()
      const previousPairs = mode === 'teams'
        ? [...previous.matches.flat(), ...previous.byes.filter(group => group.length === 2)]
        : previous.matches.map(([a, b]): Pair => [a[0], b[0]])
      for (const [a, b] of previousPairs) {
        if (b === undefined) continue
        oldPartners.set(a, b)
        oldPartners.set(b, a)
      }
      for (let i = 0; i < pairs.length; i++) {
        const [a, b] = pairs[i]
        if (oldPartners.get(a) !== b) continue
        // A repeated pair can split across any other pair: neither player can repeat with a third person.
        const j = (i + 1) % pairs.length
        const [c, d] = pairs[j]
        pairs[i] = [a, c]
        pairs[j] = [b, d]
      }
    }

    const matches: Match[] = []
    if (mode === 'teams') {
      for (let i = 0; i < pairs.length; i += 2) matches.push([pairs[i], pairs[i + 1]])
    } else {
      for (const [a, b] of pairs) matches.push([[a], [b]])
    }
    return mode === 'individuals' && playerIds.length === 2
      ? {matches, byes, stage: 'individual-final'}
      : {matches, byes}
}

import assert from 'node:assert/strict'
import {test} from 'node:test'

import {completeRound, drawRound, reopenLatestRound, startTournament, teamChampions, tournamentPodium} from '../src/tournament.ts'

const fixed = () => 0.99

test('validates setup and requires a valid winner for each match', () => {
  assert.throws(() => startTournament(['Alex', 'Sam', 'Jordan'], 'teams', 1), /at least 4/)
  assert.throws(() => startTournament(['Alex', 'Sam'], 'individuals', 0), /loss limit/)
  const tournament = startTournament(['Alex', 'Sam'], 'individuals', 1)
  assert.throws(() => completeRound(tournament, []), /every match/)
  for (const winner of [undefined, -1, 2]) {
    assert.throws(() => completeRound(tournament, [winner]), /winner for every match/)
  }
  assert.deepEqual(tournament.losses, [0, 0])
})

test('player names with HTML delimiters are rejected in both game modes', () => {
  for (const mode of ['individuals', 'teams']) {
    assert.throws(() => startTournament(['<b>Alex</b>', 'Sam', 'Jordan', 'Mika'], mode, 1), /cannot contain/)
    assert.doesNotThrow(() => startTournament(['Alex & Co.', "Sam O’Neil", 'Jørgen', 'Mika'], mode, 1))
  }
})

test('duplicate player names block both game modes', () => {
  for (const mode of ['individuals', 'teams']) {
    assert.throws(() => startTournament(['Alex Lee', ' alex  lee ', 'Jordan', 'Sam'], mode, 1), /unique name/)
    assert.doesNotThrow(() => startTournament(['Alex Lee', 'Alex Kim', 'Jordan', 'Sam'], mode, 1))
  }
})

test('an individual is eliminated only at the limit and winners are retained', () => {
  const roster = ['Alex', 'Sam', 'Jordan']
  const first = completeRound(startTournament(roster, 'individuals', 2, fixed), [0], fixed)
  assert.deepEqual(first.losses, [0, 0, 1])
  assert.equal(first.finished, false)
  const second = completeRound(first, [0], fixed)
  assert.deepEqual(second.losses, [0, 0, 2])
  assert.equal(second.rounds.at(-1).stage, 'individual-final')
  const final = completeRound(second, [1], fixed)
  assert.deepEqual(final.losses, [1, 0, 2])
  assert.deepEqual(final.rounds.map(round => round.winners), [[0], [0], [1]])
  assert.equal(final.finished, true)
  assert.throws(() => completeRound(final, [1]), /no open round/)
})

test('a two-player individual tournament starts with a single deciding final', () => {
  const first = startTournament(['Alex', 'Sam'], 'individuals', 3, fixed)
  assert.equal(first.rounds[0].stage, 'individual-final')
  const finished = completeRound(first, [1], fixed)
  assert.equal(finished.finished, true)
  assert.equal(finished.rounds.length, 1)
  assert.deepEqual(finished.losses, [1, 0])
  assert.deepEqual(tournamentPodium(finished), [[1], [0]])
})

test('both losing teammates are eliminated while the bye pair returns without a loss', () => {
  const roster = ['Alex', 'Sam', 'Jordan', 'Mika', 'Avery', 'Lee']
  const tournament = startTournament(roster, 'teams', 1, fixed)
  const {byes, matches: [[winners, losers]]} = tournament.rounds[0]
  assert.equal(byes[0].length, 2)
  const next = completeRound(tournament, [0], fixed)
  const playing = next.rounds[1].matches.flat(2)
  for (const id of [...winners, ...byes.flat()]) {
    assert.equal(next.losses[id], 0)
    assert.ok(playing.includes(id))
  }
  for (const id of losers) {
    assert.equal(next.losses[id], 1)
    assert.ok(!playing.includes(id))
  }
  assert.equal(completeRound(next, [0], fixed).finished, true)
})

for (const [mode, size] of [['individuals', 2], ['teams', 4]]) {
  test(`${mode}: fills matches and guarantees previous bye players a match`, () => {
    for (let count = size; count < size * 3; count++) {
      const roster = Array.from({length: count}, (_, id) => id)
      const first = drawRound(roster, mode, [], fixed)
      const second = drawRound(roster, mode, [first], fixed)
      const active = second.matches.flat(2)
      assert.equal(second.matches.length, Math.floor(count / size))
      assert.equal(second.byes.flat().length, count % size)
      if (mode === 'teams' && count % size === 3) {
        assert.deepEqual(first.byes.map(group => group.length), [3])
        assert.deepEqual(second.byes.map(group => group.length), [3])
      }
      assert.deepEqual([...active, ...second.byes.flat()].sort((a, b) => a - b), roster)
      for (const player of first.byes.flat()) assert.ok(active.includes(player))
    }
  })
}

test('three eligible players trigger a playoff for the two highest-ranked eliminated players', () => {
  const first = startTournament(['A', 'B', 'C', 'D', 'E', 'F', 'G'], 'teams', 1, fixed)
  const second = completeRound(first, [0], fixed)
  const playoff = completeRound(second, [0], fixed)
  assert.equal(playoff.finished, false)
  assert.equal(playoff.rounds.at(-1).stage, 'sudden-death')
  assert.deepEqual(playoff.rounds.at(-1).matches, [[[4], [2]]])
  const final = completeRound(playoff, [1], fixed)
  const match = final.rounds.at(-1).matches[0]
  assert.equal(final.rounds.at(-1).stage, 'final')
  assert.deepEqual(match.flat().sort(), [0, 1, 2, 3])
  const winner = match[0].includes(2) ? 0 : 1
  const finished = completeRound(final, [winner], fixed)
  assert.equal(finished.finished, true)
  assert.deepEqual(teamChampions(finished), match[winner])
  assert.deepEqual(tournamentPodium(finished), [match[winner], match[1 - winner]])
  assert.equal(finished.losses[2], 1)
})

test('reopening the latest result restores losses and keeps its original draw', () => {
  const first = startTournament(['A', 'B', 'C', 'D', 'E', 'F'], 'teams', 1, fixed)
  const next = completeRound(first, [0], fixed)
  const reopened = reopenLatestRound(next)
  assert.deepEqual(reopened, first)

  const corrected = completeRound(reopened, [1], fixed)
  assert.notDeepEqual(corrected.losses, next.losses)
  assert.notDeepEqual(corrected.rounds[1].matches.flat(2).sort(), next.rounds[1].matches.flat(2).sort())
  const finished = completeRound(corrected, [0], fixed)
  const [winner, loser] = finished.rounds.at(-1).matches[0]
  assert.deepEqual(tournamentPodium(finished), [winner, loser])
  assert.deepEqual(reopenLatestRound(finished), corrected)
})

test('the only eliminated player fills the fourth final spot directly', () => {
  const first = startTournament(['A', 'B', 'C', 'D'], 'teams', 2, fixed)
  const second = completeRound(first, [0], fixed)
  const final = completeRound(second, [0], fixed)
  assert.equal(final.rounds.at(-1).stage, 'final')
  assert.deepEqual(final.rounds.at(-1).matches.flat(2).sort(), [0, 1, 2, 3])
  assert.equal(completeRound(final, [0], fixed).finished, true)
})

import {type FormEvent, useEffect, useRef, useState} from 'react'

import {duplicateNames, hasMarkupDelimiters, parseNames} from './pairing'
import {messages, roundTitle, type Language} from './language'
import {Standings} from './Standings'
import {useTournamentMutation} from './state/queries/pairing'
import TournamentSchedule from './TournamentSchedule'
import {individualFinalists, playersPerMatch, reopenLatestRound, teamChampions, type GameMode, type Winner, type Tournament} from './tournament'

export function App() {
  const [language, setLanguage] = useState<Language>(() => {
    try { return localStorage.getItem('pair-draw-language') === 'da' ? 'da' : 'en' } catch { return 'en' }
  })
  const text = messages[language]
  useEffect(() => {
    document.documentElement.lang = language
    try { localStorage.setItem('pair-draw-language', language) } catch { /* Storage is optional. */ }
  }, [language])
  const [draft, setDraft] = useState('')
  const [lossLimit, setLossLimit] = useState('2')
  const [mode, setMode] = useState<GameMode>('individuals')
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [selectedWinners, setSelectedWinners] = useState<Partial<Record<number, Winner>>>({})
  const [dialogMode, setDialogMode] = useState<'review' | 'edit'>('review')
  const dialog = useRef<HTMLDialogElement>(null)
  const action = useTournamentMutation(result => {
    setTournament(result)
    setSelectedWinners({})
  })
  const names = parseNames(draft)
  const duplicates = duplicateNames(names)
  const namesError = hasMarkupDelimiters(names) ? text.markupInNames
    : duplicates.length > 0 ? text.duplicates(duplicates) : undefined
  const minimum = playersPerMatch(mode)
  const limit = Number(lossLimit)
  const canStart = !namesError && names.length >= minimum && Number.isSafeInteger(limit) && limit >= 1
  const currentRound = tournament?.rounds.at(-1)
  const latestCompleted = currentRound?.winners ? currentRound : tournament?.rounds.at(-2)
  const winners = currentRound?.matches.map((_, index) => selectedWinners[index]) ?? []
  const hasAllWinners = winners.length > 0 && winners.every(winner => winner !== undefined)
  const remaining = tournament?.losses.filter(loss => loss < tournament.lossLimit).length ?? 0
  const champions = tournament ? teamChampions(tournament) : []

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canStart || action.isPending || tournament) return
    action.mutate({type: 'start', names, mode, lossLimit: limit})
  }

  function reviewResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!tournament || tournament.finished || !hasAllWinners || action.isPending) return
    openDialog('review')
  }

  function openDialog(mode: 'review' | 'edit') {
    setDialogMode(mode)
    dialog.current?.showModal()
  }

  function confirmDialog() {
    dialog.current?.close()
    if (!tournament || action.isPending) return
    if (dialogMode === 'edit' && latestCompleted?.winners) {
      setTournament(reopenLatestRound(tournament))
      setSelectedWinners({...latestCompleted.winners})
      action.reset()
      return
    }
    if (dialogMode !== 'review' || tournament.finished || !hasAllWinners) return
    action.mutate({type: 'complete', tournament, winners})
  }

  return (
    <main className="page">
      <header className="intro">
        <div className="section-heading">
          <div className="draw-mark" aria-hidden="true"><i /><i /></div>
          <div className="language-switch" role="group" aria-label={language === 'da' ? 'Sprog' : 'Language'}>
            <button type="button" lang="en" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>
              <svg aria-hidden="true" viewBox="0 0 30 20" width="21" height="14">
                <path fill="#012169" d="M0 0h30v20H0z" />
                <path stroke="#fff" strokeWidth="4" d="m0 0 30 20M30 0 0 20" />
                <path stroke="#c8102e" strokeWidth="1.5" d="m0 0 30 20M30 0 0 20" />
                <path stroke="#fff" strokeWidth="7" d="M15 0v20M0 10h30" />
                <path stroke="#c8102e" strokeWidth="4" d="M15 0v20M0 10h30" />
              </svg> English
            </button>
            <button type="button" lang="da" aria-pressed={language === 'da'} onClick={() => setLanguage('da')}>
              <svg aria-hidden="true" viewBox="0 0 30 20" width="21" height="14">
                <path fill="#c8102e" d="M0 0h30v20H0z" />
                <path stroke="#fff" strokeWidth="3" d="M10 0v20M0 10h30" />
              </svg> Dansk
            </button>
          </div>
        </div>
        <h1>Pair Draw</h1>
        <p>{text.intro}</p>
      </header>

      <div className="workspace">
        {tournament ? (
          <section className="roster" aria-labelledby="standings-heading">
            <div className="section-heading">
              <h2 id="standings-heading">{text.standings}</h2>
              <span className="count">{text.lossRule(tournament.lossLimit)}</span>
            </div>
            <p className="hint" id="standings-help">{text.standingsHelp}</p>
            <Standings tournament={tournament} text={text} />
            {tournament.finished && <button type="button" onClick={() => {setTournament(null); action.reset()}}>{text.newTournament}</button>}
          </section>
        ) : (
          <form className="roster" onSubmit={start}>
            <div className="section-heading">
              <h2><label htmlFor="names">{text.names}</label></h2>
              <span className="count">{text.people(names.length)}</span>
            </div>
            <p id="names-help" className="hint">{text.namesHelp}</p>
            <textarea id="names" aria-describedby={namesError ? 'names-help names-error' : 'names-help'} aria-invalid={Boolean(namesError)} placeholder={'Avery\nJordan\nSam'} rows={7}
              value={draft} onChange={event => setDraft(event.target.value)} />
            {namesError && <p className="hint" id="names-error" role="alert">{namesError}</p>}
            <fieldset className="game-setup">
              <legend>{text.gameSetup}</legend>
              <label><input type="radio" name="mode" checked={mode === 'individuals'} onChange={() => setMode('individuals')} /> {text.individuals}</label>
              <label><input type="radio" name="mode" checked={mode === 'teams'} onChange={() => setMode('teams')} /> {text.teams}</label>
            </fieldset>
            <div className="draw-controls">
              <label htmlFor="loss-limit">{text.lossLimit}</label>
              <input id="loss-limit" type="number" min="1" step="1" required
                value={lossLimit} onChange={event => setLossLimit(event.target.value)} />
              <button type="submit" disabled={!canStart || action.isPending}>{text.start}</button>
            </div>
          </form>
        )}

        <section className="results" aria-labelledby="round-heading">
          <h2 id="round-heading">{tournament?.finished ? text.tournamentComplete : tournament && currentRound ? roundTitle(text, currentRound, tournament.rounds.length) : text.firstRound}</h2>
          {tournament?.finished ? (
            <div role="status" className="empty">
              {tournament.mode === 'individuals' ? (
                <p><strong>{text.winner}:</strong> {tournament.players[individualFinalists(tournament)[0]]}</p>
              ) : champions.length > 0 ? (
                <p><strong>{text.champions}:</strong> {champions.map(id => tournament.players[id]).join(' & ')}</p>
              ) : (
                <p>{text.remaining(remaining)}</p>
              )}
            </div>
          ) : tournament && currentRound ? (
            <form onSubmit={reviewResults}>
              <p className="hint" id="winner-help">
                 {currentRound.stage === 'sudden-death' ? text.suddenDeathHelp
                   : currentRound.stage === 'final' ? text.teamFinalHelp
                     : currentRound.stage === 'individual-final' ? text.individualFinalHelp : text.winnerHelp}
              </p>
              <div className="result-matches">
                {currentRound.matches.map((match, index) => {
                  const winner = selectedWinners[index]
                  return (
                    <fieldset className="result-match" key={index} aria-describedby="winner-help" disabled={action.isPending}>
                      <legend>{text.match(index + 1)}</legend>
                      {match.map((side, sideIndex) => {
                        const choice = sideIndex === 0 ? 0 : 1
                        const name = side.map(id => tournament.players[id]).join(' & ')
                        return (
                          <label key={side[0]}>
                            <input type="radio" name={`winner-${index}`} required checked={winner === choice}
                              onChange={() => setSelectedWinners(previous => ({...previous, [index]: choice}))} />
                            <span>{name}</span>
                            {winner !== undefined && <small>{winner === choice ? text.won : text.lost}</small>}
                          </label>
                        )
                      })}
                    </fieldset>
                  )
                })}
              </div>
              {currentRound.byes.map(side => (
                <p className="carry-out" key={side[0]}><span>{text.bye(side.length)}</span><strong>{side.map(id => tournament.players[id]).join(side.length === 3 ? ', ' : ' & ')}</strong></p>
              ))}
              <button className="complete-round" type="submit" disabled={!hasAllWinners || action.isPending}>{text.completeRound}</button>
            </form>
          ) : (
            <p className="empty">{text.addPlayers(minimum)} <strong>{text.start}.</strong></p>
          )}
          {latestCompleted?.winners && (
            <button type="button" className="edit-round" disabled={action.isPending} onClick={() => openDialog('edit')}>{text.editRound}</button>
          )}
          {action.isError && <p role="alert">{language === 'en' ? action.error.message : text.actionError}</p>}
        </section>
      </div>
      {tournament && <TournamentSchedule tournament={tournament} text={text} />}
      <dialog ref={dialog} className="round-dialog" aria-labelledby="dialog-title" aria-describedby="dialog-description">
        <h2 id="dialog-title">{dialogMode === 'edit' ? text.reopenTitle : text.verifyResults}</h2>
        {dialogMode === 'edit' ? (
          <p id="dialog-description">{text.reopenHelp}</p>
        ) : (
          <>
            <p id="dialog-description">{text.verifyHelp}</p>
            <ol className="review-results">
              {tournament && currentRound?.matches.map((match, index) => {
                const winner = winners[index]
                if (winner === undefined) return null
                return (
                  <li key={index}>
                    <strong>{text.match(index + 1)}</strong>
                    <span>{text.won}: {match[winner].map(id => tournament.players[id]).join(' & ')}</span>
                    <span>{text.lost}: {match[1 - winner].map(id => tournament.players[id]).join(' & ')}</span>
                  </li>
                )
              })}
            </ol>
          </>
        )}
        <div className="dialog-actions">
          <button type="button" autoFocus onClick={() => dialog.current?.close()}>{dialogMode === 'edit' ? text.cancel : text.backToResults}</button>
          <button type="button" onClick={confirmDialog}>{dialogMode === 'edit' ? text.reopenRound : text.confirmResults}</button>
        </div>
      </dialog>
    </main>
  )
}

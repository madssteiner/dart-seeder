import {roundTitle, type Messages} from './language'
import {tournamentPodium, type Tournament} from './tournament'

export default function TournamentSchedule({tournament, text}: {tournament: Tournament; text: Messages}) {
  const {players, rounds, lossLimit} = tournament
  const losses = players.map(() => 0)
  const completed = rounds.filter(round => round.winners).length
  const podium = tournamentPodium(tournament)
  const podiumLabels = tournament.mode === 'teams' ? [text.winners, text.losers] : text.places
  const names = (ids: readonly number[], separator = ', ') => ids.map(id => players[id]).join(separator)

  return (
    <section className="tournament" aria-labelledby="tournament-heading">
      <div className="section-heading">
        <h2 id="tournament-heading">{text.timeline}</h2>
        <span className="count">{text.progress(completed, rounds.length)}</span>
      </div>
      <ol className="timeline" role="list" reversed>
        {tournament.finished && (
          <li className="timeline-entry">
            <article className="timeline-card podium-card" aria-labelledby="podium-heading">
              <h3 id="podium-heading">{text.podium}</h3>
              <dl className="podium-places">
                {podiumLabels.map((place, index) => (
                  <div key={place}>
                    <dt>{place}</dt>
                    <dd>{podium[index] ? names(podium[index], ' & ') : text.notAwarded}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </li>
        )}
        {rounds.map((round, index) => {
          const title = roundTitle(text, round, index + 1)
          const resting = round.byes.flat()
          const eliminated: number[] = []
          round.winners?.forEach((winner, match) => {
            for (const id of round.matches[match][1 - winner]) {
              if (++losses[id] === lossLimit && !round.stage) eliminated.push(id)
            }
          })

          return (
            <li className="timeline-entry" key={index} aria-current={round.winners ? undefined : 'step'}>
              <article className="timeline-card" aria-labelledby={`timeline-round-${index}`}>
                <header className="section-heading">
                  <h3 id={`timeline-round-${index}`}>{title}</h3>
                  <span className="timeline-status">{round.winners ? text.completed : text.inProgress}</span>
                </header>
                <dl className="round-stats">
                  <div><dt>{text.matches}</dt><dd>{round.matches.length}</dd></div>
                  <div><dt>{text.playing}</dt><dd>{round.matches.flat(2).length}</dd></div>
                  <div><dt>{text.sittingOut}</dt><dd>{resting.length}</dd></div>
                  <div><dt>{text.eliminated}</dt><dd>{round.winners ? eliminated.length : '—'}</dd></div>
                </dl>
                <ul className="timeline-matches" aria-label={text.roundMatches(title)}>
                  {round.matches.map(([first, second], match) => (
                    <li key={match}>
                      <span className={round.winners?.[match] === 0 ? 'winning-side' : undefined}>
                        {names(first, ' & ')}{round.winners && <small>{round.winners[match] === 0 ? text.won : text.lost}</small>}
                      </span>
                      <span className="versus">{text.versus}</span>
                      <span className={round.winners?.[match] === 1 ? 'winning-side' : undefined}>
                        {names(second, ' & ')}{round.winners && <small>{round.winners[match] === 1 ? text.won : text.lost}</small>}
                      </span>
                    </li>
                  ))}
                </ul>
                {resting.length > 0 && <p className="timeline-note"><strong>{text.satOut}:</strong> {names(resting)}</p>}
                {eliminated.length > 0 && <p className="timeline-note"><strong>{text.eliminated}:</strong> {names(eliminated)}</p>}
              </article>
            </li>
          )
        }).reverse()}
      </ol>
    </section>
  )
}

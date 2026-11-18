import {type TournamentRound} from './tournament'

export type Language = 'en' | 'da'

const en = {
  intro: 'Draw darts matches, pick the winners, and play until the loss limit decides who’s out.',
  standings: 'Standings', lossLimit: 'Loss limit',
  lossRule: (n: number) => `${n} ${n === 1 ? 'loss' : 'losses'} to go out`,
  standingsHelp: 'Rank puts players still in first, then sorts by most wins and fewest losses. Skipped counts completed rounds a player sat out. Select a column to sort.',
  newTournament: 'New tournament', names: 'Names',
  people: (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`,
  namesHelp: 'Enter one name per line.',
  markupInNames: 'Player names cannot contain < or >.',
  duplicates: (names: string[]) => `Use a unique name for each player. Duplicate ${names.length === 1 ? 'name' : 'names'}: ${names.join(', ')}.`,
  gameSetup: 'Game setup', individuals: 'Individuals (1 vs. 1)', teams: 'Teams (2 vs. 2)',
  start: 'Start tournament', tournamentComplete: 'Tournament complete', firstRound: 'First round',
  winner: 'Winner', champions: 'Champions',
  remaining: (n: number) => `${n} ${n === 1 ? 'player remains' : 'players remain'} eligible. Four are needed for another team match.`,
  suddenDeathHelp: 'The two highest-ranked eliminated players play for the last spot in the team final.',
  teamFinalHelp: 'Select the winning team to crown both players as champions.',
  individualFinalHelp: 'Select the winner. This match decides the tournament regardless of earlier losses.',
  winnerHelp: 'Select the winner of each finished match.',
  match: (n: number) => `Match ${n}`, won: 'Won', lost: 'Lost',
  bye: (n: number): string => n === 3 ? '3 players sit out' : n === 2 ? 'Team bye' : 'Sits out',
  completeRound: 'Complete round', addPlayers: (n: number) => `Add at least ${n} players, then select`,
  editRound: 'Edit latest completed round', reopenTitle: 'Reopen latest completed round?', verifyResults: 'Verify round results',
  reopenHelp: 'This rolls back the latest results and discards any next-round draw and selections. The original matchups and winner selections will be loaded for you to correct.',
  verifyHelp: 'Check the winner and loser of every match before saving.',
  cancel: 'Cancel', backToResults: 'Back to results', reopenRound: 'Reopen round', confirmResults: 'Confirm results',
  actionError: 'The tournament could not be updated. Check your selections and try again.',
  rank: 'Rank', name: 'Player', wins: 'Wins', losses: 'Losses', skipped: 'Skipped', status: 'Status',
  champion: 'Champion', runnerUp: 'Runner-up', finalist: 'Finalist', suddenDeath: 'Sudden death',
  out: 'Out', in: 'In',
  round: (n: number) => `Round ${n}`, teamFinal: 'Team final', individualFinal: 'Individual final',
  timeline: 'Tournament timeline', progress: (done: number, total: number) => `${done} of ${total} completed`,
  podium: 'Tournament podium', places: ['1st place', '2nd place', '3rd place'],
  winners: 'Winners', losers: 'Losers', notAwarded: 'Not awarded', completed: 'Completed', inProgress: 'In progress',
  matches: 'Matches', playing: 'Playing', sittingOut: 'Sitting out', eliminated: 'Eliminated',
  roundMatches: (title: string) => `${title} matches`, versus: 'vs.', satOut: 'Sat out',
}

export type Messages = typeof en

const da: Messages = {
  intro: 'Træk lod om dartkampene, vælg vinderne, og spil videre, indtil tabsgrænsen afgør, hvem der ryger ud.',
  standings: 'Stilling', lossLimit: 'Tabsgrænse', lossRule: n => `${n} nederlag før man ryger ud`,
  standingsHelp: 'Spillere, der stadig er med, står øverst. Derefter rangeres de efter flest sejre og færrest nederlag. Pauser tæller afsluttede runder, hvor spilleren sad over. Vælg en kolonne for at sortere.',
  newTournament: 'Ny turnering', names: 'Navne', people: n => `${n} ${n === 1 ? 'spiller' : 'spillere'}`,
  namesHelp: 'Skriv ét navn pr. linje.',
  markupInNames: 'Spillernavne må ikke indeholde < eller >.',
  duplicates: names => `Brug et unikt navn til hver spiller. ${names.length === 1 ? 'Gentaget navn' : 'Gentagne navne'}: ${names.join(', ')}.`,
  gameSetup: 'Spilform', individuals: 'Individuelt (1 mod 1)', teams: 'Hold (2 mod 2)',
  start: 'Start turnering', tournamentComplete: 'Turneringen er slut', firstRound: 'Første runde',
  winner: 'Vinder', champions: 'Mestre', remaining: n => `${n} ${n === 1 ? 'spiller er' : 'spillere er'} stadig med. Der skal være fire til endnu en holdkamp.`,
  suddenDeathHelp: 'De to bedst placerede udgåede spillere spiller om den sidste plads i holdfinalen.',
  teamFinalHelp: 'Vælg vinderholdet. Begge spillere bliver mestre.',
  individualFinalHelp: 'Vælg vinderen. Kampen afgør turneringen uanset tidligere nederlag.',
  winnerHelp: 'Vælg vinderen af hver afsluttet kamp.', match: n => `Kamp ${n}`, won: 'Vandt', lost: 'Tabte',
  bye: n => n === 3 ? '3 spillere sidder over' : n === 2 ? 'Holdet sidder over' : 'Sidder over',
  completeRound: 'Afslut runde', addPlayers: n => `Tilføj mindst ${n} spillere, og vælg derefter`,
  editRound: 'Ret senest afsluttede runde', reopenTitle: 'Genåbn senest afsluttede runde?', verifyResults: 'Kontrollér rundens resultater',
  reopenHelp: 'De seneste resultater rulles tilbage, og lodtrækningen og valgene for næste runde slettes. De oprindelige kampe og valgte vindere indlæses, så du kan rette dem.',
  verifyHelp: 'Kontrollér vinderen og taberen af hver kamp, før du gemmer.',
  cancel: 'Annuller', backToResults: 'Tilbage til resultaterne', reopenRound: 'Genåbn runde', confirmResults: 'Bekræft resultater',
  actionError: 'Turneringen kunne ikke opdateres. Kontrollér dine valg, og prøv igen.',
  rank: 'Plads', name: 'Spiller', wins: 'Sejre', losses: 'Nederlag', skipped: 'Pauser', status: 'Status',
  champion: 'Mester', runnerUp: 'Andenplads', finalist: 'Finalist', suddenDeath: 'Sudden death',
  out: 'Ude', in: 'Med',
  round: n => `Runde ${n}`, teamFinal: 'Holdfinale', individualFinal: 'Individuel finale',
  timeline: 'Turneringens tidslinje', progress: (done, total) => `${done} af ${total} afsluttet`,
  podium: 'Turneringens podie', places: ['1. plads', '2. plads', '3. plads'],
  winners: 'Vindere', losers: 'Tabere', notAwarded: 'Ikke tildelt', completed: 'Afsluttet', inProgress: 'I gang',
  matches: 'Kampe', playing: 'Spiller', sittingOut: 'Sidder over', eliminated: 'Slået ud',
  roundMatches: title => `Kampe: ${title}`, versus: 'mod', satOut: 'Sad over',
}

export const messages: Record<Language, Messages> = {en, da}

export function roundTitle(text: Messages, round: TournamentRound, number: number): string {
  if (round.stage === 'sudden-death') return text.suddenDeath
  if (round.stage === 'final') return text.teamFinal
  if (round.stage === 'individual-final') return text.individualFinal
  return text.round(number)
}

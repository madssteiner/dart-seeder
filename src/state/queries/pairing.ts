import {useMutation} from '@tanstack/react-query'

import {completeRound, startTournament, type GameMode, type Winner, type Tournament} from '../../tournament'

type TournamentAction =
  | {type: 'start'; names: string[]; mode: GameMode; lossLimit: number}
  | {type: 'complete'; tournament: Tournament; winners: Winner[]}

export function useTournamentMutation(onSuccess: (tournament: Tournament) => void) {
  return useMutation({
    mutationKey: ['pairing', 'tournament'],
    networkMode: 'always',
    mutationFn: async (action: TournamentAction) => action.type === 'start'
      ? startTournament(action.names, action.mode, action.lossLimit)
      : completeRound(action.tournament, action.winners),
    onSuccess,
  })
}

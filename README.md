# Pair Draw

A small browser app for drawing random pairs from a list of names.

## Run locally

Requires Node.js 22.18+ on the 22.x line, or Node.js 24+.

```sh
npm ci
npm run dev
```

Use the language selector in the top-right corner to switch between English and Danish. The active language is highlighted. The browser remembers your choice, and switching languages preserves the current tournament.

## Deploy to GitHub Pages

In the repository’s **Settings → Pages**, choose **GitHub Actions** as the source. The Pages workflow builds `dist/` and publishes it on pushes to `main`. You can also run it from the **Actions** tab. The project URL is `https://madssteiner.github.io/dart-seeder/` once Pages is enabled and a deployment succeeds.

Paste one name per line, choose **Individuals (1 vs. 1)** or **Teams (2 vs. 2)**, set the **Loss limit**, and click **Start tournament**. Blank lines are ignored. Each player needs a unique name; capitalization and extra spaces don’t distinguish names. Use a surname or nickname when players share a name.

- **Individuals** needs at least two players. An odd roster leaves one player sitting out.
- **Teams** needs at least four players. Partners reshuffle every round. Two spare players receive a team bye. When three players are left over, they are listed together as three players sitting out, with no teams assigned to them.

Select the winner of each finished match and click **Complete round**. Losing players each receive one loss, including both players on a losing team. A bye never counts as a loss. Players who reach the limit are eliminated. The next round draws from the remaining players and guarantees a match to anyone who sat out. The tournament ends when too few eligible players remain for another match (two for Individuals or four for Teams).

If exactly three players remain eligible in Teams mode, the two highest-ranked eliminated players play a one-on-one sudden-death match for the fourth spot. If only one player has been eliminated, they take that spot directly. The four finalists are shuffled into two teams, and both players on the winning team are champions, regardless of earlier losses.

The tournament timeline lists the newest round first, including Sudden Death and the Team Final. Each entry shows matchups and results, how many players played or sat out, and who reached the elimination limit in that round.

When the tournament ends, the podium appears above the last round. In Teams mode it shows the last round’s winners and losers. In Individuals mode, the last two eligible players play one final for first and second place. Its result ends the tournament regardless of the loss limit. Third place goes to the highest-ranked remaining player, with ties broken by name.

**Complete round** opens a review of every winner and loser. Results are saved only after confirmation. Use **Edit latest completed round** to roll back that round and reopen its original matchups with the saved winners preselected. Any following draw and unsaved selections are discarded; the corrected results determine the next round or podium.

Standings rank eligible players first, then by most wins and fewest losses. Tied players share a rank. Click any column heading to sort. Each winning teammate gets a win, and byes count as neither wins nor losses.

## State and verification

The app borrows Bluesky’s pattern of keeping domain-specific TanStack Query hooks under `src/state/queries/`. The draw runs through a `useMutation` hook; the input and round controls use local React state. Everything runs in the browser, and refreshing clears the current session.

- `npm test` checks the pairing and tournament scheduling rules.
- `npm run build` type-checks and builds the app into `dist/`.

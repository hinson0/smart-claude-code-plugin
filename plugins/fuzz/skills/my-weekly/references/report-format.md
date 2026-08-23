# Weekly Report Format

Use this file as the sole source of truth for the structure and wording of a
`my-weekly` report.

## Fixed rules

- The title includes both the repository name and date range.
- Metadata uses “Author” and “Period”. The period includes start time, end time,
  natural-week meaning, and timezone.
- Body headings are fixed as “Completed This Week”, “Commit Statistics”, and
  “Commit Evidence”.
- “Completed This Week” groups commits by outcome rather than repeating Git log.
  Every short SHA uses a clickable Markdown link, and one commit always uses the
  same URL.
- “Commit Statistics” lists commit count, deduplicated changed-file count, and the
  sum of per-commit text additions and deletions, in that order.
- “Commit Evidence” is ordered from earliest to latest committer timestamp and
  preserves each original commit subject. Every short SHA is clickable.
- Add a one-line “Correction” before the title only when correcting an already
  delivered report, stating the old value, correct value, and reason. An ordinary
  report starts directly with the level-one title.
- When a commit URL cannot be derived safely, use a plain short SHA and append
  “Could not safely derive commit URL” to that evidence entry.

## Standard template

```markdown
# <repository> Weekly Report (<start date> to <end date>)

- Author: <author email>
- Period: <start date and time> to <end date and time> (<this week or natural week selected by -N>, <timezone>)

## Completed This Week

- <completed outcome grouped by theme> ([`<short SHA>`](<commit URL>), [`<short SHA>`](<commit URL>))

## Commit Statistics

- Commits: <count>
- Files changed: <deduplicated file count across commits>
- Text lines: +<sum of per-commit additions> / -<sum of per-commit deletions>

## Commit Evidence

- [`<short SHA>`](<commit URL>) <YYYY-MM-DD> — <original commit subject>
```

## Empty report

When no commits match, preserve the title, author, and period, then use:

```markdown
## Completed This Week

No matching non-merge commits were found in this period.

## Commit Statistics

- Commits: 0
- Files changed: 0
- Text lines: +0 / -0
```

Omit “Commit Evidence” because there are no commits to cite.

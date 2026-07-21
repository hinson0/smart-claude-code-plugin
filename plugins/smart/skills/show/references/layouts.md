# Layout Recipes

Three recipes. Pick exactly one per page; the recipe fixes the section order so every page of the same kind reads the same way. All components referenced here (`tiles`, `badge`, `callout`, `details`, `grid2`, `panel`, `options`/`opt`, `check`, `tablewrap`) are already styled in `assets/template.html` — use their class names verbatim.

Shared rules for every recipe:

- The page is a gray canvas with white cards: wrap **each top-level section in `<section id="sec-N">`** — the template styles `section` as a card. Never place content between sections outside a card.
- Every `h2` starts with a number chip and gets a matching TOC entry: `<h2><span class="num">N</span> Title</h2>`; `h3` may get `l2` TOC entries when the page is long.
- The reader should get the verdict in the first screen: lead with a `tiles` strip and/or a `callout` stating the conclusion before any detail.
- Anything longer than ~30 lines that is *supporting evidence* (full code listings, long tables, raw data) goes inside `<details>` — visible structure, optional depth.
- Diagrams are inline SVG only. Keep them simple: `<rect>` boxes + `<line>`/`<path>` arrows + `<text>` labels, using `currentColor` and the CSS variables' hex values sparingly so they adapt to dark mode reasonably.

---

## Recipe: `plan-review`

**When:** implementation plans, proposals, designs — anything awaiting a human go/no-go.

Section order:

1. **Verdict strip** — `tiles`: scope (files/modules touched), estimated effort, risk count by level, open questions count.
2. **Goal & non-goals** — a `grid2` pair: `panel good` listing the goals, plain `panel` listing explicit non-goals (prevents scope creep debates later).
3. **Approach** — the design itself. When alternatives were considered, render them as `options` cards — one `opt` per alternative with `pro`/`con` lines, the selected one marked `opt chosen` plus a `tag` badge — followed by a `callout` stating the decision and why. Side-by-side beats prose here: the reader should see the rejected options and their dealbreakers at a glance.
4. **Architecture / flow** — one inline SVG `figure` if the plan changes structure or data flow; skip if it doesn't.
5. **Risk matrix** — `tablewrap` table: risk · `badge` level · impact · mitigation. Sort high → low.
6. **Milestones / task breakdown** — ordered list; long task details fold into `<details>` per milestone.
7. **Open questions** — `callout warn` per question that blocks the go/no-go decision. This section is why the human is reading the page; never bury it.
8. **Acceptance checklist** — `ul.check`: what "done" means, verifiable items only.

## Recipe: `explainer`

**When:** explaining how an existing system, module, or flow works.

Section order:

1. **What & where** — `tiles`: entry points, key files, external dependencies.
2. **The mental model** — a `callout` with the one-paragraph version a colleague would give at a whiteboard.
3. **Architecture diagram** — inline SVG `figure`; boxes are components, arrows are calls/data. This is the recipe's centerpiece — invest here.
4. **The walk-through** — follow one representative request/invocation end to end, `h3` per hop. Code excerpts in `pre`, trimmed to the lines that matter; full listings fold into `<details>`.
5. **Edge cases & gotchas** — `callout warn`/`risk` per item; these are what the reader will hit when they modify the code.
6. **Where to change what** — `tablewrap` table: "if you want to… · touch these files".

## Recipe: `report`

**When:** research summaries, analyses, comparisons, long documents — the safe default when neither recipe above fits.

Section order:

1. **TL;DR** — `callout` with the conclusion + a `tiles` strip of the headline numbers/facts.
2. **Body sections** — mirror the source document's own structure (file mode) or the deliverable's natural argument order (conversation mode). Apply the shared rules: fold evidence, badge severities, table the enumerable facts.
3. **Comparisons** — `grid2` panels for A/B options; a `tablewrap` table when comparing 3+ things on shared criteria.
4. **Limitations / open threads** — what the analysis does *not* cover; `callout warn` items.
5. **Sources** — file mode: the source path; conversation mode: any URLs/files cited in the session.

---

## Optional: pure-CSS tabs

Only when side-by-side (`grid2`) genuinely can't work — e.g. 3+ full-width variants of the same artifact. Radio-hack pattern; the instance CSS travels with the instance, not the template:

```html
<div class="tabs">
  <style>
    .tabs input{display:none}
    .tabs label{display:inline-block;padding:6px 14px;cursor:pointer;
      border:1px solid var(--line);border-bottom:none;border-radius:8px 8px 0 0;
      color:var(--muted);font-size:13px;font-weight:600}
    .tabs input:checked+label{color:var(--fg);background:var(--accent-soft)}
    .tabs .tabpanel{display:none;border:1px solid var(--line);border-radius:0 8px 8px 8px;padding:14px}
    #tab-a:checked~.tabpanel.a, #tab-b:checked~.tabpanel.b{display:block}
  </style>
  <input type="radio" name="tabs-1" id="tab-a" checked><label for="tab-a">Variant A</label>
  <input type="radio" name="tabs-1" id="tab-b"><label for="tab-b">Variant B</label>
  <div class="tabpanel a">…</div>
  <div class="tabpanel b">…</div>
</div>
```

Give each tab group a unique radio `name` and unique ids, and extend the `#tab-x:checked~.tabpanel.x` selector list to match. Still zero JavaScript.

---
status: accepted
---

# Merge Fuzz into Smart

Smart will become the repository's sole installable plugin and will absorb Fuzz capabilities that have an independent user purpose and a complete operating contract. Adjacent capabilities such as `show` and `html`, or `learning` and `one-by-one`, remain distinct because their behavioral contracts differ; keeping Fuzz as a permanent second plugin would preserve avoidable installation, namespace, documentation, and release overhead.

The migration is an immediate breaking change: the independent Fuzz package and its `/fuzz:*` and `$fuzz:*` entry points will be removed without a compatibility shim. Smart's existing `close-issue` contract remains authoritative. Fuzz's `handle-all-tickets` and `verify-all-tickets` skills will be removed instead of migrated because their implementation and review workflows are external to this repository, leaving their operating contract incomplete inside Smart.

The merge does not change Smart's existing session logging behavior: full tool inputs continue to be recorded by default. The merged documentation and manifests use Smart's existing authorship and do not retain separate CE attribution.

The Fuzz capabilities migrated into Smart are exactly `ask`, `generate-wiki`, `github-skills-pdf`, `html`, `my-weekly`, and `one-by-one`. They move to the Smart namespace without preserving legacy entry points. The obsolete Fuzz migration specification is deleted rather than retained as project history. While updating the required user documentation and Smart scripts, stale references to the removed Joke Teller agent and `token-log` skill are also removed; no broader cleanup is included.

## Considered Options

- Keep Smart and Fuzz independently installable: rejected because users must understand two product identities and two release boundaries.
- Absorb every Fuzz skill unchanged: rejected because the ticket-campaign skills depend on implementation and review workflows that Smart does not provide.
- Collapse adjacent capabilities into fewer skills: rejected because similarity of subject does not make their invocation and output contracts interchangeable.
- Preserve Fuzz entry points temporarily: rejected because a compatibility shim would continue the dual publication and namespace boundary that this decision removes.

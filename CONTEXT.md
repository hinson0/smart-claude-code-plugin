# Smart Plugin

This repository defines Smart, a dual-host personal workflow plugin for Claude Code and Codex.

## Language

**Smart**:
The sole installable plugin and product identity published by this repository.
_Avoid_: Smart plugin family, Smart marketplace bundle

**Fuzz**:
The legacy independent plugin identity whose useful capabilities are being absorbed into Smart. It is not a long-term publication or namespace boundary.
_Avoid_: Smart sub-plugin

**Independent capability**:
A user workflow with its own intent and behavioral contract, retained separately even when it overlaps an adjacent workflow.
_Avoid_: Duplicate skill

**Ticket delivery run**:
A Smart workflow run over the exact ordered Ticket set published by `/to-tickets` in the current conversation. It processes one Ticket at a time and stops when the current Ticket cannot reach closure.
_Avoid_: Project-wide issue sweep, Ticket campaign

**Delivery Ticket**:
A Ticket from the `/to-tickets` output selected for the current Ticket delivery run.
_Avoid_: Any open Issue, inferred task

**Ticket completion record**:
An auditable tracker record that identifies the implementation, maps evidence to acceptance criteria, records review results, and discloses unfinished delivery boundaries before closure. It is a remote Issue comment or a section in a local Ticket file, according to the configured tracker.
_Avoid_: Progress update, generic implementation summary

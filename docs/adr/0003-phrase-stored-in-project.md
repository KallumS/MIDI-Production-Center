# 0003. Store the phrase, markers and pads in the project

Date: 2026-09-24
Status: Accepted

## Context

Midular kept phrases as files in REAPER's Data folder, so a project opened on
another machine (or after the file was deleted) lost its source. Its agreed
next step was to serialize the phrase itself. Per-pad settings (64 pads × 14
fields) are too many to be sliders.

## Decision

`@serialize` saves a version number, the phrase (up to 8,192 notes), the
markers, all 64 pads, the selected pad/page and the phrase name. Global and
effect settings stay as 48 hidden sliders so they remain automatable.
`ext_noinit = 1` with a non-empty `@serialize`, plus `pads_ok` / `src_ok`
flags, stop `@init` from overwriting loaded state with defaults. A new
instance starts with a built-in demo phrase.

## Consequences

- Projects are self-contained; the source item can be deleted after loading.
- REAPER also uses `@serialize` for undo, so pad and marker edits are
  undoable. The panel calls `sliderchange(-1)` after every edit to create the
  undo point and mark the project dirty.
- Positions are stored as 32-bit floats (fine for phrase-length precision).
- New pad fields load as 0 from older projects, so 0 must be a sensible value
  or be handled; the format carries a version number for future changes.

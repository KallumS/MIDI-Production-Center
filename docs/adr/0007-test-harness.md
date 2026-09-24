# 0007. Verify with an EEL2 interpreter plus static checks

Date: 2026-09-24
Status: Accepted

## Context

JSFX only runs inside REAPER, and REAPER isn't available where the code is
written. Midular had a small Python EEL2 interpreter and JSFX host stub that
ran the real plug-in code and inspected its MIDI output. Midular's first
REAPER runs failed on compile-time rules the interpreter didn't enforce.

## Decision

- Reuse Midular's interpreter (owned by the same author; now under this repo's
  MIT licence) in `tests/`, extended with `gmem`, `@serialize` round-trips and
  a scriptable `gfx_showmenu`.
- Add **static checks** for what REAPER rejects at compile time: calling a
  function declared later (or recursively), wrong argument counts, scientific
  notation, and statements in an imported file's `@init`. A test proves the
  checker catches them.
- Structural tests: all sliders hidden and contiguous, every parameter has a
  panel control with the same default and range, no overlapping controls.
- Behaviour tests for chopping, pads, time, every effect, stutter, transport,
  sampling, import, save/load and panel interactions, plus a check that every
  output is balanced (no stuck notes).
- Test the Lua loader against a mock ReaScript API, and run it end to end:
  the Python suite feeds the script's gmem output into the plug-in.

## Consequences

- 118 plug-in checks and 22 loader checks, all passing at first commit.
- Proves the notes produced match the design, not that the design sounds
  good, and not REAPER-specific behaviour (drawing, menus, automation, real
  gmem, CPU). Those must be checked in REAPER (see `CLAUDE.md`).
- New EEL2 features may need teaching to the interpreter.

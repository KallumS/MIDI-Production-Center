# 0001. Build as a JSFX plug-in, not CLAP

Date: 2026-09-24
Status: Accepted

## Context

The owner's DAW is REAPER and they were open to either JSFX or CLAP. The
plug-in only handles MIDI (no audio processing), needs sample-accurate MIDI
timing, a custom pad/phrase interface, and must be easy for a non-programmer to
install and update. The owner works on macOS.

## Decision

Write it as a JSFX (EEL2) plug-in split across one `.jsfx` and three
`.jsfx-inc` files.

## Consequences

- No compiler, per-OS builds or code signing; users copy text files into
  REAPER's resource folder, and changes take effect on reload.
- Sample-accurate MIDI in `@block` and a custom UI in `@gfx` are built in.
- REAPER only; no other hosts.
- **JSFX cannot open `.mid` files or accept drag-and-drop**, so phrases need
  another way in (see [0002](0002-phrase-loading.md)).
- EEL2's constraints shape the code: no recursion or forward references, no
  scientific notation, integer-only `%`, imported files may only define
  functions. These are listed in `CLAUDE.md` and partly enforced by the tests
  ([0007](0007-test-harness.md)).
- Revisit (CLAP) only if file drops or other hosts become a requirement.

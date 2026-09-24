# 0006. One output scheduler that owns every note

Date: 2026-09-24
Status: Accepted

## Context

Notes come from many places at once: pad voices, delay repeats, stutter,
pass-through MIDI, cuts from gate/choke/retrigger, and transport panics. In
MIDI a (channel, pitch) pair can only sound once, so overlapping sources can
easily leave notes hanging, a common failure in MIDI generators.

## Decision

- Every note is scheduled as a pair (note-on and note-off) with a unique id
  into one queue, in absolute sample time. Nothing sends a note-on on its own.
- Each block, the due events are sorted by time (offs before pass-through
  before ons at the same time) and sent.
- A table keyed by `channel × 128 + pitch` records which note id owns each
  pair. A note-on over a sounding pair sends that pair's note-off first; a
  note-off is only sent if its note still owns the pair.
- Each note records its owner voice; delay repeats are marked as tails. Cutting
  a voice sends offs for the pairs it owns and drops its not-yet-started notes,
  but leaves tails ringing.
- Pass-through MIDI goes through the same queue so all output is time-ordered.
- Transport start, stop or jump (loop/seek, detected against the predicted
  beat) and CC 120/123 send all notes off.

## Consequences

- Stuck notes are structurally prevented; the tests check that every run's
  output is balanced.
- If the 8,192-event queue is full, new notes are dropped rather than left
  unterminated.
- A voice slot reused while an earlier voice's final notes still ring could
  cut those notes early if the new voice is cut; minor and accepted.

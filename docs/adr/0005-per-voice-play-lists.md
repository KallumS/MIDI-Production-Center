# 0005. Each voice plays its own copy of its slice

Date: 2026-09-24
Status: Accepted; partly superseded by [0008](0008-pads-own-regions-transfer.md)
(voices now build their list from the pad's own region instead of copying a
per-slice list).

## Context

Slices must play forwards or reversed (keeping note lengths), loop, stutter,
stretch and follow tempo changes, with sample-accurate timing. Swing and
timing compression need to move notes earlier as well as later. The user can
re-chop at any time, including while pads are sounding.

## Decision

- Chopping builds, for every slice plus the whole phrase, a **forward** and a
  **reverse** play list: notes clipped to the slice, positions relative to the
  slice start, sorted. Reverse places a note at `L - (q + len)`.
- On a trigger, the voice **copies** its slice's list into its own buffer and
  applies swing and timing compression to that copy (both are monotonic, so
  the copy stays sorted).
- Each block, a voice advances its position by `rate × samples` and emits the
  entries in `[pos, pos + dp)` at exact sample times. `rate` combines time
  mode, stretch, fit-to-length and tape speed, and is recomputed every block,
  so tempo changes are followed.
- Stutter runs a second cursor over a window of the same list while the real
  position keeps advancing.

## Consequences

- Re-chopping never disturbs pads that are already playing.
- Memory: 32 voices × 4,096 entries × 5 values (about 650k slots of JSFX's
  ~8M). A whole-phrase pad over 4,096 notes plays only the first 4,096.
- Swing / timing changes apply from the next trigger, not mid-loop.

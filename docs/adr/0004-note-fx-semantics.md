# 0004. How audio effects translate to MIDI

Date: 2026-09-24
Status: Accepted

## Context

The owner described each effect by analogy with audio: the filter removes
notes from the top or bottom, compression "moves the notes closer together",
delay repeats notes, EQ raises or lowers velocity in a bump or dip, and
stutter and pitch correction work "similarly to how they do with samples".
Some of these needed a precise rule, and one (compression) was ambiguous.

## Decision

Treat **pitch as the frequency axis** and **velocity as the level axis**.

- **Filter**: low-pass / high-pass / band-pass / notch on pitch. *Slope* fades
  velocity linearly over N semitones past the cutoff (0 = hard cut);
  *resonance* boosts notes within 3 semitones of the cutoff. A note whose
  velocity falls below 1 is removed.
- **EQ**: low shelf, bell and high shelf multiply velocity (−100%…+100%);
  shelves blend over ±3 semitones. A full cut removes notes.
- **Pitch axis** setting: *Absolute* (real note numbers) or *Relative to pad*
  (0–127 spans the lowest to highest note of the pad's slice), so "remove notes
  from the top of the pad" works whatever range a pad covers.
- **Compressor**, one rule for three selectable targets: anything further than
  the threshold from a reference is pulled in by the ratio.
  - *Velocity*: reference 0 (classic dynamics), plus makeup.
  - *Pitch*: reference = middle of the pad's range; threshold 0–24 semitones.
  - *Timing*: reference = nearest 1/16; threshold = share of half a 1/16.
  Offering all three covers the ambiguous "closer together".
- **Delay**: tempo-synced repeats with feedback (velocity × feedback per
  repeat), repeat count, pitch step per repeat, and dry/wet mix. Repeats are
  "tails": releasing or choking a pad doesn't cut them.
- **Stutter**: a beat repeat. The pad loops the grid window it is currently
  in while the real position keeps moving, so it lands back in time when
  released. Decay, pitch step and gate change the repeats; engaged by a
  switch, a held key, or automation.
- **Pitch correction**: snap to key + scale (12 scales), nearest (ties go
  down) / up / down / remove.
- Chain order: filter → EQ → compressor → delay → pitch correction, so delay
  repeats with a pitch step are still corrected into key. Stutter acts on the
  pad voices, before the chain.
- Effects are global; each pad has a *Send to FX* switch.

## Consequences

- Filter/EQ automation behaves like a sweep over the keyboard.
- Timing compression and swing can move notes *earlier*, which can't be done
  once a note is due; they are applied when a pad is triggered
  ([0005](0005-per-voice-play-lists.md)), so changes apply from the next hit.
- These rules are guesses at what will feel musical; the owner should confirm
  them in REAPER.

# 0008. Pads hold their own regions; "transfer to pads"

Date: 2026-09-24
Status: Accepted. Supersedes the part of [0005](0005-per-voice-play-lists.md)
where a voice copies a precomputed per-slice list.

## Context

In the first version each pad stored a slice *number*, so the pads always
followed the current chop: changing the sensitivity or grid silently changed
what every pad played. The owner asked for a "transfer to pads" action, like
other samplers (e.g. Ableton's slice-to-pads), that fills the pads with the
current chops on demand. That only makes sense if the pads then *keep* what was
transferred.

## Decision

- Each pad stores its own **region** of the phrase: start and end in beats
  (`PF_S`, `PF_E`, the last two fields of the 16-slot pad record). `PF_SLICE`
  becomes a label only (the slice it came from; -1 = whole phrase, 64 = empty).
- **TRANSFER TO PADS** fills the pads of the current bank, in order, with the
  current slices, carrying on into the next banks if there are more than 16.
  Pads after the last one filled are emptied up to the end of that bank; other
  banks and all other pad settings are left alone. So different banks can hold
  different chops of the same phrase.
- Re-chopping never changes a pad. The button lights up when the chops have
  changed since the last transfer.
- A **new phrase** (demo, sampling, import) is transferred to bank A
  automatically, emptying all other pads, because old regions mean nothing in a
  new phrase.
- Dropping a slice on a pad, the PAD page's *Slice* control and the pad menu
  (whole phrase / empty) all write a region.
- The transfer runs in `@block`, straight after any pending re-chop, so it
  always uses the chops that are on screen.
- On a trigger the voice builds its play list **directly from the phrase** for
  the pad's region (`mpc_region_list`), replacing the per-slice list pool.
- Projects saved by version 1 (slice numbers) are migrated on load: each pad
  gets the region of its old slice number under the restored chop settings.
  Loading a project cancels any automatic transfer queued before it, so the
  saved pads always win.

## Consequences

- Pads are stable, and can mix chop methods across banks.
- Less memory (the 200k-slot list pool is gone) and less work per re-chop; a
  trigger now scans the phrase from its region's start (bounded by the longest
  note, for held notes), which is cheap.
- A pad's region may no longer match any on-screen slice; the phrase view
  highlights the selected pad's own region, and slice labels show a pad only
  when one holds exactly that slice.
- The pad record is now full (16 of 16 slots). Another pad setting means
  growing `P_ST`, which changes the saved layout and needs a version bump and
  migration.

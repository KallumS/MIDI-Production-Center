# CLAUDE.md

Working notes for MIDI Production Center, an MPC-style MIDI pad sampler written
in JSFX (EEL2) for REAPER. `README.md` is the user guide (the owner is not a
programmer - keep it in plain language); this file is what you need before
changing code.

## Layout

```
Effects/MIDI Production Center/
  MIDI_Production_Center.jsfx   header, 48 sliders, section wiring
  mpc_core.jsfx-inc             memory map, sorting, params, pads, phrase, chopping, @serialize
  mpc_engine.jsfx-inc           scheduler, note FX, voices + stutter, sampling, gmem import, @block
  mpc_ui.jsfx-inc               @gfx panel
Scripts/MIDI Production Center/
  mpc_loader_lib.lua            reads MIDI items, writes them to gmem
  MPC - Load selected MIDI item.lua
  MPC - Loader (background).lua  makes the in-plug-in LOAD ITEM button work
tests/                          EEL2 interpreter + suites (see tests/README.md)
docs/adr/                       architecture decision records (index in README.md)
docs/sessions/                  one log per working day, YYYY-MM-DD.md
```

The folder names mirror REAPER's resource path so users copy `Effects/` and
`Scripts/` straight in.

## Testing

**Run both suites after any change** - they are the only verification
available without REAPER:

```
python3 tests/test_mpc.py
lua5.4  tests/test_loader.lua
```

If you use an EEL2 feature the interpreter doesn't know, teach it
(`tests/runtime.py`) - that is expected. The harness also statically checks
declaration order and argument counts (see below), which REAPER enforces at
compile time and the interpreter otherwise wouldn't.

## Project records - keep these up to date

- **Session log** (`docs/sessions/YYYY-MM-DD.md`): at the end of each working
  session, write (or add to) the file for that day: goal, what was done,
  decisions, verification (test results, and whether it was tried in REAPER),
  open items / next steps. Start a session by reading the most recent log.
- **Architecture decision records** (`docs/adr/NNNN-title.md`): add one for any
  decision that would be expensive to reverse or that a future reader would
  question - technology, file/data formats, the gmem protocol, the
  timing/scheduling model, what an effect *means* musically. Use the template
  in `docs/adr/README.md` and add it to the index there. Never rewrite an
  accepted ADR; supersede it with a new one and update the old one's status.
- Small calls go in the session log, not an ADR.

## Current status

Early version (2026-09-24). Both suites pass (137 plug-in checks, 22 loader
checks). **First REAPER try: the owner couldn't get it to play anything; cause
unknown.** AUDIO / IN / OUT status lights and "empty pad" messages were added
to pin it down - ask which lights come on before guessing. See
`docs/sessions/2026-09-24.md`.

## Why JSFX (not CLAP)

See [ADR 0001](docs/adr/0001-jsfx-not-clap.md). In short: no compiler, builds
or signing, sample-accurate MIDI and a custom UI built in. The cost is that
JSFX can't open `.mid` files or accept drag-and-drop, hence live sampling and
the gmem loader scripts ([ADR 0002](docs/adr/0002-phrase-loading.md)).

## JSFX / EEL2 rules this code relies on

(Several were learned the hard way in the owner's earlier Midular project.)

- **No recursion, no forward references.** A function may only call functions
  declared before it. Import order is core → engine → ui, and within a file
  helpers come first. `mpc_touch()` is at the top of the UI file for this
  reason. The test harness fails if this is broken.
- **Argument counts must match** at every call (compile error otherwise).
- **No scientific notation** (`1e-6` is a syntax error). Write `0.000001`.
- **`%` is integer-only** (absolute values, truncated). `(p - key + 120) % 12`
  keeps it positive; never use it for floats.
- **`==` is fuzzy** (within 0.00001). Use `===` for exact comparisons (IDs,
  sort keys).
- **`&&`/`||` share one precedence level, as do `|`, `&`, `~`.** Parenthesise
  whenever they are mixed.
- **Imported files may only define functions in `@init`.** All constants live
  in `mpc_consts()` (core), called from the main file's `@init` and from
  `@serialize`.
- **`@serialize` can run before `@init`** → it calls `mpc_consts()` first.
  `ext_noinit = 1` plus a non-empty `@serialize` keeps memory across transport
  starts; `pads_ok` / `src_ok` stop `@init` overwriting a loaded project with
  defaults. Don't remove any of these.
- **Slider notifications need the literal `sliderN` at the call site**, hence
  the long `if` list in `mpc_touch()` rather than a bitmask (masks above 32
  sliders are unverified). `slider_automate(sliderN, 1)` ends a touch (6.74+).
- **All sliders are hidden with `-`**, or REAPER stacks them above the panel
  and it looks like "no GUI". A test enforces this.
- **Panel ↔ audio thread.** `@gfx` runs on another thread. It only writes pad
  settings, `MARK_UI` markers and `ui_req_*` flags; `@block` does the work.
  Parameters are read from sliders every block (`mpc_read_params`) because the
  host doesn't reliably rerun `@slider` for writes from `@gfx`.
- `tempo`, `beat_position`, `play_state` are not valid in `@gfx`.
- `sliderchange(-1)` from `@gfx` = undo point + project marked dirty
  (`u_changed()`). Call it after every user edit.

## Architecture

The reasoning behind this section is in the ADRs: saving state (0003), effect
meanings (0004), per-voice play lists (0005), the scheduler (0006), the test
approach (0007) and pad regions / transfer to pads (0008).

**Phrase** (`SRC`, ≤ 8192 notes: start, length in beats, pitch, vel, chan),
sorted by start then pitch. Arrives from the demo, live sampling
(`mpc_cap_*`), or gmem import (`mpc_import_check`), always via
`mpc_src_finalize()`, which bumps `src_rev`.

**Chopping.** `mpc_chop_if_needed()` compares every input (phrase revision,
marker revision, chop sliders) and re-runs `mpc_chop()`, which only computes
the slices (`SLICE`: start/end in beats, ≤ 64). Transient chopping groups notes
starting within `ONSET_WIN` into a hit whose strength is summed velocity;
sensitivity is the fraction of the strongest hit a hit needs.

**Pads hold their own regions** (`PF_S`..`PF_E`, beats); `PF_SLICE` is just a
label (-1 whole phrase, `NO_SLICE` = 64 empty). `mpc_transfer(first, all)`
copies the current slices onto pads from `first`, emptying the rest of that
bank. It runs automatically for a new phrase (`xfer_pending`, set by
`mpc_src_finalize`, cleared by a project load so saved pads win) and on
request from the panel (`ui_req_xfer`, handled in `@block` after the chop).
Re-chopping never changes a pad; `xfer_chop_rev !== chop_rev` lights the
button. Version-1 projects (slice numbers) are migrated in `mpc_chop()`
(`pads_migrate`).

**Voices** (32). A trigger builds the voice's play list straight from the
phrase for the pad's region (`mpc_region_list` into the voice's `VLIST` area):
positions relative to the region start, notes clipped to it, held notes
included when "Held notes" is on, reversed if the pad is. Swing and timing
compression are applied to that copy (they move notes *earlier* as well as
later, which can't be done once a note's time has come).
Each block a voice advances `pos` by `rate × samples` and emits list entries
in `[pos, pos+dp)` at exact sample times. Loops wrap; one-shots end at the
slice end. Rate combines time mode, stretch, fit and tape.

**Stutter** is a second cursor (`V_SPOS`) looping a window
`[floor(pos/size)*size, +size)` while the real `pos` keeps advancing silently,
so the pad lands back in time when stutter ends (like a beat repeat).

**FX chain** (`mpc_fx`, only for pads with Send to FX): filter → EQ →
compressor → delay → pitch correction. Pitch is the frequency axis
(`mpc_axis`: absolute note, or relative position within the pad's range) and
velocity the level axis. A note whose velocity drops below 1 is removed.

**Scheduler.** Every note is queued with its note-off (`mpc_out`) into
`QUEUE` (free-list stack). `mpc_q_run()` sends the block's due events in time
order. `SOUND[chan*128+pitch]` holds the owning note id: a note-on over a
sounding pair sends that pair's note-off first, and a note-off only goes out
if its note still owns the pair - so nothing can hang. Owner = voice index,
+64 (`TAIL`) for delay repeats, which releasing/choking a pad does not cut.
Pass-through MIDI goes through the queue too, so all output is time-ordered.

**Diagnostics.** `@block` counts blocks (`blk_count`), incoming MIDI
(`diag_in_n`) and outgoing note-ons (`diag_out_n`), and records the last empty
pad played (`diag_empty`, `diag_empty_n`). The panel turns these into the
AUDIO / IN / OUT lights and messages (`u_watch`), so the owner can say where
the signal stops.

**Transport.** Starting, stopping or jumping (loop/seek, detected against the
predicted beat) sends all notes off and stops voices; stopping also finishes a
live capture.

**gmem protocol** (namespace `MIDIProductionCenter`) is documented above
`mpc_import_check()` and mirrored in `mpc_loader_lib.lua`. The script writes
the data, then the sequence number last; each instance loads only if slot 1
matches its hidden **Instance ID** slider (generated once, saved with the
project) and acknowledges in slots 10/11. The LOAD ITEM button writes a request
(slots 20/21) that the background loader answers; errors come back in 22/23;
slot 30 is the loader's heartbeat. A new instance ignores whatever sequence
was already in gmem.

## Adding a parameter

1. `sliderN:` line in the main file, with `-` prefix.
2. Read it in `mpc_read_params()`.
3. Add a line for N in `mpc_touch()` (UI file).
4. Add a control in `mpc_build_ui()` with the **same default and range**.
The structure tests fail if 3 or 4 disagree with 1.

## Adding a pad setting

The pad record is **full** (`P_ST` = 16, all used). A new field means growing
`P_ST`, which changes the saved layout: bump the `@serialize` version (now 2)
and read older versions with the old stride. Then add the `PF_*` field in
`mpc_consts()`, its default in `mpc_pad_default()`, a `T_PAD` control, and use
it in the engine.

## Not yet verified inside REAPER

Everything above is verified by the harness only. First things to check in
REAPER: it compiles; the panel draws and scales (including HiDPI);
`gfx_showmenu` menus; `slider_automate(sliderN, e)`; `file_string` in
`@serialize` (phrase name); gmem between the scripts and the plug-in; that
`TrackFX_GetParam` returns the raw Instance ID (JSFX params are not normalised);
and whether the musical defaults feel right.

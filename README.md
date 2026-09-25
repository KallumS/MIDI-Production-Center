# MIDI Production Center

An MPC-style 16-pad sampler for REAPER, except the "samples" are **MIDI**, not
audio. You load a MIDI phrase, chop it into slices, put the slices on pads and
play them. The effects work on the notes themselves:

| Effect | What it does to the MIDI |
| --- | --- |
| **Filter** | Removes notes from the top (low-pass) or bottom (high-pass) of the pitch range, keeps a band (band-pass) or cuts one out (notch). *Slope* fades notes out over a range instead of removing them. *Resonance* makes notes right at the cutoff louder. |
| **EQ** | Low shelf, mid bell and high shelf. Each one raises or lowers the velocity of notes in its part of the keyboard. |
| **Compressor** | Pulls things closer together. Target **Velocity**: loud notes are brought down towards the threshold (with makeup). **Pitch**: notes far from the middle of the pad are pulled towards it. **Timing**: notes are pulled towards the 1/16 grid. |
| **Delay** | Repeats each note, in time with the project. *Feedback* fades each repeat, *Pitch step* transposes each repeat (try +7 or +12), *Mix* balances the original against the echoes. |
| **Stutter** | Beat-repeat: grabs the short window the pads are currently in and repeats it. *Decay* and *Pitch step* change each repeat. Hold the on-screen button, automate it, or assign a MIDI key to it. |
| **Pitch correct** | Snaps notes to a key and scale (12 scales), to the nearest note, up, down, or removes out-of-key notes. |

It is a **JSFX** plug-in, so there is nothing to compile or install beyond
copying files, and it works on Windows, macOS and Linux.

---

## Install

1. Download this repository (green **Code** button → **Download ZIP**) and unzip it.
2. In REAPER choose **Options → Show REAPER resource path in explorer/finder**.
3. Copy the **`Effects`** and **`Scripts`** folders from the download into that
   resource folder. If it asks, choose to *merge* (not replace) the folders.
   You should end up with:
   ```
   <resource path>/Effects/MIDI Production Center/MIDI_Production_Center.jsfx  (+ 3 .jsfx-inc files)
   <resource path>/Scripts/MIDI Production Center/                            (3 .lua files)
   ```
4. Add the two actions: **Actions → Show action list → New action… → Load
   ReaScript…**, go to `Scripts/MIDI Production Center/` and pick
   - `MPC - Load selected MIDI item.lua`
   - `MPC - Loader (background).lua`

   (Leave `mpc_loader_lib.lua` alone - the other two use it.)
5. On a track, add **JS: MIDI Production Center** *before* an instrument
   (ReaSynth, a drum sampler, a piano, anything that plays MIDI).

The plug-in opens with a short demo groove already loaded, so you can hit pads
straight away.

## Quick start

1. **Get a phrase in** (see the next section).
2. **Chop it** with the buttons under the title: *Transient* (a slice at every
   hit, *Sensitivity* decides how many), *Grid* (every 1/16, 1/8, … bar),
   *Equal* (n equal parts) or *Markers* (your own chop points).
3. **Press TRANSFER TO PADS.** This fills the pads of the bank you're looking
   at with the current chops, in order (more than 16 carry on into the next
   bank). The pads then keep those chops: changing the chop settings
   afterwards doesn't change the pads until you transfer again (the button
   lights up red to remind you). A newly loaded phrase is transferred to
   bank A automatically. You can transfer different chops into different
   banks - e.g. transients in bank A, a 1/8 grid in bank B.
4. **Play the pads.** Click them with the mouse, play them from a MIDI
   keyboard, or draw notes in a MIDI item on the plug-in's track. Bank A is
   notes 36-51 (C2-D#3 in REAPER's naming); banks B, C and D carry on upwards
   (52, 68 and 84).
5. **Shape it** on the **PAD** page (per pad) and the **FX** page (effects for
   every pad that has *Send to FX* on).

## Getting a phrase in

JSFX plug-ins can't open files or have things dragged onto them, so there are
three ways to load MIDI, all of which take a few seconds:

**A. LOAD ITEM button (easiest once set up).** Run the action
*MPC - Loader (background)* once per session (it stays running quietly; run it
again to stop it). Then select any MIDI item in REAPER and click **LOAD ITEM**
in the plug-in. The header shows "loader: on" while the helper is running.
To have it start with REAPER, add it to your startup actions (SWS extension:
*Extensions → Startup actions*).

**B. The action.** Select one or more MIDI items and run
*MPC - Load selected MIDI item*. It loads into the plug-in whose window is
open, otherwise the one on the item's track, otherwise the only one in the
project. Several items become one phrase.

**C. SAMPLE (like sampling on an MPC).** Put the MIDI you want on the
plug-in's own track, click **SAMPLE**, press play in REAPER and stop when
you're done. Everything that arrives on the track while playing is recorded
(and you hear it). Click SAMPLE again before playing to cancel.

Good to know:

- A MIDI file you drag from your computer onto a REAPER track becomes a MIDI
  item, so "drag in a MIDI sequence" = drag it into REAPER, then A or B above.
- **Take markers and project markers** inside the item are brought across as
  chop points, and the plug-in switches to *Markers* chopping.
- Keep the source item on a different (or muted) track afterwards, otherwise
  its notes will also trigger pads while the project plays.
- The phrase is saved inside your project - you don't need to keep the item.

## The screen

- **Header** - phrase name and details, three status lights (see *No sound?*
  below), **SAMPLE**, **LOAD ITEM**, **PANIC** (stops every note).
- **Chop bar** - chop mode and its setting, *Held notes* (include notes that are
  still sounding from before a chop point, like audio would), *Edit as
  markers* (turns the current chops into markers you can move), and
  **TRANSFER TO PADS**.
- **Phrase view** - the notes, the slices (coloured, labelled with the pad that
  plays them), the selected pad's part (lighter, underlined), and a playhead
  for every sounding pad.
  - Click a slice to hear it. **Drag a slice onto a pad** to put just that one
    there.
  - In *Markers* mode: **double-click** to add a marker, **drag** to move it,
    **right-click** to delete. Markers snap to nearby notes or the 1/16 grid;
    hold **Shift** to place them freely.
- **Pads** - 4 banks of 16, laid out like an MPC (pad 1 bottom-left). Click
  to play (higher up the pad = louder). **Right-click** to copy / paste / reset
  a pad, make it play the whole phrase, or empty it. Empty pads show "-".
- **PAD page** - settings for the selected pad:

  | Control | Meaning |
  | --- | --- |
  | Slice | pick one of the current slices to put on this pad (or *Whole phrase*) |
  | Trigger note / Learn | the MIDI note that plays the pad; *Learn* then hit a key |
  | Play mode | *One shot* plays to the end · *Gate* stops when you let go · *Loop (hold)* loops while held · *Loop (toggle)* first hit starts, second stops |
  | Poly | off = hitting the pad again restarts it; on = hits overlap |
  | Choke group | pads in the same group cut each other off (like open/closed hi-hats) |
  | Transpose | semitones up or down |
  | Tape speed | transposing also changes speed, like a tape or an MPC without warp |
  | Stretch | 200% plays half speed, 50% double speed - pitch is untouched |
  | Fit to | squeezes/stretches the slice to exactly 1/2 … 32 beats |
  | Reverse | plays the slice backwards (note lengths are kept) |
  | Send to FX | whether this pad goes through the FX page |
  | Level / Vel. sens | volume, and how much hitting the pad harder makes it louder |
  | Out channel | force a MIDI channel for this pad (default: keep the phrase's own) |

- **FX page** - the six effects, top to bottom in the order they run. Click the
  square on the left of an effect to switch it on, or the name to edit it.
- **SETUP page** - *Time mode* (follow the project tempo, or play at the
  phrase's original tempo), *Swing* (50% straight → 66% triplet feel),
  *Pitch axis* (see below), *Thru other notes* (notes that aren't pad notes
  pass straight to the instrument), output channel, master level, and buttons
  to reset pads or reload the demo.

Knobs: drag up/down, hold **Ctrl/Cmd** for fine moves, **double-click** to
reset, or use the mouse wheel. Every setting can be automated in REAPER (they
are listed under the FX window's **Param** button).

### Pitch axis: absolute or relative

The filter and EQ treat pitch like frequency. With **Absolute**, the cutoff is
a real note (e.g. remove everything above C4). With **Relative to pad**, 0-100%
means "from the lowest to the highest note in this pad's slice", so a low-pass
at 50% always keeps the bottom half of whatever the pad plays - handy when
different pads cover different ranges.

## No sound?

First, check the three lights at the top of the plug-in:

| Light | Meaning |
| --- | --- |
| **AUDIO** | Green = REAPER is running the plug-in. Red = it isn't, so nothing can play. |
| **IN** | Flashes when MIDI arrives at the plug-in (a key, or a note in a MIDI item). |
| **OUT** | Flashes when the plug-in sends a note to the instrument. |

Then work down this list:

1. **AUDIO is red.** REAPER isn't processing the track. Check that audio is
   working (*Options → Preferences → Audio → Device*), and that the plug-in
   isn't bypassed or offline. If it only turns green while REAPER is playing,
   press play before clicking pads.
2. **Clicking a pad does nothing and OUT doesn't flash.** The pad may be
   empty (it shows "-" and a message says so): press **TRANSFER TO PADS**.
3. **Playing a keyboard: IN never flashes.** MIDI isn't reaching the track:
   arm the track for recording, set its input to your keyboard (or *All MIDI
   inputs*), and turn record monitoring on.
4. **Playing from a MIDI item: IN flashes but OUT doesn't.** The item's notes
   must be pad notes (36 upwards - see the pad labels) and must land on pads
   that aren't empty. A message names any empty pad that gets played.
5. **OUT flashes but you hear nothing.** The problem is after the plug-in: an
   instrument must come **after** MIDI Production Center in the *same* track's
   FX chain (ReaSynth is a quick test), and the track must not be muted.

If none of that helps, tell me which lights come on when you click a pad and
when you play a note.

## Limits

8,192 notes per phrase · 64 slices · 64 pads · 32 pads sounding at once ·
256 markers. The plug-in only runs while REAPER's audio engine is running.

## Status

This is an early version. It is tested outside REAPER with an EEL2
interpreter (see `tests/`), which checks the notes it produces - 137 checks on
the plug-in and 22 on the loader scripts. The first try inside REAPER didn't
produce sound, and the cause isn't known yet; the status lights were added to
find it. If something doesn't work, the most useful things to report are:

- any red error text at the top of the plug-in window (REAPER shows the first
  problem there),
- which of the AUDIO / IN / OUT lights come on, and
- what you did, what you expected, and what happened.

## For developers

See [CLAUDE.md](CLAUDE.md) for the design and the JSFX rules it follows,
[docs/adr/](docs/adr/README.md) for why the big decisions were made,
[docs/sessions/](docs/sessions/) for a log of each working session, and
[tests/README.md](tests/README.md) for running the tests:

```
python3 tests/test_mpc.py      # the plug-in
lua5.4  tests/test_loader.lua   # the loader scripts
```

## Licence

MIT - see [LICENSE](LICENSE).

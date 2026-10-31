# 0009. The window's text follows Apple's writing guidelines

Date: 2026-10-14
Status: Accepted

## Context

The owner asked for every one of their apps to follow Apple's Human Interface
Guidelines on writing (developer.apple.com/design/human-interface-guidelines/writing),
as Noterator and Miderator already do (Noterator's decision 0053). This panel
mixed styles: buttons and headings in capitals ("TRANSFER TO PADS", "LOAD
ITEM", "BANK A", "SETUP"), control labels in sentence case ("Trigger note",
"Play mode"), abbreviations ("Vel. sens", "st"), " - " for dashes, "..." for
an ellipsis, and messages naming buttons in capitals ("press TRANSFER TO
PADS").

## Decision

One style for each kind of text, everywhere the owner reads it:

- **Buttons, tabs, headings, control labels, menu items and the options of a
  drop-down** in title style: "Transfer to Pads", "Load Item", "Bank A",
  "Trigger Note", "Copy Pad Settings", "Loop (Hold)". Short prepositions stay
  lower case unless last ("Fit To").
- **Messages, help lines and status text** in sentence case; a whole sentence
  ends with a full stop, a fragment does not. A message says what happened and
  what to do, and names a button the way the button reads ("click Transfer to
  Pads").
- **Words, not abbreviations**, where they fit: "semitones", "Velocity
  Sensitivity", "Output Channel", "Compressor Target".
- **Typography**: an em dash (—) between phrases, an en dash (–) in a range,
  "…" as one character, curly quotes and apostrophes, "·" between the parts of
  a summary line, "→" for "goes to". Action and file names keep their plain
  hyphens ("MPC - Load selected MIDI item").
- **"Command"** for the fine-adjust key on a Mac, spelled out as Apple's style
  does in running text.
- **Slider names and enum labels** (what REAPER's parameter and automation
  lists show) follow the same rules ("Compressor Ratio", "1 Bar", "Sync to
  Project"), **except "Chop Mode" and "Instance ID"**: the loader scripts find
  the plug-in by those two names (`mpc_loader_lib.lua`, `instance_id`).

## Consequences

- Text only: no slider was renumbered, reordered or re-ranged, so saved
  projects, presets and automation are unaffected; stored values are numbers.
- Messages drawn in the header have about 258 pixels; each was checked by
  rendering and kept to about forty characters. Two drop-downs show shorter
  options than their slider's enum ("Sync | Original", "Absolute | Relative")
  because the box is 86 pixels wide.
- The README quotes the new labels.
- New text follows the same rules. The panel can be rendered headlessly to
  check that a label fits: Reverberator's `tools/build/gui` (ysfx) loads
  `MIDI_Production_Center.jsfx` as it is.

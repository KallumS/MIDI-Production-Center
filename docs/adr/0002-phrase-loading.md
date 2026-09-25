# 0002. Load phrases by live sampling and loader scripts over gmem

Date: 2026-09-24
Status: Accepted

## Context

The owner wants to "drag in a MIDI sequence". JSFX has no drag-and-drop and no
reliable way to read arbitrary binary files, so it can't parse `.mid` files.
The earlier Midular project converted phrases to `.txt` files in REAPER's Data
folder and picked them with a file slider; that made projects depend on files
outside the project and the file-list handling was never confirmed to work.

## Decision

Three ways in, none using files:

1. **SAMPLE** (in the plug-in): when armed, record the MIDI arriving on the
   track while REAPER plays; stopping finishes the capture. This mirrors
   sampling on an MPC and needs no scripts.
2. **"MPC - Load selected MIDI item"** action: a Lua script reads the selected
   MIDI item(s) through the ReaScript API and writes the notes, markers and
   name into shared memory (`gmem`, namespace `MIDIProductionCenter`). The
   plug-in reads them in `@block` and acknowledges.
3. **LOAD ITEM button**: the plug-in writes a request to gmem; a background
   script ("MPC - Loader (background)") answers it with the selected item.

Each instance has a hidden, saved **Instance ID** slider; loads carry the
target ID so only that instance takes them. Take markers and project markers
inside the item become chop points.

## Consequences

- A dragged `.mid` file becomes a REAPER item first, then one click or action.
- The LOAD ITEM button needs the background script running (the header shows
  "loader: on/off"); it can be added to REAPER's startup actions.
- The plug-in only sees gmem while REAPER's audio engine runs; the one-shot
  script waits up to 3 seconds for the acknowledgement and explains if none
  comes.
- The gmem layout is a contract between `mpc_engine.jsfx-inc` and
  `mpc_loader_lib.lua` and must be changed in both places.
- A new instance ignores whatever load is already sitting in gmem, so an old
  load can't overwrite a freshly opened project.
- Copy/pasting an instance duplicates its ID (both would load the same
  phrase). Accepted as rare.

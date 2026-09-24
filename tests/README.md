# Tests

JSFX normally only runs inside REAPER. `eel2.py`, `runtime.py` and `jsfx.py`
are a small EEL2 interpreter and JSFX host stub (adapted from the Midular
project) that load `MIDI_Production_Center.jsfx` and its imports, run
`@init` / `@block` / `@serialize` / `@gfx`, and record the MIDI that comes out -
so the engine can be tested like ordinary code.

```
python3 tests/test_mpc.py       # plug-in: chopping, pads, FX, stutter, sampling, import, save/load, panel
lua5.4  tests/test_loader.lua    # loader scripts, against a mock of the ReaScript API
```

Both print a per-check report and exit non-zero on failure. `test_mpc.py` also
runs the loader script (if Lua is installed) and feeds what it writes to shared
memory into the plug-in, as an end-to-end check.

## What the harness checks beyond running the code

- **Declaration order and argument counts.** REAPER refuses a function that
  calls one declared after it, or calls one with the wrong number of
  arguments. The interpreter would happily run both, so `jsfx.static_check()`
  looks for them (and the suite checks that the checker catches them).
- Scientific notation (`1e-6`) is rejected by the lexer, as in REAPER.
- Imported files may only define functions in `@init`.
- Every slider is hidden (`-` prefix) and has a matching panel control with the
  same default and range; no two controls overlap.

## What it does not cover

Drawing is a no-op (the panel's layout and mouse handling are exercised, not
its looks), `gfx_showmenu()` returns whatever `ip.menu_answer` is set to (0 by
default), and there is no `@sample`, FFT or MIDI-bus support. It is roughly a
thousand times slower than REAPER's JIT-compiled EEL2, so timings here say
nothing about real CPU use.

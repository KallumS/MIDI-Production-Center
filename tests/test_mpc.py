#!/usr/bin/env python3
"""Runs MIDI_Production_Center.jsfx in the mini EEL2 interpreter and checks the
MIDI it produces.

    python3 tests/test_mpc.py
"""
import os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from harness import Host, note_on, note_off, summarize, SRATE

ROOT = os.path.join(HERE, os.pardir)
FXDIR = os.path.join(ROOT, 'Effects', 'MIDI Production Center')
JSFX = os.path.join(FXDIR, 'MIDI_Production_Center.jsfx')
BL = 512
BEAT = SRATE / 2          # samples per beat at 120 BPM

_state = {'pass': 0, 'fail': 0}


def check(label, cond, detail=''):
    good = bool(cond)
    _state['pass' if good else 'fail'] += 1
    print('  %-58s %s%s' % (label, 'ok' if good else 'FAIL', ('   ' + str(detail)) if detail and not good else ''))


def section(name):
    print('\n' + name)


# ------------------------------------------------------------------ helpers
_HOST = [None]

def fresh():
    """A new instance with the demo phrase loaded and chopped."""
    h = Host(JSFX)
    h.block(BL)
    return h


def g(h, name):  return h.ip.g.get(name, 0.0)
def mem(h, addr): return h.ip.mem[int(addr)]


def pad_set(h, p, field, value):
    h.ip.mem[int(g(h, 'PAD') + p * g(h, 'P_ST') + g(h, field))] = float(value)


def pad_get(h, p, field):
    return h.ip.mem[int(g(h, 'PAD') + p * g(h, 'P_ST') + g(h, field))]


def sl(h, n, v):
    h.ip.g['slider%d' % n] = float(v)


def load(h, notes, length, markers=(), tempo=120.0, name='test', chop=None, seq=[100]):
    """Loads a phrase the way the loader script does: through gmem."""
    gm = h.ip.gmem
    for i, (s, l, p, v, c) in enumerate(notes):
        base = 100 + i * 5
        gm[base], gm[base + 1], gm[base + 2], gm[base + 3], gm[base + 4] = s, l, p, v, c
    gm[1] = g(h, 'slider48')
    gm[2] = len(notes); gm[3] = length; gm[4] = tempo; gm[5] = 4; gm[6] = 4
    gm[7] = len(markers)
    for i, m in enumerate(markers):
        gm[60000 + i] = m
    gm[8] = len(name)
    for i, ch in enumerate(name):
        gm[61000 + i] = ord(ch)
    seq[0] += 1
    gm[0] = seq[0]
    if chop is not None:
        sl(h, 1, chop)
    h.block(BL)


def run(h, blocks, script=None, start=None, tempo=120.0):
    """Runs blocks; script maps block index -> input events. Returns
    [(abs_sample, kind, pitch, vel, chan)] with abs positions from `start`."""
    script = script or {}
    base = start if start is not None else h._abs
    ev = []
    for i in range(blocks):
        ev += summarize(h.block(BL, script.get(i, []), tempo), h._abs)
        h._abs += BL
    return ev


def mk(setup=(), notes=None, length=4.0, markers=(), chop=1, grid=3):
    h = fresh()
    h._abs = BL
    if notes is not None:
        load(h, notes, length, markers)
        h._abs += BL
    sl(h, 1, chop); sl(h, 3, grid)
    for n, v in setup:
        sl(h, n, v)
    h.block(BL); h._abs += BL
    return h


def ons(ev):  return [e for e in ev if e[1] == 'on ']
def offs(ev): return [e for e in ev if e[1] == 'off']


def balanced(ev):
    """Every note-on is matched by a note-off, and no pair is doubled up."""
    sounding = {}
    for pos, kind, p, v, c in sorted(ev, key=lambda e: (e[0], 0 if e[1] == 'off' else 1)):
        k = (c, p)
        if kind == 'on ':
            if sounding.get(k):
                return False
            sounding[k] = True
        else:
            sounding[k] = False
    return not any(sounding.values())


def hit(h, note, vel=127, at=0, hold_blocks=None, blocks=60, tempo=120.0):
    """Hits a pad note at offset `at` of the next block; returns events with
    positions relative to the hit."""
    script = {0: [note_on(at, note, vel)]}
    if hold_blocks is not None:
        script[hold_blocks] = [note_off(0, note)]
    t0 = h._abs + at
    ev = run(h, blocks, script, tempo=tempo)
    return [(e[0] - t0, e[1], e[2], e[3], e[4]) for e in ev]


# A test phrase: one note per beat, pitches 60..67, 8 beats, channel 0.
LINE = [(i, 0.5, 60 + i, 100, 0) for i in range(8)]


def main():
    # ------------------------------------------------------------ structure
    section('structure')
    h = fresh()
    check('compiles, and every call is to an earlier function', not h.problems, h.problems[:5])
    src = open(JSFX).read()
    decl = re.findall(r'^slider(\d+):([-0-9.]+)<([-0-9.]+),([-0-9.]+),([-0-9.]+)[^>]*>(.)', src, re.M)
    check('48 sliders declared', len(decl) == 48, len(decl))
    check('every slider is hidden ("-") so the panel is not pushed down',
          all(d[5] == '-' for d in decl))
    check('slider numbers are contiguous from 1', [int(d[0]) for d in decl] == list(range(1, 49)))
    allsrc = src + ''.join(open(os.path.join(FXDIR, f)).read() for f in os.listdir(FXDIR) if f.endswith('.jsfx-inc'))
    check('no scientific notation (REAPER rejects it)', not re.search(r'\d\.?\d*[eE][-+]?\d', re.sub(r'//.*', '', allsrc)))
    check('imported files only define functions in @init', all(
        not re.search(r'^[A-Za-z_]\w*\s*=', open(os.path.join(FXDIR, f)).read().split('@init', 1)[1], re.M)
        for f in os.listdir(FXDIR) if f.endswith('.jsfx-inc')))

    # the panel's controls agree with the slider declarations
    ip = h.ip
    ctl, cst = int(g(h, 'CTL')), int(g(h, 'C_ST'))
    n = int(g(h, 'ui_nctl'))
    bad, seen = [], set()
    declmap = {int(d[0]): (float(d[1]), float(d[2]), float(d[3])) for d in decl}
    for i in range(n):
        c = ctl + i * cst
        kind, tgt, idx = ip.mem[c], ip.mem[c + 1], int(ip.mem[c + 2])
        if tgt == 0 and kind != 4:
            seen.add(idx)
            d = declmap[idx]
            if (ip.mem[c + 6], ip.mem[c + 3], ip.mem[c + 4]) != d and kind != 6:
                bad.append((idx, (ip.mem[c + 6], ip.mem[c + 3], ip.mem[c + 4]), d))
        x, y, w, hh = ip.mem[c + 7], ip.mem[c + 8], ip.mem[c + 9], ip.mem[c + 10]
        if x < 0 or y < 0 or x + w > 1000 or y + hh > 660:
            bad.append(('off-window', idx, x, y))
    check('panel control defaults and ranges match the sliders', not bad, bad[:4])
    fx_leds = {12, 18, 26, 31, 44, 1}
    missing = [s for s in range(1, 48) if s not in seen and s not in fx_leds]
    check('every parameter has a control on the panel', not missing, missing)

    # no two visible controls overlap on the same page
    pages = {}
    for i in range(n):
        c = ctl + i * cst
        key = (ip.mem[c + 11], ip.mem[c + 15], ip.mem[c + 16])
        pages.setdefault(ip.mem[c + 11], []).append((ip.mem[c + 7], ip.mem[c + 8], ip.mem[c + 9], ip.mem[c + 10], key))
    overlap = []
    for page, rects in pages.items():
        for a in range(len(rects)):
            for b in range(a + 1, len(rects)):
                A, B = rects[a], rects[b]
                if A[4][1] and B[4][1] and A[4][1:] != B[4][1:]:
                    continue   # shown under different conditions
                if A[0] < B[0] + B[2] and B[0] < A[0] + A[2] and A[1] < B[1] + B[3] and B[1] < A[1] + A[3]:
                    overlap.append((page, A[:4], B[:4]))
    check('no two controls overlap', not overlap, overlap[:3])

    bad = os.path.join(tempfile.mkdtemp(), 'bad.jsfx')
    open(bad, 'w').write('desc:bad\n@init\nfunction a(x) ( b(x); );\nfunction b(x) ( x; );\n'
                         'function c() ( a(1, 2); );\n')
    probs = Host(bad).problems
    check('the checker itself catches forward calls and wrong arg counts', len(probs) == 2, probs)

    # --------------------------------------------------------------- boot
    section('boot and demo')
    check('demo phrase loaded', g(h, 'src_n') > 40)
    check('instance ID generated', 100000 <= g(h, 'slider48') <= 1000000)
    check('demo chopped by transients', g(h, 'slice_n') >= 2)
    check('pads default to C1 upwards', pad_get(h, 0, 'PF_NOTE') == 36 and pad_get(h, 63, 'PF_NOTE') == 99)
    check('pad n plays slice n', pad_get(h, 5, 'PF_SLICE') == 5)

    # -------------------------------------------------------------- chopping
    section('chopping')
    h = mk(notes=LINE, length=8, chop=1, grid=3)
    check('grid 1/4 over 8 beats -> 8 slices', g(h, 'slice_n') == 8, g(h, 'slice_n'))
    sl(h, 3, 4); h.block(BL)
    check('grid 1/2 -> 4 slices', g(h, 'slice_n') == 4, g(h, 'slice_n'))
    sl(h, 3, 5); h.block(BL)
    check('grid 1 bar -> 2 slices', g(h, 'slice_n') == 2, g(h, 'slice_n'))
    sl(h, 1, 2); sl(h, 4, 5); h.block(BL)
    check('equal 5 -> 5 slices', g(h, 'slice_n') == 5)
    S = int(g(h, 'SLICE')); ST = int(g(h, 'SL_ST'))
    check('equal slices are equal length', abs(mem(h, S + 2 * ST) - 3.2) < 1e-6 and abs(mem(h, S + 2 * ST + 1) - 4.8) < 1e-6)

    drums = [(0, 0.1, 36, 120, 9), (0, 0.1, 42, 60, 9), (0.5, 0.1, 42, 50, 9), (1, 0.1, 38, 118, 9),
             (1, 0.1, 42, 60, 9), (1.5, 0.1, 42, 50, 9), (2, 0.1, 36, 121, 9), (2.75, 0.1, 36, 90, 9),
             (3, 0.1, 38, 110, 9), (3.5, 0.1, 42, 55, 9)]
    h = mk(notes=drums, length=4, chop=0)
    sl(h, 2, 100); h.block(BL)
    check('transient sens 100 -> a slice per hit', g(h, 'slice_n') == 8, g(h, 'slice_n'))
    sl(h, 2, 50); h.block(BL)
    n50 = g(h, 'slice_n')
    check('transient sens 50 -> only the strong hits (0, 1, 2, 2.75, 3)', n50 == 5, n50)
    sl(h, 2, 0); h.block(BL)
    check('transient sens 0 -> first hit plus the strongest', 1 <= g(h, 'slice_n') < n50, g(h, 'slice_n'))

    h = mk(notes=LINE, length=8, markers=(2.0, 5.0), chop=3)
    check('markers from import switch chop mode to Markers', g(h, 'slider1') == 3)
    check('markers 2 and 5 -> 3 slices', g(h, 'slice_n') == 3, g(h, 'slice_n'))
    check('marker slice 2 spans 5..8', mem(h, S + 2 * ST) == 5 and mem(h, S + 2 * ST + 1) == 8)

    held = [(0, 4, 48, 90, 0), (1, 0.5, 72, 100, 0)]
    h = mk(notes=held, length=4, chop=1, grid=3)
    fn = [mem(h, S + i * ST + 5) for i in range(4)]
    check('held notes included in the slices they cross', fn == [1, 2, 1, 1], fn)
    sl(h, 5, 0); h.block(BL)
    fn = [mem(h, S + i * ST + 5) for i in range(4)]
    check('held notes excluded when switched off', fn == [1, 1, 0, 0], fn)

    # -------------------------------------------------------------- playback
    section('pads and playback')
    h = mk(notes=LINE, length=8, chop=1, grid=4)       # 4 slices of 2 beats
    pad_set(h, 1, 'PF_VSENS', 0)
    ev = hit(h, 37, at=100, blocks=120)
    o = ons(ev)
    check('pad 2 plays slice 2 (pitches 62, 63)', [e[2] for e in o] == [62, 63], o)
    check('sample-accurate start', o and o[0][0] == 0, o[:1])
    check('second note one beat later', len(o) > 1 and abs(o[1][0] - BEAT) <= 1, o)
    check('velocity untouched at 0% sensitivity', o and o[0][3] == 100)
    check('note lengths kept', abs(offs(ev)[0][0] - BEAT / 2) <= 1, offs(ev)[:1])
    check('balanced note-on/off', balanced(ev))
    check('one-shot voice ends after its slice', g(h, 'VOICE') and mem(h, g(h, 'VOICE')) == 0)

    pad_set(h, 1, 'PF_VSENS', 100)
    ev = hit(h, 37, vel=64)
    check('velocity sensitivity scales by the hit', ons(ev)[0][3] == round(100 * 64 / 127), ons(ev)[:1])

    h = mk(notes=LINE, length=8, chop=1, grid=5)       # 2 slices of 4 beats
    pad_set(h, 0, 'PF_MODE', 1)
    ev = hit(h, 36, hold_blocks=70, blocks=120)        # released at ~1.5 beats
    check('gate: release stops the pad', [e[2] for e in ons(ev)] == [60, 61], ons(ev))
    check('gate: sounding note cut at release', balanced(ev))

    pad_set(h, 0, 'PF_MODE', 2); pad_set(h, 0, 'PF_VSENS', 0)
    ev = hit(h, 36, hold_blocks=500, blocks=520)       # ~10.6 beats held
    ps = [e[2] for e in ons(ev)]
    check('loop (hold): slice repeats while held', ps[:6] == [60, 61, 62, 63, 60, 61] and len(ps) == 11, ps)
    check('loop (hold): stops on release', balanced(ev))

    pad_set(h, 0, 'PF_MODE', 3)
    ev = run(h, 300, {0: [note_on(0, 36, 100)], 1: [note_off(0, 36)], 250: [note_on(0, 36, 100)], 251: [note_off(0, 36)]})
    ps = [e[2] for e in ons(ev)]
    check('loop (toggle): first hit starts, second hit stops', len(ps) == 6 and balanced(ev), ps)

    h = mk(notes=LINE, length=8, chop=1, grid=5)
    pad_set(h, 0, 'PF_REV', 1); pad_set(h, 0, 'PF_VSENS', 0)
    ev = hit(h, 36, blocks=200)
    o = ons(ev)
    check('reverse plays the slice backwards', [e[2] for e in o] == [63, 62, 61, 60], o)
    check('reverse keeps note lengths (first note at 3.5 - 0.5 = 0.5 beat)', o and abs(o[0][0] - BEAT / 2) <= 1, o[:1])

    h = mk(notes=LINE, length=8, chop=1, grid=5)
    pad_set(h, 0, 'PF_TRANS', 7)
    ev = hit(h, 36, blocks=200)
    check('transpose +7', [e[2] for e in ons(ev)] == [67, 68, 69, 70])
    pad_set(h, 0, 'PF_TAPE', 1); pad_set(h, 0, 'PF_TRANS', 12)
    ev = hit(h, 36, blocks=200)
    o = ons(ev)
    check('tape speed: an octave up plays twice as fast', abs(o[1][0] - BEAT / 2) <= 1, o[:2])

    h = mk(notes=LINE, length=8, chop=1, grid=5)
    pad_set(h, 0, 'PF_STRETCH', 200)
    o = ons(hit(h, 36, blocks=400))
    check('stretch 200% doubles the spacing', abs(o[1][0] - 2 * BEAT) <= 1, o[:2])
    pad_set(h, 0, 'PF_STRETCH', 100); pad_set(h, 0, 'PF_FIT', 3)      # fit 4 beats into 2
    o = ons(hit(h, 36, blocks=200))
    check('fit to 2 beats squeezes a 4-beat slice', abs(o[1][0] - BEAT / 2) <= 1, o[:2])

    h = mk(notes=LINE, length=8, chop=1, grid=5)
    o = ons(hit(h, 36, blocks=400, tempo=60.0))
    check('sync: follows project tempo (60 BPM -> 1 s per beat)', abs(o[1][0] - SRATE) <= 1, o[:2])
    sl(h, 6, 1)
    o = ons(hit(h, 36, blocks=400, tempo=60.0))
    check('original tempo: ignores project tempo', abs(o[1][0] - SRATE / 2) <= 1, o[:2])

    h = mk(notes=LINE, length=8, chop=1, grid=4)
    pad_set(h, 0, 'PF_CHOKE', 1); pad_set(h, 1, 'PF_CHOKE', 1)
    ev = run(h, 150, {0: [note_on(0, 36, 100)], 60: [note_on(0, 37, 100)]})
    ps = [e[2] for e in ons(ev)]
    check('choke group: pad 2 cuts pad 1', ps == [60, 61, 62, 63] and balanced(ev), ps)
    ev = run(h, 100, {0: [note_on(0, 36, 100)], 10: [note_on(0, 36, 100)]})
    check('mono pad retrigger restarts cleanly', [e[2] for e in ons(ev)] == [60, 60, 61] and balanced(ev),
          [e[2] for e in ons(ev)])

    h = mk(notes=LINE, length=8, chop=1, grid=4)
    pad_set(h, 0, 'PF_SLICE', -1)
    check('slice -1 plays the whole phrase', len(ons(hit(h, 36, blocks=800))) == 8)
    pad_set(h, 0, 'PF_SLICE', 64)
    check('slice beyond the chops is silent', len(ons(hit(h, 36))) == 0)
    pad_set(h, 0, 'PF_SLICE', 0); pad_set(h, 0, 'PF_CHAN', 5)
    check('pad output channel', all(e[4] == 4 for e in ons(hit(h, 36))))

    ev = run(h, 5, {0: [note_on(0, 100, 90), note_off(10, 100)]})
    check('unmapped notes pass through', [(e[1], e[2]) for e in ev] == [('on ', 100), ('off', 100)], ev)
    sl(h, 9, 0)
    check('... unless thru is off', not run(h, 5, {0: [note_on(0, 100, 90)]}))

    h = mk(notes=LINE, length=8, chop=1, grid=4)
    sl(h, 7, 75)
    o = ons(hit(h, 36, blocks=120))
    check('swing 75% leaves on-beat notes alone', o[0][0] == 0)
    hh = [(i * 0.25, 0.1, 60, 100, 0) for i in range(8)]
    h = mk(notes=hh, length=2, chop=1, grid=5)
    sl(h, 7, 75)
    o = ons(hit(h, 36, blocks=120))
    check('swing 75% pushes the off-16th to 3/8 of the 1/8 pair',
          abs(o[1][0] - 0.375 * BEAT) <= 1 and abs(o[2][0] - 0.5 * BEAT) <= 1, [e[0] / BEAT for e in o[:3]])

    # ---------------------------------------------------------------- FX
    section('note FX')
    chord = [(0, 1, p, 100, 0) for p in (48, 55, 60, 64, 67, 72, 76)]
    def fx(setup, notes=chord, note=36, blocks=60, pads=()):
        h = mk(notes=notes, length=4, chop=1, grid=5, setup=setup)
        pad_set(h, 0, 'PF_VSENS', 0)
        for f, v in pads:
            pad_set(h, 0, f, v)
        return hit(h, note, blocks=blocks)

    ev = fx([(12, 1), (13, 0), (14, 64), (15, 0)])
    check('low-pass removes notes above the cutoff', [e[2] for e in ons(ev)] == [48, 55, 60, 64], ons(ev))
    ev = fx([(12, 1), (13, 1), (14, 60), (15, 0)])
    check('high-pass removes notes below the cutoff', [e[2] for e in ons(ev)] == [60, 64, 67, 72, 76])
    ev = fx([(12, 1), (13, 2), (14, 62), (17, 8), (15, 0)])
    check('band-pass keeps notes around the cutoff', [e[2] for e in ons(ev)] == [60, 64])
    ev = fx([(12, 1), (13, 3), (14, 62), (17, 8), (15, 0)])
    check('notch removes notes around the cutoff', [e[2] for e in ons(ev)] == [48, 55, 67, 72, 76])
    ev = fx([(12, 1), (13, 0), (14, 60), (15, 12)])
    v = {e[2]: e[3] for e in ons(ev)}
    check('slope fades notes past the cutoff', v.get(60) == 100 and v.get(64) == 67 and v.get(67) == 42 and 76 not in v, v)
    ev = fx([(12, 1), (13, 0), (14, 60), (15, 0), (16, 100)])
    v = {e[2]: e[3] for e in ons(ev)}
    check('resonance lifts the note at the corner', v.get(60, 0) > 100 and v.get(48) == 100, v)
    ev = fx([(12, 1), (13, 0), (14, 64), (15, 0), (8, 1)])
    check('relative axis: cutoff 50% keeps the lower half of the pad', [e[2] for e in ons(ev)] == [48, 55, 60], ons(ev))
    ev = fx([(12, 1), (13, 0), (14, 64)], pads=(('PF_FX', 0),))
    check('pad with "send to FX" off skips the chain', len(ons(ev)) == 7)

    ev = fx([(18, 1), (21, 64), (22, -50), (23, 4)])
    v = {e[2]: e[3] for e in ons(ev)}
    check('EQ dip lowers velocity in the band only', v[64] == 50 and v[48] == 100 and v[76] == 100, v)
    ev = fx([(18, 1), (19, 52), (20, 20), (24, 70), (25, -100)])
    v = {e[2]: e[3] for e in ons(ev)}
    check('EQ low shelf boosts, high shelf cut removes',
          v.get(48) == 120 and v.get(55) == 100 and 76 not in v and v.get(67) == 100 and v.get(72) == 17, v)

    vels = [(0, 1, 60 + i, v, 0) for i, v in enumerate((20, 60, 100, 127))]
    ev = fx([(26, 1), (27, 0), (28, 60), (29, 4), (30, 0)], notes=vels)
    v = [e[3] for e in ons(ev)]
    check('compressor (velocity) pulls loud notes down', v == [20, 60, 70, 77], v)
    ev = fx([(26, 1), (27, 0), (28, 60), (29, 4), (30, 20)], notes=vels)
    check('compressor makeup adds velocity', [e[3] for e in ons(ev)] == [40, 80, 90, 97])
    wide = [(0, 1, p, 100, 0) for p in (36, 60, 84)]
    ev = fx([(26, 1), (27, 1), (28, 0), (29, 2)], notes=wide)
    check('compressor (pitch) pulls notes towards the centre', [e[2] for e in ons(ev)] == [48, 60, 72], ons(ev))
    sloppy = [(0.05, 0.1, 60, 100, 0), (1.1, 0.1, 62, 100, 0)]
    ev = fx([(26, 1), (27, 2), (28, 0), (29, 20)], notes=sloppy, blocks=120)
    o = ons(ev)
    check('compressor (timing) tightens notes to the grid',
          abs(o[0][0] - 0.0025 * BEAT) <= 2 and abs(o[1][0] - 1.005 * BEAT) <= 2, [e[0] / BEAT for e in o])

    one = [(0, 0.1, 60, 100, 0)]
    ev = fx([(31, 1), (32, 8), (33, 50), (34, 3), (35, 0), (36, 50)], notes=one, blocks=200)
    o = ons(ev)
    check('delay: dry + 3 repeats, a beat apart', [round(e[0] / BEAT, 3) for e in o] == [0, 1, 2, 3], o)
    check('delay: feedback halves each repeat', [e[3] for e in o] == [100, 100, 50, 25], o)
    ev = fx([(31, 1), (32, 8), (33, 100), (34, 3), (35, 7), (36, 100)], notes=one, blocks=200)
    check('delay: pitch step and wet-only mix', [e[2] for e in ons(ev)] == [67, 74, 81], ons(ev))
    check('delay: balanced', balanced(ev))
    h = mk(notes=one, length=4, chop=1, grid=5, setup=[(31, 1), (32, 8), (33, 100), (34, 3)])
    pad_set(h, 0, 'PF_MODE', 1)
    ev = hit(h, 36, hold_blocks=2, blocks=200)
    check('delay tail keeps ringing after a gate pad is released', len(ons(ev)) == 4 and balanced(ev), ons(ev))

    ev = fx([(44, 1), (45, 0), (46, 0), (47, 0)], notes=[(0, 1, p, 100, 0) for p in (60, 61, 63, 66, 70)])
    check('pitch correct C major, nearest (ties go down)',
          [e[2] for e in ons(ev)] == [60, 60, 62, 65, 69], ons(ev))
    ev = fx([(44, 1), (45, 0), (46, 0), (47, 1)], notes=[(0, 1, p, 100, 0) for p in (61, 63, 66)])
    check('pitch correct up', [e[2] for e in ons(ev)] == [62, 64, 67])
    ev = fx([(44, 1), (45, 0), (46, 0), (47, 3)], notes=[(0, 1, p, 100, 0) for p in (60, 61, 64)])
    check('pitch correct remove', [e[2] for e in ons(ev)] == [60, 64])
    ev = fx([(44, 1), (45, 9), (46, 10), (47, 2)], notes=[(0, 1, p, 100, 0) for p in (69, 70, 71, 73)])
    check('pitch correct A minor pentatonic, down', [e[2] for e in ons(ev)] == [69, 69, 69, 72] or
          sorted(e[2] for e in ons(ev)) == [69, 72], ons(ev))

    # ------------------------------------------------------------- stutter
    section('stutter')
    sixteen = [(i * 0.25, 0.2, 60 + i, 100, 0) for i in range(16)]
    h = mk(notes=sixteen, length=4, chop=1, grid=5, setup=[(38, 6)])      # 1-beat window
    pad_set(h, 0, 'PF_VSENS', 0)
    run(h, 1, {0: [note_on(0, 36, 100)]})
    sl(h, 37, 1)
    ev = run(h, 140)                                                       # ~3 beats
    ps = [e[2] for e in ons(ev)]
    check('stutter repeats the current beat', ps[:8] == [61, 62, 63, 60, 61, 62, 63, 60], ps[:10])
    sl(h, 37, 0)
    ev = run(h, 60)
    check('stutter off: pad resumes in time', ons(ev) and ons(ev)[0][2] in (72, 73, 74, 75, 76), ons(ev)[:2])

    h = mk(notes=sixteen, length=4, chop=1, grid=5, setup=[(38, 6), (39, 1), (41, 12), (40, 50)])
    pad_set(h, 0, 'PF_VSENS', 0)
    sl(h, 37, 1)
    ev = hit(h, 36, blocks=300)
    o = ons(ev)
    ps = [e[2] for e in o]
    check('stutter repeats=1: window, one repeat, then back in time',
          ps == [60, 61, 62, 63, 72, 73, 74, 75, 68, 69, 70, 71, 72, 73, 74, 75], ps)
    check('stutter pitch step and decay on the repeat', o[4][3] == 50 and o[0][3] == 100, o[:6])
    check('stutter balanced', balanced(ev))

    h = mk(notes=sixteen, length=4, chop=1, grid=5, setup=[(38, 6), (43, 85)])   # trigger note = 84
    pad_set(h, 0, 'PF_VSENS', 0)
    ev = run(h, 200, {0: [note_on(0, 36, 100)], 50: [note_on(0, 84, 100)], 150: [note_off(0, 84)]})
    ps = [e[2] for e in ons(ev)]
    check('stutter trigger note engages while held', ps.count(64) >= 2 and 84 not in ps, ps)

    # --------------------------------------------------- safety / transport
    section('transport and safety')
    h = mk(notes=[(0, 3, 60, 100, 0)], length=4, chop=1, grid=5)
    run(h, 10, {0: [note_on(0, 36, 100)]})
    h.ip.g['play_state'] = 0.0
    ev = run(h, 2)
    check('stopping the transport sends the note-off', ev and ev[0][1] == 'off' and ev[0][2] == 60, ev)
    h.ip.g['play_state'] = 1.0
    ev = run(h, 2)
    check('no stuck notes after restart', not ev)

    h = mk(notes=LINE, length=8, chop=1, grid=4, setup=[(31, 1), (34, 16), (33, 90), (32, 0)])
    script = {i * 7: [note_on(0, 36 + (i % 4), 100)] for i in range(40)}
    for i in range(40):
        script.setdefault(i * 7 + 3, []).append(note_off(0, 36 + (i % 4)))
    for p in range(4):
        pad_set(h, p, 'PF_MODE', p % 4)
    ev = run(h, 900, script)
    sl(h, 37, 0)
    check('stress: 40 hits over mixed modes + delay stay balanced', balanced(ev))

    # ------------------------------------------------------------ sampling
    section('live sampling')
    h = fresh(); h._abs = BL
    h.ip.g['ui_req_cap'] = 1.0
    h.ip.g['play_state'] = 0.0
    run(h, 2)
    check('SAMPLE arms', g(h, 'cap_armed') == 1 and g(h, 'cap_rec') == 0)
    h.ip.g['play_state'] = 1.0
    h.beat = 8.0 + 0.5
    ev = run(h, 200, {1: [note_on(0, 50, 90)], 30: [note_off(0, 50)], 60: [note_on(100, 55, 80)], 90: [note_off(0, 55)]})
    check('recording, and passing the input through', g(h, 'cap_rec') == 1 and len(ons(ev)) == 2)
    h.ip.g['play_state'] = 0.0
    run(h, 2)
    s0 = int(g(h, 'SRC'))
    check('stop turns the capture into the phrase', g(h, 'src_n') == 2 and g(h, 'cap_armed') == 0)
    check('capture keeps the first note\'s place in its beat', abs(mem(h, s0) - (0.5 + BL / BEAT)) < 0.001, mem(h, s0))
    check('capture length rounded up to a bar', g(h, 'src_len') == 4, g(h, 'src_len'))
    check('captured pitches', mem(h, s0 + 2) == 50 and mem(h, s0 + 7) == 55)

    # ------------------------------------------------------------- import
    section('script import')
    h = fresh(); h._abs = BL
    gm = h.ip.gmem
    for k, v in zip(range(100, 105), (0, 1, 64, 100, 0)): gm[k] = v
    gm[1] = 12345; gm[2] = 1; gm[3] = 4; gm[4] = 100; gm[0] = 999
    run(h, 1)
    check('import for another instance is ignored', g(h, 'src_n') > 40)
    load(h, LINE, 8, name='My loop')
    check('import for this instance loads', g(h, 'src_n') == 8 and g(h, 'src_len') == 8)
    check('import acknowledged', h.ip.gmem.get(10) == h.ip.gmem.get(0) and h.ip.gmem.get(11) == 8)
    check('phrase name carried over', h.ip.sget(h.ip.nstr('#src_name')) == 'My loop', h.ip.sget(h.ip.nstr('#src_name')))
    h2 = Host(JSFX)
    h2.ip.gmem = h.ip.gmem
    h2.p.run('init')
    h2.block(BL)
    check('a new instance ignores an import left from before it existed', h2.ip.g['src_n'] > 40)

    lua = shutil.which('lua5.4') or shutil.which('lua')
    if lua:
        out = subprocess.run([lua, os.path.join(HERE, 'test_loader.lua'), '--dump'],
                             capture_output=True, text=True).stdout
        h = fresh(); h._abs = BL
        h.ip.g['slider48'] = 424242.0
        for line in out.split():
            k, v = line.split('=')
            h.ip.gmem[int(k)] = float(v)
        run(h, 2)
        s0 = int(g(h, 'SRC'))
        check('end to end: loader script output loads into the plug-in',
              g(h, 'src_n') == 3 and g(h, 'src_len') == 4 and mem(h, s0 + 5) == 1 and mem(h, s0 + 9) == 9)
        check('end to end: take marker becomes a slice', g(h, 'slider1') == 3 and g(h, 'slice_n') == 2)
        check('end to end: name', h.ip.sget(h.ip.nstr('#src_name')) == 'Beat A')
    else:
        print('  (lua not installed - skipping the end-to-end loader check)')

    # ----------------------------------------------------------- save/load
    section('project save / load')
    h = mk(notes=LINE, length=8, markers=(3.0,), chop=3)
    pad_set(h, 7, 'PF_TRANS', 5); pad_set(h, 3, 'PF_NOTE', 70)
    state = h.save_state()
    h2 = Host(JSFX)
    h2.load_state(state)
    h2.p.run('init')
    h2.ip.g['slider1'] = 3.0
    h2.block(BL)
    check('phrase restored', h2.ip.g['src_n'] == 8 and h2.ip.g['src_len'] == 8)
    check('markers restored', h2.ip.g['mark_ui_n'] == 1 and h2.ip.g['slice_n'] == 2)
    check('pad settings restored', pad_get(h2, 7, 'PF_TRANS') == 5 and pad_get(h2, 3, 'PF_NOTE') == 70)
    check('restored phrase is not replaced by the demo', h2.ip.sget(h2.ip.nstr('#src_name')) == 'test')

    # ----------------------------------------------------------------- UI
    section('panel')
    h = mk(notes=LINE, length=8, chop=1, grid=4)
    ip = h.ip
    def click(x, y, cap=1):
        ip.g['mouse_x'], ip.g['mouse_y'], ip.g['mouse_cap'] = float(x), float(y), float(cap)
        h.gfx()
    def release(x, y):
        ip.g['mouse_x'], ip.g['mouse_y'], ip.g['mouse_cap'] = float(x), float(y), 0.0
        h.gfx()
    h.gfx()
    check('panel draws', True)
    click(12 + 2 * 100 + 40, 296 + 3 * 90 + 40)             # bank A, pad 3 (bottom row)
    check('clicking a pad selects it', g(h, 'ui_pad') == 2, g(h, 'ui_pad'))
    ev = run(h, 20)
    check('... and auditions it', ons(ev) and ons(ev)[0][2] == 64, ons(ev))
    release(12 + 2 * 100 + 40, 296 + 3 * 90 + 40)
    click(12 + 3 * 98 + 40, 278)                             # bank D
    check('bank buttons switch banks', g(h, 'ui_bank') == 3 and g(h, 'ui_pad') == 50)
    release(12 + 3 * 98 + 40, 278); click(52, 278); release(52, 278)
    # drag slice 4 (beats 6..8 -> x = 12 + 976 * 7/8) onto pad A01 (bottom-left)
    click(12 + 976 * 7 / 8, 150)
    ip.g['mouse_x'], ip.g['mouse_y'] = 50.0, 296 + 3 * 90 + 40.0
    h.gfx()
    release(50, 296 + 3 * 90 + 40)
    check('dragging a slice onto a pad maps it', pad_get(h, 0, 'PF_SLICE') == 3, pad_get(h, 0, 'PF_SLICE'))
    click(56 + 3 * 72 + 30, 58); release(56 + 3 * 72 + 30, 58)
    check('chop mode buttons', g(h, 'slider1') == 3)
    run(h, 1)
    for k in range(2):
        click(12 + 976 * 0.3, 150); release(12 + 976 * 0.3, 150)
    run(h, 1)
    check('double-click adds a marker in Markers mode', g(h, 'mark_ui_n') == 1 and g(h, 'slice_n') == 2,
          (g(h, 'mark_ui_n'), g(h, 'slice_n')))
    # knob drag: the FX tab, filter cutoff
    click(416 + 110 + 50, 278); release(416 + 110 + 50, 278)
    check('FX tab', g(h, 'ui_tab') == 1)
    before = g(h, 'slider14')
    click(570 + 104 + 48, 352 + 36)
    ip.g['mouse_y'] = 352 + 36 - 40.0; h.gfx()
    release(570 + 104 + 48, 352 + 36 - 40)
    check('dragging a knob up raises it', g(h, 'slider14') > before, (before, g(h, 'slider14')))
    click(416 + 20, 298 + 48 * 3 + 20); release(416 + 20, 298 + 48 * 3 + 20)
    check('FX list LED switches the effect on', g(h, 'slider31') == 1 and g(h, 'ui_fx') == 3)

    print('\n%d passed, %d failed' % (_state['pass'], _state['fail']))
    return 1 if _state['fail'] else 0


if __name__ == '__main__':
    sys.exit(main())

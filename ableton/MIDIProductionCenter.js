/* MIDI Production Center - built by ableton/kit/build.py from ableton/device.json. Do not edit; edit the sources and rebuild. */
var DEVICE = {"main": "MIDI_Production_Center.jsfx", "title": "MIDI Production Center"};
DEVICE.files = {"MIDI_Production_Center.jsfx": "desc:MIDI Production Center - 16-pad MIDI sampler (chop, pads, MIDI FX)\ntags: MIDI sampler chopper pads MPC slicer\n//\n// An MPC-style pad sampler whose \"samples\" are MIDI phrases. Load a phrase\n// (sample it live, or send a MIDI item with the included script), chop it into\n// slices by transients, a grid, equal parts or your own markers, and play the\n// slices from 64 pads (4 banks of 16). Every pad and effect works on notes:\n//\n//   Filter      removes notes above / below / around a cutoff pitch\n//   EQ          raises or lowers velocity of notes in bands of the keyboard\n//   Compressor  pulls velocities, pitches or timing closer together\n//   Delay       repeats notes, with feedback and optional pitch steps\n//   Stutter     beat-repeats a short window of whatever the pads are playing\n//   Pitch       corrects notes to a key and scale\n//\n// Put it before an instrument on a track. See README.md for the full guide.\n//\n// Copyright (c) 2026 KallumS. GPL v3 (see LICENSE).\n\nin_pin:none\nout_pin:none\noptions:no_meter gfx_hz=30 gmem=MIDIProductionCenter\n\nimport mpc_core.jsfx-inc\nimport mpc_engine.jsfx-inc\nimport mpc_ui.jsfx-inc\n\n// Every slider is hidden with the \"-\" prefix: the custom panel draws them all,\n// and visible sliders would push the panel below the fold. They stay\n// automatable and are listed under the FX window's \"Param\" button.\n\n// --- chop ---------------------------------------------------------------------\nslider1:0<0,3,1{Transient,Grid,Equal,Markers}>-Chop Mode\nslider2:60<0,100,1>-Transient Sensitivity\nslider3:3<0,6,1{1/32,1/16,1/8,1/4,1/2,1 Bar,2 Bars}>-Chop Grid\nslider4:16<2,64,1>-Equal Slices\nslider5:1<0,1,1{Off,On}>-Include Held Notes\n\n// --- global -------------------------------------------------------------------\nslider6:0<0,1,1{Sync to Project,Original Tempo}>-Time Mode\nslider7:50<50,75,1>-Swing\nslider8:0<0,1,1{Absolute,Relative to Pad}>-Pitch Axis\nslider9:1<0,1,1{Off,On}>-Thru Unmapped Notes\nslider10:0<0,16,1{Source,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16}>-Output Channel\nslider11:100<0,200,1>-Master Level\n\n// --- filter -------------------------------------------------------------------\nslider12:0<0,1,1{Off,On}>-Filter\nslider13:0<0,3,1{Low-Pass,High-Pass,Band-Pass,Notch}>-Filter Type\nslider14:72<0,127,1>-Filter Cutoff\nslider15:0<0,24,1>-Filter Slope\nslider16:0<0,100,1>-Filter Resonance\nslider17:12<1,48,1>-Filter Width\n\n// --- EQ -----------------------------------------------------------------------\nslider18:0<0,1,1{Off,On}>-EQ\nslider19:48<0,127,1>-EQ Low Note\nslider20:0<-100,100,1>-EQ Low Gain\nslider21:64<0,127,1>-EQ Mid Note\nslider22:0<-100,100,1>-EQ Mid Gain\nslider23:12<1,48,1>-EQ Mid Width\nslider24:80<0,127,1>-EQ High Note\nslider25:0<-100,100,1>-EQ High Gain\n\n// --- compressor ---------------------------------------------------------------\nslider26:0<0,1,1{Off,On}>-Compressor\nslider27:0<0,2,1{Velocity,Pitch,Timing}>-Compressor Target\nslider28:80<0,127,1>-Compressor Threshold\nslider29:4<1,20,0.1>-Compressor Ratio\nslider30:0<-64,64,1>-Compressor Makeup\n\n// --- delay --------------------------------------------------------------------\nslider31:0<0,1,1{Off,On}>-Delay\nslider32:5<0,11,1{1/32,1/16T,1/16,1/16D,1/8T,1/8,1/8D,1/4T,1/4,1/4D,1/2,1 Bar}>-Delay Time\nslider33:50<0,100,1>-Delay Feedback\nslider34:4<1,16,1>-Delay Repeats\nslider35:0<-12,12,1>-Delay Pitch Step\nslider36:50<0,100,1>-Delay Mix\n\n// --- stutter ------------------------------------------------------------------\nslider37:0<0,1,1{Off,On}>-Stutter\nslider38:3<0,7,1{1/64,1/32,1/16T,1/16,1/8T,1/8,1/4,1/2}>-Stutter Size\nslider39:0<0,32,1>-Stutter Repeats\nslider40:0<0,100,1>-Stutter Decay\nslider41:0<-12,12,1>-Stutter Pitch Step\nslider42:100<5,100,1>-Stutter Gate\nslider43:0<0,128,1>-Stutter Trigger Note\n\n// --- pitch correction ---------------------------------------------------------\nslider44:0<0,1,1{Off,On}>-Pitch Correction\nslider45:0<0,11,1{C,C#,D,D#,E,F,F#,G,G#,A,A#,B}>-Key\nslider46:0<0,11,1{Major,Natural Minor,Harmonic Minor,Melodic Minor,Dorian,Phrygian,Lydian,Mixolydian,Locrian,Major Pentatonic,Minor Pentatonic,Blues}>-Scale\nslider47:0<0,3,1{Nearest,Up,Down,Remove}>-Correct Mode\n\n// --- housekeeping -------------------------------------------------------------\n// Lets the loader script address this instance. Generated once, then saved.\nslider48:0<0,1000000,1>-Instance ID\n\n@init\n\next_noinit = 1;\ngfx_ext_retina = 1;\nmpc_consts();\nmpc_ui_consts();\nmpc_build_ui();\nmpc_boot();\n\n@slider\n\n// Parameters are read in @block (mpc_read_params): the panel writes sliders\n// directly and @slider is not reliably re-run for those writes.\nmpc_params_dirty = 1;\n\n@block\n\nmpc_block();\n\n@serialize\n\n// @serialize can run before @init, so the memory map must exist first.\nmpc_consts();\nmpc_serialize();\n\n@gfx 1000 660\n\ngfx_getchar();\nmpc_ui_frame();\n", "mpc_core.jsfx-inc": "// mpc_core.jsfx-inc\n// MIDI Production Center - memory map, source phrase, chop analysis, pads and\n// project state (@serialize).\n//\n// Imported files may only DEFINE functions in @init: statements placed here\n// are not guaranteed to run. MIDI_Production_Center.jsfx calls everything.\n// No function may call one declared after it (EEL2 has no recursion or\n// forward references), so the order in this file matters.\n//\n// Copyright (c) 2026 KallumS. GPL v3 (see LICENSE).\n\n@init\n\n// ---------------------------------------------------------------------------\n// Memory map - the ONLY place addresses are defined.\n// ---------------------------------------------------------------------------\nfunction mpc_consts()\n(\n  EPS = 0.0001;              // beat tolerance used everywhere\n  MINLEN = 0.001;            // shortest note, in beats\n\n  // source phrase: one record per note\n  MAX_NOTES = 8192; N_ST = 5;          // start, length (beats), pitch, vel, chan\n  // chop markers (beats). MARK_UI is edited by the panel, MARK is the audio\n  // thread's sorted copy (the two run on different threads).\n  MAX_MARK = 256;\n  // slices: the current chops (start, end in beats), at most 64\n  MAX_SLICES = 64; SL_ST = 2; SF_S = 0; SF_E = 1;\n  NO_SLICE = 64;                        // pad label: empty\n  // play-list entry: q (beats from the region start), len, pitch, vel, chan\n  L_ST = 5;\n  // pads: 4 banks x 16. A pad holds its OWN region of the phrase (PF_S..PF_E,\n  // beats), set by \"transfer to pads\" or by dropping a slice on it, so\n  // re-chopping never changes a pad by itself. PF_SLICE is only a label: the\n  // slice it came from (-1 = whole phrase, NO_SLICE = empty).\n  MAX_PADS = 64; P_ST = 16;\n  PF_SLICE = 0; PF_NOTE = 1; PF_MODE = 2; PF_TRANS = 3; PF_TAPE = 4; PF_STRETCH = 5;\n  PF_FIT = 6; PF_LEVEL = 7; PF_VSENS = 8; PF_REV = 9; PF_CHOKE = 10; PF_POLY = 11;\n  PF_FX = 12; PF_CHAN = 13; PF_S = 14; PF_E = 15;\n  MODE_ONESHOT = 0; MODE_GATE = 1; MODE_LOOP = 2; MODE_TOGGLE = 3;\n  // voices, each with a private (warped) copy of its slice's play list\n  MAX_V = 32; V_ST = 32; VL_MAX = 4096;\n  V_ON = 0; V_PAD = 1; V_T = 2; V_POS = 3; V_IDX = 4; V_N = 5; V_L = 6; V_LOOP = 7;\n  V_VEL = 8; V_NOTE = 9; V_LO = 10; V_HI = 11; V_STUT = 12; V_SPOS = 13; V_SSTART = 14;\n  V_SIDX = 15; V_SREP = 16; V_END = 17; V_AGE = 18; V_FX = 19; V_REV = 20; V_SLICE = 21;\n  V_S = 22; V_HELD = 23; V_SDONE = 24;\n  // output scheduler\n  MAX_Q = 8192; Q_ST = 8;\n  // event types; owner = voice index, +TAIL for FX tails (delay repeats),\n  // which releasing or choking a pad must not cut\n  QT_ON = 1; QT_OFF = 2; QT_RAW = 3; TAIL = 64;\n  MAX_CAND = 8192;\n\n  SRC     = 1024;\n  MARK    = SRC + MAX_NOTES * N_ST;\n  MARK_UI = MARK + MAX_MARK;\n  SLICE   = MARK_UI + MAX_MARK;\n  CHOPS   = SLICE + MAX_SLICES * SL_ST;\n  PAD     = CHOPS + MAX_SLICES + 8;\n  PADCLIP = PAD + MAX_PADS * P_ST;               // copy / paste buffer\n  VOICE   = PADCLIP + P_ST;\n  VLIST   = VOICE + MAX_V * V_ST;\n  QUEUE   = VLIST + MAX_V * VL_MAX * L_ST;\n  QFREE   = QUEUE + MAX_Q * Q_ST;                // free-slot stack\n  DUE     = QFREE + MAX_Q;                       // this block's due events\n  SOUND   = DUE + MAX_Q;                         // 2048 keys x (id, voice, flag)\n  CAPT    = SOUND + 2048 * 3;                    // live capture buffer\n  CAPP    = CAPT + MAX_NOTES * N_ST;             // capture: pending note per key\n  CAND    = CAPP + 2048;                         // onset candidates (pos, strength)\n  PADHIT  = CAND + MAX_CAND * 2;                 // last trigger time per pad\n  TBL     = PADHIT + MAX_PADS;                   // lookup tables, below\n  CTL     = TBL + 512;                           // panel controls\n  MEM_END = CTL + 256 * 24;\n\n  // value tables for enum sliders\n  GRIDV = TBL;        // chop grid (beats; bars resolved at use)\n  GRIDV[0] = 0.125; GRIDV[1] = 0.25; GRIDV[2] = 0.5; GRIDV[3] = 1; GRIDV[4] = 2;\n  GRIDV[5] = -1; GRIDV[6] = -2;                  // negative = bars\n  DELV = TBL + 16;    // delay times (beats)\n  DELV[0] = 0.125; DELV[1] = 1/6; DELV[2] = 0.25; DELV[3] = 0.375; DELV[4] = 1/3;\n  DELV[5] = 0.5; DELV[6] = 0.75; DELV[7] = 2/3; DELV[8] = 1; DELV[9] = 1.5;\n  DELV[10] = 2; DELV[11] = 4;\n  STUTV = TBL + 32;   // stutter window (beats)\n  STUTV[0] = 0.0625; STUTV[1] = 0.125; STUTV[2] = 1/6; STUTV[3] = 0.25;\n  STUTV[4] = 1/3; STUTV[5] = 0.5; STUTV[6] = 1; STUTV[7] = 2;\n  FITV = TBL + 48;    // pad \"fit to\" lengths (beats)\n  FITV[0] = 0; FITV[1] = 0.5; FITV[2] = 1; FITV[3] = 2; FITV[4] = 4;\n  FITV[5] = 8; FITV[6] = 16; FITV[7] = 32;\n  // scales as 12-bit pitch-class masks (bit k = pitch class k above the key)\n  SCALEM = TBL + 64;\n  SCALEM[0] = 2741; SCALEM[1] = 1453; SCALEM[2] = 2477; SCALEM[3] = 2733;\n  SCALEM[4] = 1709; SCALEM[5] = 1451; SCALEM[6] = 2773; SCALEM[7] = 1717;\n  SCALEM[8] = 1387; SCALEM[9] = 661;  SCALEM[10] = 1193; SCALEM[11] = 1257;\n\n  ONSET_WIN = 0.04;          // notes starting this close together are one hit\n  MIN_GAP = 0.0625;          // shortest transient slice (a 1/64 note)\n  TAIL_MIN = 0.01;           // a held note must reach this far into a slice\n);\n\nfunction mpc_clamp(v, a, b) ( v < a ? a : v > b ? b : v; );\n\n// ---------------------------------------------------------------------------\n// Sorting: iterative heapsort over fixed-stride records, keyed on field kf\n// with field k2 as the tie-break. (No recursion is available.)\n// ---------------------------------------------------------------------------\nfunction mpc_rec_less(a, b, kf, k2)\n(\n  a[kf] < b[kf] || (a[kf] === b[kf] && a[k2] < b[k2]);\n);\n\nfunction mpc_rec_swap(a, b, st) local(i, t)\n(\n  i = 0;\n  loop(st, t = a[i]; a[i] = b[i]; b[i] = t; i += 1; );\n);\n\nfunction mpc_sift(base, root, lim, st, kf, k2) local(child, sw)\n(\n  while (root * 2 + 1 < lim) (\n    child = root * 2 + 1;\n    sw = root;\n    mpc_rec_less(base + sw * st, base + child * st, kf, k2) ? sw = child;\n    child + 1 < lim && mpc_rec_less(base + sw * st, base + (child + 1) * st, kf, k2) ? sw = child + 1;\n    sw == root ? (\n      root = lim;\n    ) : (\n      mpc_rec_swap(base + root * st, base + sw * st, st);\n      root = sw;\n    );\n  );\n);\n\nfunction mpc_sort(base, n, st, kf, k2) local(i)\n(\n  n > 1 ? (\n    i = floor((n - 2) / 2);\n    while (i >= 0) ( mpc_sift(base, i, n, st, kf, k2); i -= 1; );\n    i = n - 1;\n    while (i > 0) (\n      mpc_rec_swap(base, base + i * st, st);\n      mpc_sift(base, 0, i, st, kf, k2);\n      i -= 1;\n    );\n  );\n);\n\n// ---------------------------------------------------------------------------\n// Parameters: sliders fanned out into named globals once per block.\n// ---------------------------------------------------------------------------\nfunction mpc_read_params()\n(\n  p_chop = slider1; p_sens = slider2; p_grid = slider3; p_equal = slider4; p_tails = slider5;\n  p_timemode = slider6; p_swing = slider7; p_axis = slider8; p_thru = slider9;\n  p_outch = slider10; p_master = slider11;\n  p_flt = slider12; p_flt_type = slider13; p_flt_cut = slider14; p_flt_slope = slider15;\n  p_flt_res = slider16; p_flt_width = slider17;\n  p_eq = slider18; p_eq_lf = slider19; p_eq_lg = slider20; p_eq_mf = slider21;\n  p_eq_mg = slider22; p_eq_mw = slider23; p_eq_hf = slider24; p_eq_hg = slider25;\n  p_cmp = slider26; p_cmp_tgt = slider27; p_cmp_thr = slider28; p_cmp_ratio = slider29;\n  p_cmp_make = slider30;\n  p_dly = slider31; p_dly_time = slider32; p_dly_fb = slider33; p_dly_rep = slider34;\n  p_dly_pitch = slider35; p_dly_mix = slider36;\n  p_st = slider37; p_st_size = slider38; p_st_rep = slider39; p_st_decay = slider40;\n  p_st_pitch = slider41; p_st_gate = slider42; p_st_note = slider43;\n  p_pc = slider44; p_pc_key = slider45; p_pc_scale = slider46; p_pc_mode = slider47;\n  mpc_params_dirty = 0;\n);\n\nfunction mpc_bar_beats() ( src_tsd > 0 ? src_tsn * 4 / src_tsd : 4; );\n\nfunction mpc_grid_beats(i) local(g)\n(\n  g = GRIDV[mpc_clamp(i | 0, 0, 6)];\n  g < 0 ? -g * mpc_bar_beats() : g;\n);\n\n// ---------------------------------------------------------------------------\n// Pads\n// ---------------------------------------------------------------------------\nfunction mpc_pad_default(p) local(a)\n(\n  a = PAD + p * P_ST;\n  memset(a, 0, P_ST);\n  a[PF_SLICE] = NO_SLICE;          // empty until a transfer fills it\n  a[PF_NOTE] = min(36 + p, 127);   // note 36 upwards, chromatic\n  a[PF_MODE] = MODE_ONESHOT;\n  a[PF_STRETCH] = 100;\n  a[PF_LEVEL] = 100;\n  a[PF_VSENS] = 50;\n  a[PF_FX] = 1;\n);\n\nfunction mpc_pads_default() local(p)\n(\n  p = 0;\n  loop(MAX_PADS, mpc_pad_default(p); p += 1; );\n);\n\n// ---------------------------------------------------------------------------\n// Source phrase\n// ---------------------------------------------------------------------------\nfunction mpc_src_add(s, l, p, v, c) local(a)\n(\n  src_n < MAX_NOTES ? (\n    a = SRC + src_n * N_ST;\n    a[0] = max(s, 0); a[1] = max(l, MINLEN);\n    a[2] = mpc_clamp(p | 0, 0, 127); a[3] = mpc_clamp(v | 0, 1, 127);\n    a[4] = mpc_clamp(c | 0, 0, 15);\n    src_n += 1;\n  );\n);\n\n// Longest note (so region scans know how far back a held note can start);\n// returns the latest note end.\nfunction mpc_src_stats() local(i, e)\n(\n  e = 0; src_maxlen = 0; i = 0;\n  loop(src_n,\n    e = max(e, SRC[i * N_ST] + SRC[i * N_ST + 1]);\n    src_maxlen = max(src_maxlen, SRC[i * N_ST + 1]);\n    i += 1;\n  );\n  e;\n);\n\n// First phrase index whose start is >= x (the phrase is sorted by start).\nfunction mpc_src_find(x) local(lo, hi, mid)\n(\n  lo = 0; hi = src_n;\n  while (lo < hi) (\n    mid = floor((lo + hi) / 2);\n    SRC[mid * N_ST] < x - 0.0000001 ? lo = mid + 1 : hi = mid;\n  );\n  lo;\n);\n\n// Notes starting in [S, E).\nfunction mpc_count_in(S, E) ( mpc_src_find(E - EPS) - mpc_src_find(S - EPS); );\n\n// Sorts the phrase by start (then pitch), fills in a missing length and tells\n// everything downstream that the source changed. A new phrase is transferred\n// to the pads automatically once it has been chopped.\nfunction mpc_src_finalize() local(e)\n(\n  mpc_sort(SRC, src_n, N_ST, 0, 2);\n  e = mpc_src_stats();\n  src_len <= EPS ? src_len = ceil(e - EPS);\n  src_len <= EPS ? src_len = 4;\n  src_tempo < 1 ? src_tempo = 120;\n  src_tsn < 1 ? src_tsn = 4;\n  src_tsd < 1 ? src_tsd = 4;\n  src_rev += 1;\n  xfer_pending = 1;\n);\n\n// A two-bar groove so the plug-in does something the moment it is loaded:\n// drums on channel 10 plus a chord part, which shows off the pitch-based FX.\nfunction mpc_src_demo() local(b, k)\n(\n  src_n = 0; src_len = 8; src_tempo = 96; src_tsn = 4; src_tsd = 4;\n  b = 0;\n  loop(2,\n    mpc_src_add(b + 0,    0.25, 36, 118, 9);\n    mpc_src_add(b + 0.75, 0.25, 36, 92,  9);\n    mpc_src_add(b + 2.5,  0.25, 36, 110, 9);\n    mpc_src_add(b + 1,    0.25, 38, 112, 9);\n    mpc_src_add(b + 3,    0.25, 38, 116, 9);\n    k = 0;\n    loop(8, mpc_src_add(b + k * 0.5, 0.2, 42, k & 1 ? 58 : 88, 9); k += 1; );\n    b += 4;\n  );\n  // Cm9 / Abmaj7 / Fm9 / G7\n  mpc_src_add(0, 1.5, 48, 84, 0); mpc_src_add(0, 1.5, 63, 76, 0);\n  mpc_src_add(0, 1.5, 67, 72, 0); mpc_src_add(0, 1.5, 70, 70, 0); mpc_src_add(0, 1.5, 74, 66, 0);\n  mpc_src_add(2, 1.5, 44, 82, 0); mpc_src_add(2, 1.5, 60, 74, 0);\n  mpc_src_add(2, 1.5, 63, 70, 0); mpc_src_add(2, 1.5, 67, 68, 0);\n  mpc_src_add(4, 1.5, 41, 84, 0); mpc_src_add(4, 1.5, 60, 74, 0);\n  mpc_src_add(4, 1.5, 63, 70, 0); mpc_src_add(4, 1.5, 67, 70, 0); mpc_src_add(4, 1.5, 68, 64, 0);\n  mpc_src_add(6, 1.75, 43, 86, 0); mpc_src_add(6, 1.75, 59, 76, 0);\n  mpc_src_add(6, 1.75, 62, 72, 0); mpc_src_add(6, 1.75, 65, 70, 0); mpc_src_add(6, 1.75, 67, 68, 0);\n  // a short melody on top\n  mpc_src_add(1.5, 0.5, 79, 90, 0); mpc_src_add(2.5, 0.5, 77, 84, 0);\n  mpc_src_add(3.5, 0.5, 75, 88, 0); mpc_src_add(5.5, 0.5, 72, 86, 0);\n  mpc_src_add(7,   0.5, 74, 92, 0); mpc_src_add(7.5, 0.5, 71, 80, 0);\n  mark_ui_n = 0; mark_rev += 1;\n  strcpy(#src_name, \"Demo groove\");\n  mpc_src_finalize();\n);\n\n// ---------------------------------------------------------------------------\n// Chopping\n// ---------------------------------------------------------------------------\n\n// Fills CHOPS[] with slice start positions and returns how many there are.\nfunction mpc_chop_starts() local(n, i, j, s, str, maxs, thr, last, g, k, cnt, m)\n(\n  n = 0;\n  src_n > 0 && src_len > EPS ? (\n    p_chop == 0 ? (\n      // Transient: a \"hit\" is every group of notes starting within ONSET_WIN.\n      // Its strength is the summed velocity, like the energy of an audio\n      // transient. Sensitivity sets how strong a hit must be (relative to the\n      // strongest) to start a slice. The first hit always starts one.\n      ncand = 0; maxs = 0; i = 0;\n      while (i < src_n) (\n        s = SRC[i * N_ST]; str = 0; j = i;\n        while (j < src_n && SRC[j * N_ST] - s < ONSET_WIN) (\n          str += SRC[j * N_ST + 3]; j += 1;\n        );\n        ncand < MAX_CAND ? ( CAND[ncand * 2] = s; CAND[ncand * 2 + 1] = str; ncand += 1; );\n        maxs = max(maxs, str);\n        i = j;\n      );\n      thr = maxs * (1 - p_sens / 100) * 0.999;\n      last = -1000; i = 0;\n      while (i < ncand && n < MAX_SLICES) (\n        (i == 0 || CAND[i * 2 + 1] >= thr) && CAND[i * 2] - last >= MIN_GAP ? (\n          CHOPS[n] = CAND[i * 2]; last = CHOPS[n]; n += 1;\n        );\n        i += 1;\n      );\n    ) : p_chop == 1 ? (\n      g = max(mpc_grid_beats(p_grid), 0.03125);\n      k = 0;\n      while (k * g < src_len - EPS && n < MAX_SLICES) ( CHOPS[n] = k * g; n += 1; k += 1; );\n    ) : p_chop == 2 ? (\n      cnt = mpc_clamp(p_equal | 0, 1, MAX_SLICES);\n      k = 0;\n      loop(cnt, CHOPS[n] = src_len * k / cnt; n += 1; k += 1; );\n    ) : (\n      // Markers: every marker starts a slice, plus the phrase start if any\n      // notes come before the first marker.\n      m = mark_n > 0 ? MARK[0] : src_len;\n      mark_n == 0 || SRC[0] < m - EPS ? ( CHOPS[0] = 0; n = 1; );\n      i = 0;\n      while (i < mark_n && n < MAX_SLICES) (\n        m = MARK[i];\n        (n == 0 || m > CHOPS[n - 1] + EPS) && m >= 0 && m < src_len - EPS ? ( CHOPS[n] = m; n += 1; );\n        i += 1;\n      );\n    );\n  );\n  n;\n);\n\n// Writes the notes of region [S, E) to dst as a play list (at most maxn\n// entries): q = beats from S in playing order, notes clipped to the region,\n// held notes crossing S included when \"Held notes\" is on. Reversed, a note\n// [q, q+len] plays at L - (q + len), so its length survives. Returns the\n// count; rl_lo / rl_hi get the pitch range.\nfunction mpc_region_list(dst, maxn, S, E, rev) local(i, a, b, s, e, cs, ce, n, L)\n(\n  n = 0; rl_lo = 128; rl_hi = -1; L = E - S;\n  i = mpc_src_find(S - src_maxlen - EPS);\n  while (i < src_n && SRC[i * N_ST] < E - EPS && n < maxn) (\n    a = SRC + i * N_ST;\n    s = a[0]; e = s + a[1];\n    s >= S - EPS || (p_tails && e > S + TAIL_MIN) ? (\n      cs = max(s, S); ce = min(e, E);\n      ce < cs + MINLEN ? ce = cs + MINLEN;\n      b = dst + n * L_ST;\n      b[0] = rev ? max(L - (ce - S), 0) : cs - S;\n      b[1] = ce - cs; b[2] = a[2]; b[3] = a[3]; b[4] = a[4];\n      rl_lo = min(rl_lo, a[2]); rl_hi = max(rl_hi, a[2]);\n      n += 1;\n    );\n    i += 1;\n  );\n  rev ? mpc_sort(dst, n, L_ST, 0, 2);\n  n == 0 ? ( rl_lo = 60; rl_hi = 60; );\n  n;\n);\n\n// ---------------------------------------------------------------------------\n// Pad regions and \"transfer to pads\"\n// ---------------------------------------------------------------------------\nfunction mpc_pad_has(p) ( PAD[p * P_ST + PF_E] > PAD[p * P_ST + PF_S] + EPS; );\n\n// Gives pad p the region of slice si (-1 = whole phrase, anything past the\n// chops = empty).\nfunction mpc_pad_set_slice(p, si) local(a)\n(\n  a = PAD + p * P_ST;\n  si = si | 0;\n  si < 0 ? (\n    a[PF_SLICE] = -1; a[PF_S] = 0; a[PF_E] = src_len;\n  ) : si < slice_n ? (\n    a[PF_SLICE] = si; a[PF_S] = SLICE[si * SL_ST + SF_S]; a[PF_E] = SLICE[si * SL_ST + SF_E];\n  ) : (\n    a[PF_SLICE] = NO_SLICE; a[PF_S] = 0; a[PF_E] = 0;\n  );\n);\n\n// Fills the pads from `first` onwards with the current slices, in order,\n// carrying on into the next banks if needed. Pads after the last one filled\n// are emptied to the end of its bank (to pad 64 if `all`). Other pad settings\n// are kept. Returns how many slices went onto pads.\nfunction mpc_transfer(first, all) local(p, i, last)\n(\n  first = mpc_clamp(first | 0, 0, MAX_PADS - 1);\n  p = first; i = 0;\n  while (i < slice_n && p < MAX_PADS) ( mpc_pad_set_slice(p, i); p += 1; i += 1; );\n  last = all ? MAX_PADS : min(max(ceil(p / 16), floor(first / 16) + 1) * 16, MAX_PADS);\n  while (p < last) ( mpc_pad_set_slice(p, NO_SLICE); p += 1; );\n  xfer_chop_rev = chop_rev;\n  i;\n);\n\n// Re-cuts the phrase into SLICE. Pads keep their own regions, so this never\n// changes what a pad plays until the next transfer.\nfunction mpc_chop() local(n, i, sl)\n(\n  // the audio thread's sorted copy of the panel's markers\n  mark_n = mpc_clamp(mark_ui_n | 0, 0, MAX_MARK);\n  memcpy(MARK, MARK_UI, mark_n);\n  mpc_sort(MARK, mark_n, 1, 0, 0);\n\n  n = mpc_chop_starts();\n  slice_n = min(n, MAX_SLICES);\n  i = 0;\n  loop(n,\n    sl = SLICE + i * SL_ST;\n    sl[SF_S] = CHOPS[i];\n    sl[SF_E] = i + 1 < n ? CHOPS[i + 1] : src_len;\n    i += 1;\n  );\n  chop_rev += 1;\n\n  // projects saved by version 1 stored a slice number per pad, not a region\n  pads_migrate ? (\n    i = 0;\n    loop(MAX_PADS, mpc_pad_set_slice(i, PAD[i * P_ST + PF_SLICE]); i += 1; );\n    pads_migrate = 0;\n    xfer_chop_rev = chop_rev;\n  );\n  // a new phrase goes straight onto the pads\n  xfer_pending ? ( mpc_transfer(0, 1); xfer_pending = 0; );\n);\n\n// Everything the slices depend on. Compared field by field each block so the\n// chop only re-runs when something relevant changed.\nfunction mpc_chop_if_needed() local(changed)\n(\n  changed = chop_force ||\n    ck_src !== src_rev || ck_mark !== mark_rev || ck_mode !== p_chop ||\n    ck_sens !== p_sens || ck_grid !== p_grid || ck_eq !== p_equal || ck_tails !== p_tails;\n  changed ? (\n    ck_src = src_rev; ck_mark = mark_rev; ck_mode = p_chop; ck_sens = p_sens;\n    ck_grid = p_grid; ck_eq = p_equal; ck_tails = p_tails;\n    chop_force = 0;\n    mpc_chop();\n  );\n);\n\n// ---------------------------------------------------------------------------\n// Project state\n// ---------------------------------------------------------------------------\nfunction mpc_serialize()\n(\n  file_avail(0) >= 0 ? (\n    // load\n    ser_ver = 0;\n    file_var(0, ser_ver);\n    ser_ver >= 1 ? (\n      file_var(0, ser_n);\n      ser_n = mpc_clamp(ser_n | 0, 0, MAX_NOTES);\n      file_var(0, src_len); file_var(0, src_tempo);\n      file_var(0, src_tsn); file_var(0, src_tsd);\n      ser_n > 0 ? file_mem(0, SRC, ser_n * N_ST);\n      src_n = ser_n;\n      mpc_src_stats();\n      file_var(0, ser_m);\n      ser_m = mpc_clamp(ser_m | 0, 0, MAX_MARK);\n      ser_m > 0 ? file_mem(0, MARK_UI, ser_m);\n      mark_ui_n = ser_m;\n      file_mem(0, PAD, MAX_PADS * P_ST);\n      file_var(0, ui_pad); file_var(0, ui_tab); file_var(0, ui_fx);\n      file_string(0, #src_name);\n      ser_ver == 1 ? pads_migrate = 1;\n      // the saved pads win over any automatic transfer queued before this\n      // load (e.g. of the demo phrase, if @init ran first)\n      xfer_pending = 0;\n      pads_ok = 1; src_ok = 1;\n      src_rev += 1; mark_rev += 1;\n    );\n  ) : (\n    // save\n    ser_ver = 2; ser_n = src_n; ser_m = mark_ui_n;\n    file_var(0, ser_ver);\n    file_var(0, ser_n);\n    file_var(0, src_len); file_var(0, src_tempo);\n    file_var(0, src_tsn); file_var(0, src_tsd);\n    ser_n > 0 ? file_mem(0, SRC, ser_n * N_ST);\n    file_var(0, ser_m);\n    ser_m > 0 ? file_mem(0, MARK_UI, ser_m);\n    file_mem(0, PAD, MAX_PADS * P_ST);\n    file_var(0, ui_pad); file_var(0, ui_tab); file_var(0, ui_fx);\n    file_string(0, #src_name);\n  );\n);\n", "mpc_engine.jsfx-inc": "// mpc_engine.jsfx-inc\n// MIDI Production Center - playback engine: output scheduler, the note FX\n// chain, pad voices with stutter, live sampling, script import and @block.\n//\n// Timing model: one absolute sample clock (mpc_now). Everything is scheduled\n// in absolute samples and only turned into a block offset when sent.\n//\n// Copyright (c) 2026 KallumS. GPL v3 (see LICENSE).\n\n@init\n\n// ---------------------------------------------------------------------------\n// Output scheduler\n// ---------------------------------------------------------------------------\nfunction mpc_q_reset() local(i)\n(\n  i = 0;\n  loop(MAX_Q, QUEUE[i * Q_ST] = 0; QFREE[i] = MAX_Q - 1 - i; i += 1; );\n  q_free_n = MAX_Q; q_used = 0;\n);\n\nfunction mpc_q_push(t, type, a, b, c, id, owner) local(i, e)\n(\n  q_free_n > 0 ? (\n    q_free_n -= 1;\n    i = QFREE[q_free_n];\n    e = QUEUE + i * Q_ST;\n    e[0] = 1; e[1] = t; e[2] = type; e[3] = a; e[4] = b; e[5] = c; e[6] = id; e[7] = owner;\n    q_used += 1;\n  );\n);\n\nfunction mpc_q_free(i)\n(\n  QUEUE[i * Q_ST] = 0;\n  QFREE[q_free_n] = i; q_free_n += 1;\n  q_used -= 1;\n);\n\n// Schedules one note. A note is only ever scheduled with its note-off, so\n// nothing can be left hanging.\nfunction mpc_out(t, p, vel, ch, len_s, owner)\n(\n  p = floor(p + 0.5);\n  vel = min(floor(vel + 0.5), 127);\n  p >= 0 && p <= 127 && vel >= 1 && q_free_n >= 2 ? (\n    note_id += 1;\n    mpc_q_push(t, QT_ON, ch, p, vel, note_id, owner);\n    mpc_q_push(t + max(len_s, 1), QT_OFF, ch, p, 0, note_id, owner);\n  );\n);\n\nfunction mpc_q_rank(type) ( type == QT_OFF ? 0 : type == QT_RAW ? 1 : 2; );\n\nfunction mpc_q_after(i, k) local(a, b)\n(\n  a = QUEUE + i * Q_ST; b = QUEUE + k * Q_ST;\n  a[1] > b[1] || (a[1] === b[1] && mpc_q_rank(a[2]) > mpc_q_rank(b[2]));\n);\n\n// Sends every event due in this block, in time order. A (channel, pitch) pair\n// can only sound once in MIDI, so a note-on over a sounding pair sends that\n// pair's note-off first, and a note-off only goes out if its note still owns\n// the pair.\nfunction mpc_q_run() local(endt, i, n, cnt, e, j, k, m, off, s)\n(\n  endt = mpc_now + samplesblock;\n  n = 0; i = 0; cnt = 0;\n  while (i < MAX_Q && cnt < q_used) (\n    e = QUEUE + i * Q_ST;\n    e[0] ? (\n      cnt += 1;\n      e[1] < endt ? ( DUE[n] = i; n += 1; );\n    );\n    i += 1;\n  );\n  j = 1;\n  while (j < n) (\n    k = DUE[j]; m = j - 1;\n    while (m >= 0 && mpc_q_after(DUE[m], k)) ( DUE[m + 1] = DUE[m]; m -= 1; );\n    DUE[m + 1] = k;\n    j += 1;\n  );\n  j = 0;\n  loop(n,\n    i = DUE[j];\n    e = QUEUE + i * Q_ST;\n    off = mpc_clamp(floor(e[1] - mpc_now), 0, max(samplesblock - 1, 0));\n    e[2] == QT_ON ? (\n      s = SOUND + (e[3] * 128 + e[4]) * 3;\n      s[0] ? midisend(off, $x80 | e[3], e[4], 0);\n      midisend(off, $x90 | e[3], e[4], e[5]);\n      s[0] = e[6]; s[1] = e[7];\n      diag_out_n += 1;\n    ) : e[2] == QT_OFF ? (\n      s = SOUND + (e[3] * 128 + e[4]) * 3;\n      s[0] === e[6] ? (\n        midisend(off, $x80 | e[3], e[4], 0);\n        s[0] = 0;\n      );\n    ) : (\n      midisend(off, e[3], e[4], e[5]);\n      (e[3] & $xF0) == $x90 ? diag_out_n += 1;\n    );\n    mpc_q_free(i);\n    j += 1;\n  );\n);\n\n// ---------------------------------------------------------------------------\n// Note FX. Pitch is the \"frequency\" axis and velocity the \"level\" axis.\n// ---------------------------------------------------------------------------\n\n// Where a pitch sits on the filter/EQ axis: the note number, or (Relative)\n// its place between the lowest and highest note of the pad's slice, 0..127.\nfunction mpc_axis(p, v) local(vv, lo, hi)\n(\n  p_axis ? (\n    vv = VOICE + v * V_ST; lo = vv[V_LO]; hi = vv[V_HI];\n    hi > lo ? (p - lo) / (hi - lo) * 127 : 64;\n  ) : p;\n);\n\n// Filter: 1 = untouched, 0 = removed, in between = quieter. d is how far the\n// note is past the corner, on the side the filter removes.\nfunction mpc_filter_gain(x) local(d, g)\n(\n  p_flt_type == 0 ? d = x - p_flt_cut :\n  p_flt_type == 1 ? d = p_flt_cut - x :\n  (\n    d = abs(x - p_flt_cut) - p_flt_width / 2;\n    p_flt_type == 3 ? d = -d;\n  );\n  g = d <= 0 ? 1 : p_flt_slope > 0 ? max(1 - d / p_flt_slope, 0) : 0;\n  // resonance lifts notes sitting right at the corner\n  g > 0 ? g *= 1 + p_flt_res / 100 * 0.6 * max(1 - abs(d) / 3, 0);\n  g;\n);\n\n// EQ: a velocity multiplier from a low shelf, a bell and a high shelf.\nfunction mpc_eq_gain(x) local(lo, hi, bell)\n(\n  lo = mpc_clamp((p_eq_lf + 3 - x) / 6, 0, 1);\n  hi = mpc_clamp((x - p_eq_hf + 3) / 6, 0, 1);\n  bell = exp(-0.5 * sqr((x - p_eq_mf) / max(p_eq_mw / 2, 0.5)));\n  1 + p_eq_lg / 100 * lo + p_eq_mg / 100 * bell + p_eq_hg / 100 * hi;\n);\n\n// Compressor, one rule for every target: whatever lies further than the\n// threshold from the reference is pulled in by the ratio.\nfunction mpc_comp_amount(d, thr) local(ad)\n(\n  ad = abs(d);\n  ad > thr ? sign(d) * (thr + (ad - thr) / max(p_cmp_ratio, 1)) : d;\n);\n\n// Timing target: pulls note starts towards the nearest 1/16. Applied when a\n// voice's play list is built, because a note can't be moved earlier once its\n// time has come.\nfunction mpc_tighten(q) local(g, n)\n(\n  g = 0.25;\n  n = floor(q / g + 0.5) * g;\n  n + mpc_comp_amount(q - n, p_cmp_thr / 127 * g / 2);\n);\n\n// Swing: delays every second 1/16 (50% = straight, 66% = triplet feel).\nfunction mpc_swing(q) local(P, A, M, base, ph)\n(\n  P = 0.5; A = 0.25; M = P * p_swing / 100;\n  base = floor(q / P) * P; ph = q - base;\n  base + (ph <= A ? ph * M / A : M + (ph - A) * (P - M) / (P - A));\n);\n\n// Pitch correction: returns the corrected note, or -1 to remove it.\nfunction mpc_pc_note(p) local(m, pc, up, dn)\n(\n  m = SCALEM[mpc_clamp(p_pc_scale | 0, 0, 11)];\n  pc = (p - (p_pc_key | 0) + 120) % 12;\n  (m >> pc) & 1 ? p : p_pc_mode == 3 ? -1 : (\n    up = 1;\n    while (up < 12 && !((m >> ((pc + up) % 12)) & 1)) ( up += 1; );\n    dn = 1;\n    while (dn < 12 && !((m >> ((pc - dn + 12) % 12)) & 1)) ( dn += 1; );\n    p_pc_mode == 1 ? p + up : p_pc_mode == 2 ? p - dn : dn <= up ? p - dn : p + up;\n  );\n);\n\n// Last stage: pitch correction, then out.\nfunction mpc_final(t, p, vel, ch, len_s, owner)\n(\n  p_pc ? p = mpc_pc_note(floor(p + 0.5));\n  p >= 0 ? mpc_out(t, p, vel, ch, len_s, owner);\n);\n\n// The chain: filter -> EQ -> compressor -> delay -> pitch correction.\nfunction mpc_fx(t, p, vel, ch, len_s, v) local(x, vv, c, dt, mix, dry, wet, wv, k)\n(\n  x = mpc_axis(p, v);\n  p_flt ? vel *= mpc_filter_gain(x);\n  p_eq ? vel *= mpc_eq_gain(x);\n  vel >= 0.5 ? (\n    p_cmp ? (\n      p_cmp_tgt == 0 ? (\n        vel = mpc_comp_amount(vel, p_cmp_thr) + p_cmp_make;\n        vel = mpc_clamp(vel, 1, 127);\n      ) : p_cmp_tgt == 1 ? (\n        vv = VOICE + v * V_ST;\n        c = (vv[V_LO] + vv[V_HI]) / 2;\n        p = floor(c + mpc_comp_amount(p - c, p_cmp_thr * 24 / 127) + 0.5);\n      );\n    );\n    p_dly ? (\n      dt = DELV[mpc_clamp(p_dly_time | 0, 0, 11)] * 60 / max(tempo, 1) * srate;\n      mix = p_dly_mix / 100;\n      dry = min(2 * (1 - mix), 1); wet = min(2 * mix, 1);\n      mpc_final(t, p, vel * dry, ch, len_s, v);\n      wv = vel * wet; k = 1;\n      loop(p_dly_rep | 0,\n        wv >= 1 ? mpc_final(t + k * dt, p + k * p_dly_pitch, wv, ch, min(len_s, dt * 0.9), v + TAIL);\n        wv *= p_dly_fb / 100; k += 1;\n      );\n    ) : (\n      mpc_final(t, p, vel, ch, len_s, v);\n    );\n  );\n);\n\n// ---------------------------------------------------------------------------\n// Voices\n// ---------------------------------------------------------------------------\n\n// One play-list entry of voice v, sounding at absolute time t.\nfunction mpc_emit(v, t, e, rate) local(vv, a, p, vel, len, ch, sens, rep)\n(\n  vv = VOICE + v * V_ST; a = PAD + vv[V_PAD] * P_ST;\n  p = e[2] + a[PF_TRANS];\n  sens = a[PF_VSENS] / 100;\n  vel = e[3] * a[PF_LEVEL] / 100 * p_master / 100 * (1 - sens + sens * vv[V_VEL] / 127);\n  len = e[1];\n  vv[V_STUT] ? (\n    rep = vv[V_SREP];\n    p += p_st_pitch * rep;\n    vel *= (1 - p_st_decay / 100) ^ rep;\n    len = min(len, st_size) * p_st_gate / 100;\n  );\n  ch = a[PF_CHAN] > 0 ? a[PF_CHAN] - 1 : p_outch > 0 ? p_outch - 1 : e[4];\n  a[PF_FX] ? mpc_fx(t, p, vel, ch, len / rate, v) : mpc_out(t, p, vel, ch, len / rate, v);\n);\n\n// Emits the entries of voice v whose position lies in [from, to); t0 is the\n// absolute time at `from`. The list index travels in mpc_si.\nfunction mpc_scan(v, lst, n, from, to, t0, rate) local(e)\n(\n  while (mpc_si < n && lst[mpc_si * L_ST] < to) (\n    e = lst + mpc_si * L_ST;\n    e[0] >= from - 0.0000001 ? mpc_emit(v, t0 + (e[0] - from) / rate, e, rate);\n    mpc_si += 1;\n  );\n);\n\n// First index whose position is >= x.\nfunction mpc_seek(lst, n, x) local(lo, hi, mid)\n(\n  lo = 0; hi = n;\n  while (lo < hi) (\n    mid = floor((lo + hi) / 2);\n    lst[mid * L_ST] < x - 0.0000001 ? lo = mid + 1 : hi = mid;\n  );\n  lo;\n);\n\nfunction mpc_vlist(v) ( VLIST + v * VL_MAX * L_ST; );\n\n// Moves the real play position on without playing anything (while stuttering,\n// the pad keeps time underneath so it comes back in the right place).\nfunction mpc_real_advance(v, dt, rate) local(vv, L, pos)\n(\n  vv = VOICE + v * V_ST; L = vv[V_L];\n  pos = vv[V_POS] + dt * rate;\n  pos >= L ? (\n    vv[V_LOOP] && L > 0.01 ? pos -= floor(pos / L) * L : ( pos = L; vv[V_END] = 1; );\n  );\n  vv[V_POS] = pos;\n);\n\nfunction mpc_stut_end(v) local(vv)\n(\n  vv = VOICE + v * V_ST;\n  vv[V_STUT] = 0;\n  vv[V_IDX] = mpc_seek(mpc_vlist(v), vv[V_N], vv[V_POS]);\n  vv[V_END] ? vv[V_ON] = 0;\n);\n\n// The stutter window is the grid cell the pad is currently in: the rest of it\n// plays, then it repeats.\nfunction mpc_stut_begin(v) local(vv)\n(\n  vv = VOICE + v * V_ST;\n  vv[V_STUT] = 1;\n  vv[V_SSTART] = floor(vv[V_POS] / st_size + EPS) * st_size;\n  vv[V_SPOS] = vv[V_POS];\n  vv[V_SIDX] = vv[V_IDX];\n  vv[V_SREP] = 0;\n);\n\n// Plays voice v forward from its position for up to `remain` samples, or to\n// the end of its slice. Returns the samples consumed.\nfunction mpc_play_step(v, t, remain, rate) local(vv, lst, L, pos, dte, adv, used)\n(\n  vv = VOICE + v * V_ST; lst = mpc_vlist(v);\n  L = vv[V_L]; pos = vv[V_POS];\n  dte = (L - pos) / rate;\n  mpc_si = vv[V_IDX];\n  dte > remain ? (\n    adv = pos + remain * rate;\n    mpc_scan(v, lst, vv[V_N], pos, adv, t, rate);\n    vv[V_POS] = adv; used = remain;\n  ) : (\n    mpc_scan(v, lst, vv[V_N], pos, L, t, rate);\n    used = max(dte, 0);\n    vv[V_LOOP] && L > 0.01 ? (\n      vv[V_POS] = 0; mpc_si = 0;\n    ) : (\n      vv[V_ON] = 0; used = remain;\n    );\n  );\n  vv[V_IDX] = mpc_si;\n  used;\n);\n\n// Same, inside the stutter window, which wraps until the repeats are used up.\nfunction mpc_stut_step(v, t, remain, rate) local(vv, lst, n, ss, se, sp, dte, adv, used, done)\n(\n  vv = VOICE + v * V_ST; lst = mpc_vlist(v); n = vv[V_N];\n  ss = vv[V_SSTART];\n  se = min(ss + st_size, vv[V_L]);\n  se <= ss + EPS ? se = ss + st_size;\n  sp = mpc_clamp(vv[V_SPOS], ss, se);\n  dte = (se - sp) / rate;\n  mpc_si = vv[V_SIDX];\n  done = 0;\n  dte > remain ? (\n    adv = sp + remain * rate;\n    mpc_scan(v, lst, n, sp, adv, t, rate);\n    vv[V_SPOS] = adv; used = remain;\n  ) : (\n    mpc_scan(v, lst, n, sp, se, t, rate);\n    used = max(dte, 0);\n    vv[V_SREP] += 1;\n    vv[V_SPOS] = ss;\n    mpc_si = mpc_seek(lst, n, ss);\n    p_st_rep > 0 && vv[V_SREP] > p_st_rep ? done = 1;\n  );\n  vv[V_SIDX] = mpc_si;\n  mpc_real_advance(v, used, rate);\n  done ? ( vv[V_SDONE] = 1; mpc_stut_end(v); );\n  used;\n);\n\n// Source beats per sample for voice v.\nfunction mpc_voice_rate(v) local(vv, a, bps, fit)\n(\n  vv = VOICE + v * V_ST; a = PAD + vv[V_PAD] * P_ST;\n  fit = FITV[mpc_clamp(a[PF_FIT] | 0, 0, 7)];\n  fit > 0 ? (\n    bps = tempo / 60 * max(vv[V_L], EPS) / fit;          // squeeze the slice into `fit` beats\n  ) : (\n    bps = p_timemode == 1 ? src_tempo / 60 : tempo / 60; // 1 source beat = 1 project beat\n  );\n  bps *= 100 / max(a[PF_STRETCH], 1);\n  a[PF_TAPE] ? bps *= 2 ^ (a[PF_TRANS] / 12);            // pitch drags speed, like tape\n  max(bps, 0.001) / srate;\n);\n\nfunction mpc_voice_run(v) local(vv, t, endt, remain, rate, used, guard)\n(\n  vv = VOICE + v * V_ST;\n  endt = mpc_now + samplesblock;\n  t = vv[V_T]; remain = endt - t;\n  rate = mpc_voice_rate(v);\n  guard = 0;\n  while (vv[V_ON] && remain > 0.000001 && guard < 256) (\n    used = vv[V_STUT] ? mpc_stut_step(v, t, remain, rate) : mpc_play_step(v, t, remain, rate);\n    t += used; remain -= used; guard += 1;\n  );\n  vv[V_T] = endt;\n);\n\n// Silences voice v at time t: its sounding notes get a note-off, and notes it\n// scheduled that have not started are dropped. Delay tails keep ringing.\nfunction mpc_voice_cut(v, t) local(k, s, i, e)\n(\n  k = 0;\n  loop(2048,\n    s = SOUND + k * 3;\n    s[0] && s[1] === v ? mpc_q_push(t, QT_OFF, floor(k / 128), k & 127, 0, s[0], v);\n    k += 1;\n  );\n  i = 0;\n  loop(MAX_Q,\n    e = QUEUE + i * Q_ST;\n    e[0] && e[2] == QT_ON && e[7] === v && e[1] >= t ? mpc_q_free(i);\n    i += 1;\n  );\n  VOICE[v * V_ST + V_ON] = 0;\n);\n\nfunction mpc_pad_active(p) local(i, n)\n(\n  n = 0; i = 0;\n  loop(MAX_V, VOICE[i * V_ST + V_ON] && VOICE[i * V_ST + V_PAD] == p ? n += 1; i += 1; );\n  n;\n);\n\nfunction mpc_pad_stop(p, t) local(i)\n(\n  i = 0;\n  loop(MAX_V, VOICE[i * V_ST + V_ON] && VOICE[i * V_ST + V_PAD] == p ? mpc_voice_cut(i, t); i += 1; );\n);\n\n// A free voice, or the oldest one (cut) when all are busy.\nfunction mpc_voice_alloc(t) local(i, best, age)\n(\n  best = -1; i = 0;\n  while (i < MAX_V && best < 0) ( !VOICE[i * V_ST + V_ON] ? best = i; i += 1; );\n  best < 0 ? (\n    best = 0; age = VOICE[V_AGE]; i = 1;\n    loop(MAX_V - 1,\n      VOICE[i * V_ST + V_AGE] < age ? ( best = i; age = VOICE[i * V_ST + V_AGE]; );\n      i += 1;\n    );\n    mpc_voice_cut(best, t);\n  );\n  best;\n);\n\n// Starts pad p at absolute time t. `note` is what releases it later. An empty\n// pad does nothing but is reported (diag_empty) so the panel can say why.\nfunction mpc_trigger(p, vel, t, note) local(a, i, vv, op, v, lst, n, rev, S, E, L, k, q, warp)\n(\n  a = PAD + p * P_ST;\n  S = a[PF_S]; E = a[PF_E];\n  E - S <= EPS ? (\n    diag_empty = p + 1; diag_empty_n += 1;\n  ) : (\n    a[PF_MODE] == MODE_TOGGLE && mpc_pad_active(p) ? (\n      mpc_pad_stop(p, t);\n    ) : (\n      // mono pads cut themselves; pads in the same choke group cut each other\n      i = 0;\n      loop(MAX_V,\n        vv = VOICE + i * V_ST;\n        vv[V_ON] ? (\n          op = vv[V_PAD];\n          (op == p && !a[PF_POLY]) || (a[PF_CHOKE] > 0 && PAD[op * P_ST + PF_CHOKE] == a[PF_CHOKE]) ?\n            mpc_voice_cut(i, t);\n        );\n        i += 1;\n      );\n      v = mpc_voice_alloc(t);\n      vv = VOICE + v * V_ST;\n      rev = a[PF_REV] ? 1 : 0;\n      L = E - S;\n      lst = mpc_vlist(v);\n      n = mpc_region_list(lst, VL_MAX, S, E, rev);\n      // groove is baked into the voice's own copy of the list\n      warp = (a[PF_FX] && p_cmp && p_cmp_tgt == 2) + 2 * (p_swing > 50);\n      warp ? (\n        k = 0;\n        loop(n,\n          q = lst[k * L_ST];\n          warp & 1 ? q = mpc_tighten(q);\n          warp & 2 ? q = mpc_swing(q);\n          lst[k * L_ST] = mpc_clamp(q, 0, max(L - EPS, 0));\n          k += 1;\n        );\n      );\n      memset(vv, 0, V_ST);\n      vv[V_ON] = 1; vv[V_PAD] = p; vv[V_T] = t; vv[V_N] = n; vv[V_L] = L;\n      vv[V_LOOP] = a[PF_MODE] == MODE_LOOP || a[PF_MODE] == MODE_TOGGLE;\n      vv[V_VEL] = vel; vv[V_NOTE] = note; vv[V_HELD] = 1;\n      vv[V_LO] = rl_lo; vv[V_HI] = rl_hi;\n      vv[V_AGE] = t; vv[V_FX] = a[PF_FX]; vv[V_REV] = rev;\n      vv[V_SLICE] = a[PF_SLICE]; vv[V_S] = S;\n      st_engaged && a[PF_FX] ? mpc_stut_begin(v);\n      PADHIT[p] = t;\n    );\n  );\n);\n\n// A key going up releases the voices it started (Gate and Loop pads stop).\nfunction mpc_release(note, t) local(i, vv, m)\n(\n  i = 0;\n  loop(MAX_V,\n    vv = VOICE + i * V_ST;\n    vv[V_ON] && vv[V_HELD] && vv[V_NOTE] == note ? (\n      vv[V_HELD] = 0;\n      m = PAD[vv[V_PAD] * P_ST + PF_MODE];\n      m == MODE_GATE || m == MODE_LOOP ? mpc_voice_cut(i, t);\n    );\n    i += 1;\n  );\n);\n\nfunction mpc_note_on(note, vel, t) local(p, hit)\n(\n  hit = 0; p = 0;\n  loop(MAX_PADS,\n    PAD[p * P_ST + PF_NOTE] == note ? ( mpc_trigger(p, vel, t, note); hit += 1; );\n    p += 1;\n  );\n  hit;\n);\n\nfunction mpc_note_off(note, t) local(p, hit)\n(\n  hit = 0; p = 0;\n  loop(MAX_PADS, PAD[p * P_ST + PF_NOTE] == note ? hit += 1; p += 1; );\n  hit ? mpc_release(note, t);\n  hit;\n);\n\n// Everything off, now.\nfunction mpc_panic() local(k, s)\n(\n  memset(VOICE, 0, MAX_V * V_ST);\n  mpc_q_reset();\n  k = 0;\n  loop(2048,\n    s = SOUND + k * 3;\n    s[0] ? ( midisend(0, $x80 | floor(k / 128), k & 127, 0); s[0] = 0; );\n    k += 1;\n  );\n);\n\nfunction mpc_engine_reset()\n(\n  memset(VOICE, 0, MAX_V * V_ST);\n  mpc_q_reset();\n  memset(SOUND, 0, 2048 * 3);\n  memset(PADHIT, 0, MAX_PADS);\n  cap_armed = 0; cap_rec = 0;\n  st_engaged = 0; st_note_held = 0;\n  was_playing = 0;\n);\n\n// ---------------------------------------------------------------------------\n// Live sampling: record the MIDI arriving on the track while REAPER plays.\n// ---------------------------------------------------------------------------\nfunction mpc_cap_start()\n(\n  cap_rec = 1; cap_n = 0; cap_last = beat_position;\n  cap_tempo = tempo; cap_tsn = ts_num; cap_tsd = ts_denom;\n  memset(CAPP, 0, 2048);\n);\n\nfunction mpc_cap_note(beat, on, p, vel, ch) local(key, i, a)\n(\n  key = ch * 128 + p;\n  i = CAPP[key];\n  i ? (\n    a = CAPT + (i - 1) * N_ST;\n    a[1] = max(beat - a[0], MINLEN);\n    CAPP[key] = 0;\n  );\n  on && cap_n < MAX_NOTES ? (\n    a = CAPT + cap_n * N_ST;\n    a[0] = beat; a[1] = -1; a[2] = p; a[3] = vel; a[4] = ch;\n    cap_n += 1;\n    CAPP[key] = cap_n;\n  );\n  cap_last = max(cap_last, beat);\n);\n\n// Turns the capture into the new phrase, starting on the beat of the first\n// note and rounded up to whole bars.\nfunction mpc_cap_finish() local(i, a, first, last, org, bar)\n(\n  cap_rec = 0; cap_armed = 0;\n  cap_n > 0 ? (\n    first = 1000000000; last = 0; i = 0;\n    loop(cap_n,\n      a = CAPT + i * N_ST;\n      a[1] < 0 ? a[1] = max(cap_last - a[0], 0.25);\n      first = min(first, a[0]); last = max(last, a[0] + a[1]);\n      i += 1;\n    );\n    org = floor(first + EPS);\n    bar = cap_tsd > 0 ? cap_tsn * 4 / cap_tsd : 4;\n    src_n = 0; i = 0;\n    loop(cap_n, a = CAPT + i * N_ST; mpc_src_add(a[0] - org, a[1], a[2], a[3], a[4]); i += 1; );\n    src_len = max(ceil((last - org) / bar - EPS), 1) * bar;\n    src_tempo = cap_tempo; src_tsn = cap_tsn; src_tsd = cap_tsd;\n    mark_ui_n = 0; mark_rev += 1;\n    strcpy(#src_name, \"Sampled phrase\");\n    mpc_src_finalize();\n    mpc_panic();\n  );\n);\n\n// ---------------------------------------------------------------------------\n// Import from the loader script, through shared memory (gmem). Layout:\n//   [0] sequence (written last)  [1] target instance ID  [2] note count\n//   [3] length (beats)  [4] tempo  [5] ts num  [6] ts denom  [7] marker count\n//   [8] name length   [10] ack: sequence loaded  [11] ack: notes loaded\n//   [20] load request: instance ID  [21] load request sequence\n//   [30] loader heartbeat\n//   [100 + 5i ...] notes: start, length, pitch, velocity, channel\n//   [60000 + i] markers (beats)   [61000 + i] name characters\n// ---------------------------------------------------------------------------\nfunction mpc_import_check() local(n, m, i, g, c)\n(\n  gmem[0] !== imp_seq ? (\n    imp_seq = gmem[0];\n    gmem[1] === slider48 && slider48 > 0 ? (\n      n = mpc_clamp(gmem[2] | 0, 0, MAX_NOTES);\n      src_n = 0; i = 0;\n      loop(n, g = 100 + i * 5; mpc_src_add(gmem[g], gmem[g + 1], gmem[g + 2], gmem[g + 3], gmem[g + 4]); i += 1; );\n      src_len = gmem[3]; src_tempo = gmem[4]; src_tsn = gmem[5]; src_tsd = gmem[6];\n      m = mpc_clamp(gmem[7] | 0, 0, MAX_MARK);\n      i = 0;\n      loop(m, MARK_UI[i] = gmem[60000 + i]; i += 1; );\n      mark_ui_n = m; mark_rev += 1;\n      strcpy(#src_name, \"\");\n      i = 0;\n      loop(mpc_clamp(gmem[8] | 0, 0, 64),\n        c = gmem[61000 + i];\n        c >= 32 ? ( sprintf(#imp_ch, \"%c\", c); strcat(#src_name, #imp_ch); );\n        i += 1;\n      );\n      strlen(#src_name) == 0 ? strcpy(#src_name, \"Imported item\");\n      // markers placed in REAPER are almost certainly meant as chop points\n      m > 0 ? ( slider1 = 3; sliderchange(slider1); p_chop = 3; );\n      mpc_src_finalize();\n      mpc_panic();\n      cap_armed = 0; cap_rec = 0;\n      gmem[11] = src_n;\n      gmem[10] = imp_seq;\n    );\n  );\n);\n\n// ---------------------------------------------------------------------------\n// Boot and the per-block driver\n// ---------------------------------------------------------------------------\nfunction mpc_boot()\n(\n  !pads_ok ? ( mpc_pads_default(); pads_ok = 1; );\n  !src_ok ? ( mpc_src_demo(); src_ok = 1; );\n  mpc_engine_reset();\n  slider48 < 1 ? (\n    // clock fraction + rand(), so two sessions don't hand out the same IDs\n    id_t = time_precise() * 1000;\n    id_x = (id_t - floor(id_t)) * 899999 + rand(899999);\n    id_x >= 899999 ? id_x -= 899999;\n    slider48 = 100000 + floor(id_x);\n  );\n  imp_seq = gmem[0];             // ignore whatever an earlier session left there\n  chop_force = 1;\n  mpc_read_params();\n);\n\nfunction mpc_block() local(playing, ofs, m1, m2, m3, st, ch, t, beat, hit, i, want)\n(\n  mpc_read_params();\n  st_size = STUTV[mpc_clamp(p_st_size | 0, 0, 7)];\n\n  // transport: stopping, starting or jumping (loop, seek) clears the slate\n  playing = play_state == 1 || play_state == 5;\n  playing != was_playing || (playing && abs(beat_position - exp_beat) > 0.05) ? (\n    cap_rec ? mpc_cap_finish();\n    mpc_panic();\n  );\n  playing && cap_armed && !cap_rec ? mpc_cap_start();\n  was_playing = playing;\n  exp_beat = beat_position + samplesblock / srate * tempo / 60;\n\n  mpc_import_check();\n  mpc_chop_if_needed();\n  ui_req_xfer ? (\n    // \"transfer to pads\" from the panel: done here, after the latest chop\n    xfer_count = mpc_transfer(ui_req_xfer - 1, 0);\n    ui_req_xfer = 0; xfer_done += 1;\n  );\n\n  // requests from the panel (which runs on another thread)\n  ui_req_panic ? ( ui_req_panic = 0; mpc_panic(); );\n  ui_req_cap ? (\n    ui_req_cap = 0;\n    cap_armed ? ( cap_rec ? mpc_cap_finish() : cap_armed = 0; ) : ( cap_armed = 1; mpc_panic(); );\n  );\n  ui_req_demo ? ( ui_req_demo = 0; mpc_src_demo(); mpc_panic(); );\n  ui_aud_on ? ( mpc_trigger(ui_aud_on - 1, ui_aud_vel, mpc_now, 1000 + ui_aud_on); ui_aud_on = 0; );\n  ui_aud_off ? ( mpc_release(1000 + ui_aud_off, mpc_now); ui_aud_off = 0; );\n\n  while (midirecv(ofs, m1, m2, m3)) (\n    t = mpc_now + ofs;\n    st = m1 & $xF0; ch = m1 & $x0F;\n    diag_in_n += 1;\n    beat = beat_position + ofs / srate * tempo / 60;\n    st == $x90 && m3 > 0 ? (\n      cap_armed ? (\n        cap_rec ? mpc_cap_note(beat, 1, m2, m3, ch);\n        mpc_q_push(t, QT_RAW, m1, m2, m3, 0, 0);\n      ) : ui_learn > 0 ? (\n        PAD[(ui_learn - 1) * P_ST + PF_NOTE] = m2; ui_learn = 0;\n      ) : p_st_note > 0 && m2 == p_st_note - 1 ? (\n        st_note_held = 1;\n      ) : (\n        hit = mpc_note_on(m2, m3, t);\n        !hit && p_thru ? mpc_q_push(t, QT_RAW, m1, m2, m3, 0, 0);\n      );\n    ) : st == $x80 || st == $x90 ? (\n      cap_armed ? (\n        cap_rec ? mpc_cap_note(beat, 0, m2, 0, ch);\n        mpc_q_push(t, QT_RAW, m1, m2, m3, 0, 0);\n      ) : p_st_note > 0 && m2 == p_st_note - 1 ? (\n        st_note_held = 0;\n      ) : (\n        hit = mpc_note_off(m2, t);\n        !hit && p_thru ? mpc_q_push(t, QT_RAW, m1, m2, m3, 0, 0);\n      );\n    ) : (\n      st == $xB0 && (m2 == 120 || m2 == 123) ? mpc_panic();\n      mpc_q_push(t, QT_RAW, m1, m2, m3, 0, 0);\n    );\n  );\n\n  // stutter engages on every pad that is sending to the FX\n  want = p_st || st_note_held;\n  want && !st_engaged ? (\n    i = 0;\n    loop(MAX_V, VOICE[i * V_ST + V_ON] && VOICE[i * V_ST + V_FX] ? mpc_stut_begin(i); i += 1; );\n  );\n  !want && st_engaged ? (\n    i = 0;\n    loop(MAX_V,\n      VOICE[i * V_ST + V_SDONE] = 0;\n      VOICE[i * V_ST + V_ON] && VOICE[i * V_ST + V_STUT] ? mpc_stut_end(i);\n      i += 1;\n    );\n  );\n  st_engaged = want;\n\n  i = 0;\n  loop(MAX_V, VOICE[i * V_ST + V_ON] ? mpc_voice_run(i); i += 1; );\n\n  cap_rec ? cap_last = max(cap_last, beat_position + samplesblock / srate * tempo / 60);\n\n  mpc_q_run();\n  mpc_now += samplesblock;\n  blk_count += 1;\n);\n", "mpc_ui.jsfx-inc": "// mpc_ui.jsfx-inc\n// MIDI Production Center - the @gfx panel: header, chop view, 4x4 pads with\n// banks, and PAD / FX / SETUP pages.\n//\n// Everything is laid out on a fixed 1000 x 660 design canvas and scaled to\n// the window (this also covers HiDPI, where gfx_w/gfx_h are doubled).\n// @gfx runs on its own thread: it only writes pad settings, markers, sliders\n// and ui_req_* flags, and the audio thread picks those up in @block.\n//\n// Copyright (c) 2026 KallumS. GPL v3 (see LICENSE).\n\n@init\n\n// Notifies REAPER of a slider written from the panel (display + automation).\n// The slider variable itself must be named at the call site, hence the list.\nfunction mpc_touch(i, e)\n(\n  i == 1 ? ( sliderchange(slider1); slider_automate(slider1, e); );\n  i == 2 ? ( sliderchange(slider2); slider_automate(slider2, e); );\n  i == 3 ? ( sliderchange(slider3); slider_automate(slider3, e); );\n  i == 4 ? ( sliderchange(slider4); slider_automate(slider4, e); );\n  i == 5 ? ( sliderchange(slider5); slider_automate(slider5, e); );\n  i == 6 ? ( sliderchange(slider6); slider_automate(slider6, e); );\n  i == 7 ? ( sliderchange(slider7); slider_automate(slider7, e); );\n  i == 8 ? ( sliderchange(slider8); slider_automate(slider8, e); );\n  i == 9 ? ( sliderchange(slider9); slider_automate(slider9, e); );\n  i == 10 ? ( sliderchange(slider10); slider_automate(slider10, e); );\n  i == 11 ? ( sliderchange(slider11); slider_automate(slider11, e); );\n  i == 12 ? ( sliderchange(slider12); slider_automate(slider12, e); );\n  i == 13 ? ( sliderchange(slider13); slider_automate(slider13, e); );\n  i == 14 ? ( sliderchange(slider14); slider_automate(slider14, e); );\n  i == 15 ? ( sliderchange(slider15); slider_automate(slider15, e); );\n  i == 16 ? ( sliderchange(slider16); slider_automate(slider16, e); );\n  i == 17 ? ( sliderchange(slider17); slider_automate(slider17, e); );\n  i == 18 ? ( sliderchange(slider18); slider_automate(slider18, e); );\n  i == 19 ? ( sliderchange(slider19); slider_automate(slider19, e); );\n  i == 20 ? ( sliderchange(slider20); slider_automate(slider20, e); );\n  i == 21 ? ( sliderchange(slider21); slider_automate(slider21, e); );\n  i == 22 ? ( sliderchange(slider22); slider_automate(slider22, e); );\n  i == 23 ? ( sliderchange(slider23); slider_automate(slider23, e); );\n  i == 24 ? ( sliderchange(slider24); slider_automate(slider24, e); );\n  i == 25 ? ( sliderchange(slider25); slider_automate(slider25, e); );\n  i == 26 ? ( sliderchange(slider26); slider_automate(slider26, e); );\n  i == 27 ? ( sliderchange(slider27); slider_automate(slider27, e); );\n  i == 28 ? ( sliderchange(slider28); slider_automate(slider28, e); );\n  i == 29 ? ( sliderchange(slider29); slider_automate(slider29, e); );\n  i == 30 ? ( sliderchange(slider30); slider_automate(slider30, e); );\n  i == 31 ? ( sliderchange(slider31); slider_automate(slider31, e); );\n  i == 32 ? ( sliderchange(slider32); slider_automate(slider32, e); );\n  i == 33 ? ( sliderchange(slider33); slider_automate(slider33, e); );\n  i == 34 ? ( sliderchange(slider34); slider_automate(slider34, e); );\n  i == 35 ? ( sliderchange(slider35); slider_automate(slider35, e); );\n  i == 36 ? ( sliderchange(slider36); slider_automate(slider36, e); );\n  i == 37 ? ( sliderchange(slider37); slider_automate(slider37, e); );\n  i == 38 ? ( sliderchange(slider38); slider_automate(slider38, e); );\n  i == 39 ? ( sliderchange(slider39); slider_automate(slider39, e); );\n  i == 40 ? ( sliderchange(slider40); slider_automate(slider40, e); );\n  i == 41 ? ( sliderchange(slider41); slider_automate(slider41, e); );\n  i == 42 ? ( sliderchange(slider42); slider_automate(slider42, e); );\n  i == 43 ? ( sliderchange(slider43); slider_automate(slider43, e); );\n  i == 44 ? ( sliderchange(slider44); slider_automate(slider44, e); );\n  i == 45 ? ( sliderchange(slider45); slider_automate(slider45, e); );\n  i == 46 ? ( sliderchange(slider46); slider_automate(slider46, e); );\n  i == 47 ? ( sliderchange(slider47); slider_automate(slider47, e); );\n);\n\nfunction mpc_ui_consts()\n(\n  UI_W = 1000; UI_H = 660;\n  // control record\n  C_ST = 24;\n  C_KIND = 0; C_TGT = 1; C_IDX = 2; C_MIN = 3; C_MAX = 4; C_STEP = 5; C_DEF = 6;\n  C_X = 7; C_Y = 8; C_W = 9; C_H = 10; C_PAGE = 11; C_LABEL = 12; C_OPTS = 13;\n  C_FMT = 14; C_VIS = 15; C_VISV = 16; C_VISOP = 17;\n  K_KNOB = 1; K_ENUM = 2; K_TOGGLE = 3; K_BUTTON = 4; K_VALUE = 5; K_MOMENT = 6;\n  T_SLIDER = 0; T_PAD = 1;\n  F_NUM = 0; F_NOTE = 1; F_PCT = 2; F_SEMI = 3; F_ENUM = 4; F_SLICE = 5; F_CHOKE = 6;\n  F_TRIG = 7; F_RATIO = 8; F_AXIS = 9; F_GAIN = 10; F_THR = 11; F_REPS = 12;\n  F_SLOPE = 13; F_VEL = 14; F_ST = 15;\n  A_LEARN = 1; A_TOMARK = 2; A_RESETPAD = 3; A_RESETALL = 4; A_MAPCHROM = 5;\n  A_DEMO = 6; A_CLEARMARK = 7; A_XFER = 8;\n  PG_ALWAYS = 0; PG_PAD = 1; PG_FX = 10; PG_SETUP = 20;\n  // layout\n  RX = 12; RY = 78; RW = 976; RH = 178;\n  PX = 12; PY = 296; PW = 92; PH = 82; PG = 8;\n  TX = 416; TY = 266; TW = 572;\n  FL_X = 416; FL_W = 140;\n);\n\n// ---------------------------------------------------------------------------\n// Drawing primitives in design units\n// ---------------------------------------------------------------------------\nfunction u_X(x) ( u_ox + x * u_sc; );\nfunction u_Y(y) ( u_oy + y * u_sc; );\nfunction u_rect(x, y, w, h) ( gfx_rect(u_X(x), u_Y(y), max(w * u_sc, 1), max(h * u_sc, 1)); );\nfunction u_line(x1, y1, x2, y2) ( gfx_line(u_X(x1), u_Y(y1), u_X(x2), u_Y(y2), 1); );\nfunction u_box(x, y, w, h) ( gfx_roundrect(u_X(x), u_Y(y), w * u_sc, h * u_sc, 3 * u_sc, 1); );\nfunction u_text(x, y, w, h, s, flags)\n(\n  gfx_x = u_X(x); gfx_y = u_Y(y);\n  gfx_drawstr(s, flags, u_X(x + w), u_Y(y + h));\n);\nfunction u_in(x, y, w, h) ( u_mx >= x && u_mx < x + w && u_my >= y && u_my < y + h; );\nfunction u_col(r, g, b) ( gfx_set(r, g, b, 1); );\nfunction u_cola(r, g, b, a) ( gfx_set(r, g, b, a); );\n\nfunction u_hue(h, s, v, a) local(i, f, p, q, t)\n(\n  h = (h - floor(h)) * 6; i = floor(h); f = h - i;\n  p = v * (1 - s); q = v * (1 - s * f); t = v * (1 - s * (1 - f));\n  i == 0 ? gfx_set(v, t, p, a) : i == 1 ? gfx_set(q, v, p, a) :\n  i == 2 ? gfx_set(p, v, t, a) : i == 3 ? gfx_set(p, q, v, a) :\n  i == 4 ? gfx_set(t, p, v, a) : gfx_set(v, p, q, a);\n);\nfunction u_slice_col(i, s, v, a) ( u_hue(i * 0.61803 + 0.02, s, v, a); );\n\nfunction u_fonts()\n(\n  gfx_setfont(1, \"Arial\", 12 * u_sc);\n  gfx_setfont(2, \"Arial\", 12 * u_sc, $'b');\n  gfx_setfont(3, \"Arial\", 17 * u_sc, $'b');\n  gfx_setfont(4, \"Arial\", 10 * u_sc);\n  gfx_setfont(5, \"Arial\", 14 * u_sc, $'b');\n);\n\n// ---------------------------------------------------------------------------\n// Text helpers\n// ---------------------------------------------------------------------------\nfunction u_pc_name(pc)\n(\n  pc == 0 ? \"C\" : pc == 1 ? \"C#\" : pc == 2 ? \"D\" : pc == 3 ? \"D#\" : pc == 4 ? \"E\" :\n  pc == 5 ? \"F\" : pc == 6 ? \"F#\" : pc == 7 ? \"G\" : pc == 8 ? \"G#\" : pc == 9 ? \"A\" :\n  pc == 10 ? \"A#\" : \"B\";\n);\n\n// REAPER's default naming: middle C (60) is C4.\nfunction u_note_name(dst, n)\n(\n  n = mpc_clamp(n | 0, 0, 127);\n  sprintf(dst, \"%s%d\", u_pc_name(n % 12), floor(n / 12) - 1);\n);\n\nfunction u_pad_name(dst, p) ( sprintf(dst, \"%s%02d\", p < 16 ? \"A\" : p < 32 ? \"B\" : p < 48 ? \"C\" : \"D\", p % 16 + 1); );\n\n// Copies the nth \"|\"-separated field of src into dst.\nfunction u_field(dst, src, n) local(i, l, f, c)\n(\n  strcpy(dst, \"\");\n  l = strlen(src); i = 0; f = 0;\n  while (i < l) (\n    c = str_getchar(src, i);\n    c == $'|' ? ( f += 1; f > n ? i = l; ) : ( f == n ? str_setchar(dst, strlen(dst), c); );\n    i += 1;\n  );\n  dst;\n);\n\nfunction u_nfields(src) local(i, n)\n(\n  n = strlen(src) > 0; i = 0;\n  loop(strlen(src), str_getchar(src, i) == $'|' ? n += 1; i += 1; );\n  n;\n);\n\nfunction u_msg(s) ( strcpy(#u_msg, s); u_msg_t = time_precise(); );\n\n// ---------------------------------------------------------------------------\n// Control table\n// ---------------------------------------------------------------------------\nfunction u_at(x, y, w, h, page) ( u_nx = x; u_ny = y; u_nw = w; u_nh = h; u_npage = page; );\n\nfunction u_ctl(kind, tgt, idx, mn, mx, st, def, fmt, label, opts) local(c)\n(\n  c = CTL + min(ui_nctl, 255) * C_ST;\n  memset(c, 0, C_ST);\n  c[C_KIND] = kind; c[C_TGT] = tgt; c[C_IDX] = idx; c[C_MIN] = mn; c[C_MAX] = mx;\n  c[C_STEP] = st; c[C_DEF] = def; c[C_FMT] = fmt; c[C_LABEL] = label; c[C_OPTS] = opts;\n  c[C_X] = u_nx; c[C_Y] = u_ny; c[C_W] = u_nw; c[C_H] = u_nh; c[C_PAGE] = u_npage;\n  ui_nctl < 256 ? ui_nctl += 1;\n  c;\n);\n\n// Only show control c while slider `sl` equals (op 0) / is at least (op 1) v.\nfunction u_vis(c, sl, v, op) ( c[C_VIS] = sl; c[C_VISV] = v; c[C_VISOP] = op; c; );\n\nfunction u_cell(col, row, x0, y0, cw, rh, page) ( u_at(x0 + col * cw, y0 + row * rh, cw - 8, rh - 8, page); );\n\nfunction mpc_build_ui() local(c, y, x0, cw, rh, pg)\n(\n  ui_nctl = 0;\n\n  // chop bar\n  u_at(352, 46, 160, 24, PG_ALWAYS);\n  u_vis(u_ctl(K_VALUE, T_SLIDER, 2, 0, 100, 1, 60, F_PCT, \"Sensitivity\", \"\"), 1, 0, 0);\n  u_vis(u_ctl(K_ENUM, T_SLIDER, 3, 0, 6, 1, 3, F_ENUM, \"Grid\", \"1/32|1/16|1/8|1/4|1/2|1 Bar|2 Bars\"), 1, 1, 0);\n  u_vis(u_ctl(K_VALUE, T_SLIDER, 4, 2, 64, 1, 16, F_NUM, \"Slices\", \"\"), 1, 2, 0);\n  u_at(352, 46, 64, 24, PG_ALWAYS);\n  u_vis(u_ctl(K_BUTTON, 0, A_CLEARMARK, 0, 0, 0, 0, 0, \"Clear\", \"\"), 1, 3, 0);\n  u_at(518, 46, 118, 24, PG_ALWAYS);\n  u_ctl(K_TOGGLE, T_SLIDER, 5, 0, 1, 1, 1, F_NUM, \"Held Notes\", \"\");\n  u_at(642, 46, 106, 24, PG_ALWAYS);\n  u_ctl(K_BUTTON, 0, A_TOMARK, 0, 0, 0, 0, 0, \"Edit as Markers\", \"\");\n  u_at(754, 46, 138, 24, PG_ALWAYS);\n  u_ctl(K_BUTTON, 0, A_XFER, 0, 0, 0, 0, 0, \"Transfer to Pads\", \"\");\n\n  // PAD page\n  x0 = 424; cw = 94; rh = 78; y = 330; pg = PG_PAD;\n  u_cell(0, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_PAD, PF_SLICE, -1, 64, 1, 0, F_SLICE, \"Slice\", \"\");\n  u_cell(1, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_PAD, PF_NOTE, 0, 127, 1, 36, F_NOTE, \"Trigger Note\", \"\");\n  u_at(x0 + 2 * cw, y + 20, cw - 8, 30, pg); u_ctl(K_BUTTON, 0, A_LEARN, 0, 0, 0, 0, 0, \"Learn\", \"\");\n  u_cell(3, 0, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_PAD, PF_MODE, 0, 3, 1, 0, F_ENUM, \"Play Mode\", \"One Shot|Gate|Loop (Hold)|Loop (Toggle)\");\n  u_cell(4, 0, x0, y, cw, rh, pg); u_ctl(K_TOGGLE, T_PAD, PF_POLY, 0, 1, 1, 0, F_NUM, \"Poly\", \"\");\n  u_cell(5, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_PAD, PF_CHOKE, 0, 8, 1, 0, F_CHOKE, \"Choke Group\", \"\");\n  u_cell(0, 1, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_PAD, PF_TRANS, -24, 24, 1, 0, F_SEMI, \"Transpose\", \"\");\n  u_cell(1, 1, x0, y, cw, rh, pg); u_ctl(K_TOGGLE, T_PAD, PF_TAPE, 0, 1, 1, 0, F_NUM, \"Tape Speed\", \"\");\n  u_cell(2, 1, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_PAD, PF_STRETCH, 25, 400, 1, 100, F_PCT, \"Stretch\", \"\");\n  u_cell(3, 1, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_PAD, PF_FIT, 0, 7, 1, 0, F_ENUM, \"Fit To\", \"Off|1/2 Beat|1 Beat|2 Beats|4 Beats|8 Beats|16 Beats|32 Beats\");\n  u_cell(4, 1, x0, y, cw, rh, pg); u_ctl(K_TOGGLE, T_PAD, PF_REV, 0, 1, 1, 0, F_NUM, \"Reverse\", \"\");\n  u_cell(5, 1, x0, y, cw, rh, pg); u_ctl(K_TOGGLE, T_PAD, PF_FX, 0, 1, 1, 1, F_NUM, \"Send to FX\", \"\");\n  u_cell(0, 2, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_PAD, PF_LEVEL, 0, 200, 1, 100, F_PCT, \"Level\", \"\");\n  u_cell(1, 2, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_PAD, PF_VSENS, 0, 100, 1, 50, F_PCT, \"Velocity Sensitivity\", \"\");\n  u_cell(2, 2, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_PAD, PF_CHAN, 0, 16, 1, 0, F_ENUM, \"Output Channel\", \"Source|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16\");\n\n  // FX pages\n  x0 = 570; cw = 104; rh = 84; y = 352;\n  pg = PG_FX + 0;  // filter\n  u_cell(0, 0, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_SLIDER, 13, 0, 3, 1, 0, F_ENUM, \"Type\", \"Low-Pass|High-Pass|Band-Pass|Notch\");\n  u_cell(1, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 14, 0, 127, 1, 72, F_AXIS, \"Cutoff\", \"\");\n  u_cell(2, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 15, 0, 24, 1, 0, F_SLOPE, \"Slope\", \"\");\n  u_cell(3, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 16, 0, 100, 1, 0, F_PCT, \"Resonance\", \"\");\n  u_cell(0, 1, x0, y, cw, rh, pg); u_vis(u_ctl(K_KNOB, T_SLIDER, 17, 1, 48, 1, 12, F_ST, \"Width\", \"\"), 13, 2, 1);\n  pg = PG_FX + 1;  // EQ\n  u_cell(0, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 19, 0, 127, 1, 48, F_AXIS, \"Low Note\", \"\");\n  u_cell(1, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 20, -100, 100, 1, 0, F_GAIN, \"Low Gain\", \"\");\n  u_cell(2, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 21, 0, 127, 1, 64, F_AXIS, \"Mid Note\", \"\");\n  u_cell(3, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 22, -100, 100, 1, 0, F_GAIN, \"Mid Gain\", \"\");\n  u_cell(0, 1, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 23, 1, 48, 1, 12, F_ST, \"Mid Width\", \"\");\n  u_cell(1, 1, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 24, 0, 127, 1, 80, F_AXIS, \"High Note\", \"\");\n  u_cell(2, 1, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 25, -100, 100, 1, 0, F_GAIN, \"High Gain\", \"\");\n  pg = PG_FX + 2;  // compressor\n  u_cell(0, 0, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_SLIDER, 27, 0, 2, 1, 0, F_ENUM, \"Target\", \"Velocity|Pitch|Timing\");\n  u_cell(1, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 28, 0, 127, 1, 80, F_THR, \"Threshold\", \"\");\n  u_cell(2, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 29, 1, 20, 0.1, 4, F_RATIO, \"Ratio\", \"\");\n  u_cell(3, 0, x0, y, cw, rh, pg); u_vis(u_ctl(K_KNOB, T_SLIDER, 30, -64, 64, 1, 0, F_VEL, \"Makeup\", \"\"), 27, 0, 0);\n  pg = PG_FX + 3;  // delay\n  u_cell(0, 0, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_SLIDER, 32, 0, 11, 1, 5, F_ENUM, \"Time\", \"1/32|1/16T|1/16|1/16D|1/8T|1/8|1/8D|1/4T|1/4|1/4D|1/2|1 bar\");\n  u_cell(1, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 33, 0, 100, 1, 50, F_PCT, \"Feedback\", \"\");\n  u_cell(2, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 34, 1, 16, 1, 4, F_NUM, \"Repeats\", \"\");\n  u_cell(3, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 35, -12, 12, 1, 0, F_SEMI, \"Pitch Step\", \"\");\n  u_cell(0, 1, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 36, 0, 100, 1, 50, F_PCT, \"Mix\", \"\");\n  pg = PG_FX + 4;  // stutter\n  u_cell(0, 0, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_SLIDER, 38, 0, 7, 1, 3, F_ENUM, \"Size\", \"1/64|1/32|1/16T|1/16|1/8T|1/8|1/4|1/2\");\n  u_cell(1, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 39, 0, 32, 1, 0, F_REPS, \"Repeats\", \"\");\n  u_cell(2, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 40, 0, 100, 1, 0, F_PCT, \"Decay\", \"\");\n  u_cell(3, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 41, -12, 12, 1, 0, F_SEMI, \"Pitch Step\", \"\");\n  u_cell(0, 1, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 42, 5, 100, 1, 100, F_PCT, \"Gate\", \"\");\n  u_cell(1, 1, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 43, 0, 128, 1, 0, F_TRIG, \"Trigger Note\", \"\");\n  u_at(x0 + 2 * cw, y + rh + 12, 2 * cw - 8, 44, pg); u_ctl(K_MOMENT, T_SLIDER, 37, 0, 1, 1, 0, F_NUM, \"Hold to Stutter\", \"\");\n  pg = PG_FX + 5;  // pitch correction\n  u_cell(0, 0, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_SLIDER, 45, 0, 11, 1, 0, F_ENUM, \"Key\", \"C|C#|D|D#|E|F|F#|G|G#|A|A#|B\");\n  u_cell(1, 0, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_SLIDER, 46, 0, 11, 1, 0, F_ENUM, \"Scale\", \"Major|Natural Minor|Harmonic Minor|Melodic Minor|Dorian|Phrygian|Lydian|Mixolydian|Locrian|Major Pentatonic|Minor Pentatonic|Blues\");\n  u_cell(2, 0, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_SLIDER, 47, 0, 3, 1, 0, F_ENUM, \"Correct To\", \"Nearest|Up|Down|Remove\");\n\n  // SETUP page\n  x0 = 424; cw = 94; rh = 84; y = 330; pg = PG_SETUP;\n  u_cell(0, 0, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_SLIDER, 6, 0, 1, 1, 0, F_ENUM, \"Time Mode\", \"Sync|Original\");\n  u_cell(1, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 7, 50, 75, 1, 50, F_PCT, \"Swing\", \"\");\n  u_cell(2, 0, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_SLIDER, 8, 0, 1, 1, 0, F_ENUM, \"Pitch Axis\", \"Absolute|Relative\");\n  u_cell(3, 0, x0, y, cw, rh, pg); u_ctl(K_TOGGLE, T_SLIDER, 9, 0, 1, 1, 1, F_NUM, \"Thru Other Notes\", \"\");\n  u_cell(4, 0, x0, y, cw, rh, pg); u_ctl(K_ENUM, T_SLIDER, 10, 0, 16, 1, 0, F_ENUM, \"Output Channel\", \"Source|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16\");\n  u_cell(5, 0, x0, y, cw, rh, pg); u_ctl(K_KNOB, T_SLIDER, 11, 0, 200, 1, 100, F_PCT, \"Master Level\", \"\");\n  u_at(424, 420, 130, 28, pg); u_ctl(K_BUTTON, 0, A_RESETPAD, 0, 0, 0, 0, 0, \"Reset This Pad\", \"\");\n  u_at(562, 420, 130, 28, pg); u_ctl(K_BUTTON, 0, A_RESETALL, 0, 0, 0, 0, 0, \"Reset All Pads\", \"\");\n  u_at(700, 420, 130, 28, pg); u_ctl(K_BUTTON, 0, A_MAPCHROM, 0, 0, 0, 0, 0, \"Pad Notes from 36\", \"\");\n  u_at(838, 420, 142, 28, pg); u_ctl(K_BUTTON, 0, A_DEMO, 0, 0, 0, 0, 0, \"Load Demo Phrase\", \"\");\n);\n\n// ---------------------------------------------------------------------------\n// Control values\n// ---------------------------------------------------------------------------\nfunction u_ctl_get(c) ( c[C_TGT] == T_PAD ? PAD[ui_pad * P_ST + c[C_IDX]] : slider(c[C_IDX]); );\n\nfunction u_ctl_set(c, v, e) local(st)\n(\n  st = c[C_STEP];\n  st > 0 ? v = floor(v / st + 0.5) * st;\n  v = mpc_clamp(v, c[C_MIN], c[C_MAX]);\n  c[C_TGT] == T_PAD ? (\n    // choosing a slice copies that slice's region onto the pad\n    c[C_IDX] == PF_SLICE ? mpc_pad_set_slice(ui_pad, v) : PAD[ui_pad * P_ST + c[C_IDX]] = v;\n  ) : (\n    slider(c[C_IDX]) = v;\n    mpc_touch(c[C_IDX], e);\n  );\n);\n\nfunction u_ctl_shown(c) local(ok, s)\n(\n  ok = c[C_PAGE] == PG_ALWAYS ||\n       (c[C_PAGE] == PG_PAD && ui_tab == 0) ||\n       (c[C_PAGE] >= PG_FX && c[C_PAGE] < PG_FX + 6 && ui_tab == 1 && c[C_PAGE] == PG_FX + ui_fx) ||\n       (c[C_PAGE] == PG_SETUP && ui_tab == 2);\n  ok && c[C_VIS] > 0 ? (\n    s = slider(c[C_VIS]);\n    ok = c[C_VISOP] ? s >= c[C_VISV] : s == c[C_VISV];\n  );\n  // \"Edit as markers\" is pointless when already editing markers\n  ok && c[C_KIND] == K_BUTTON && c[C_IDX] == A_TOMARK ? ok = slider1 != 3;\n  ok;\n);\n\nfunction u_fmt(dst, c, v) local(f)\n(\n  f = c[C_FMT];\n  f == F_NOTE ? u_note_name(dst, v) :\n  f == F_PCT ? sprintf(dst, \"%d%%\", v) :\n  f == F_SEMI ? ( v > 0 ? sprintf(dst, \"+%d semitones\", v) : sprintf(dst, \"%d semitones\", v); ) :\n  f == F_ENUM ? u_field(dst, c[C_OPTS], v | 0) :\n  f == F_SLICE ? ( v < 0 ? strcpy(dst, \"Whole phrase\") : v >= MAX_SLICES ? strcpy(dst, \"None\") : sprintf(dst, \"Slice %d\", v + 1); ) :\n  f == F_CHOKE ? ( v <= 0 ? strcpy(dst, \"Off\") : sprintf(dst, \"Group %d\", v); ) :\n  f == F_TRIG ? ( v <= 0 ? strcpy(dst, \"Off\") : u_note_name(dst, v - 1); ) :\n  f == F_RATIO ? sprintf(dst, \"%.1f:1\", v) :\n  f == F_AXIS ? ( slider8 ? sprintf(dst, \"%d%%\", floor(v / 127 * 100 + 0.5)) : u_note_name(dst, v); ) :\n  f == F_GAIN ? ( v > 0 ? sprintf(dst, \"+%d%%\", v) : sprintf(dst, \"%d%%\", v); ) :\n  f == F_THR ? (\n    slider27 == 0 ? sprintf(dst, \"velocity %d\", v) :\n    slider27 == 1 ? sprintf(dst, \"%d semitones\", floor(v * 24 / 127 + 0.5)) :\n    sprintf(dst, \"%d%%\", floor(v / 127 * 100 + 0.5));\n  ) :\n  f == F_REPS ? ( v <= 0 ? strcpy(dst, \"While held\") : sprintf(dst, \"%d\", v); ) :\n  f == F_SLOPE ? ( v <= 0 ? strcpy(dst, \"Hard\") : sprintf(dst, \"%d semitones\", v); ) :\n  f == F_VEL ? ( v > 0 ? sprintf(dst, \"+%d\", v) : sprintf(dst, \"%d\", v); ) :\n  f == F_ST ? sprintf(dst, \"%d semitones\", v) :\n  sprintf(dst, \"%d\", v);\n  dst;\n);\n\n// ---------------------------------------------------------------------------\n// Control drawing\n// ---------------------------------------------------------------------------\nfunction u_arc(cx, cy, r, a0, a1) local(n, i, a, da, px, py, nx, ny)\n(\n  n = max(ceil(abs(a1 - a0) * 6), 1);\n  da = (a1 - a0) / n; a = a0;\n  px = cx + sin(a) * r; py = cy - cos(a) * r;\n  i = 0;\n  loop(n,\n    a += da; nx = cx + sin(a) * r; ny = cy - cos(a) * r;\n    u_line(px, py, nx, ny);\n    px = nx; py = ny;\n  );\n);\n\nfunction u_draw_ctl(c) local(x, y, w, h, v, f, cx, cy, r, a, a0, compact, hot, on)\n(\n  x = c[C_X]; y = c[C_Y]; w = c[C_W]; h = c[C_H];\n  v = u_ctl_get(c);\n  hot = u_in(x, y, w, h) || u_drag_ctl == c;\n  compact = h < 40;\n  c[C_KIND] == K_KNOB ? (\n    cx = x + w / 2; cy = y + 36; r = 17;\n    f = mpc_clamp((v - c[C_MIN]) / max(c[C_MAX] - c[C_MIN], 0.000001), 0, 1);\n    a0 = -2.36; a = a0 + 4.72 * f;\n    gfx_setfont(4); u_col(0.62, 0.63, 0.67);\n    u_text(x, y, w, 14, c[C_LABEL], 1 | 4);\n    u_col(0.09, 0.09, 0.10);\n    gfx_circle(u_X(cx), u_Y(cy), (r + 3) * u_sc, 1, 1);\n    u_col(0.28, 0.28, 0.31); u_arc(cx, cy, r, a0, 2.36);\n    hot ? u_col(1.0, 0.45, 0.38) : u_col(0.90, 0.25, 0.22);\n    u_arc(cx, cy, r, a0, a); u_arc(cx, cy, r - 1, a0, a);\n    u_col(0.92, 0.92, 0.94);\n    u_line(cx + sin(a) * (r - 11), cy - cos(a) * (r - 11), cx + sin(a) * (r - 2), cy - cos(a) * (r - 2));\n    gfx_setfont(1); u_col(0.92, 0.92, 0.94);\n    u_text(x - 4, y + 56, w + 8, 14, u_fmt(#u_val, c, v), 1 | 4);\n  ) : c[C_KIND] == K_ENUM || c[C_KIND] == K_VALUE ? (\n    compact ? (\n      u_col(0.13, 0.13, 0.15); u_rect(x, y, w, h);\n      hot ? u_col(0.55, 0.55, 0.6) : u_col(0.30, 0.30, 0.33); u_box(x, y, w, h);\n      gfx_setfont(4); u_col(0.62, 0.63, 0.67);\n      u_text(x + 6, y, w, h, c[C_LABEL], 4);\n      gfx_setfont(2); u_col(0.95, 0.95, 0.97);\n      u_text(x, y, w - 8, h, u_fmt(#u_val, c, v), 2 | 4);\n    ) : (\n      gfx_setfont(4); u_col(0.62, 0.63, 0.67);\n      u_text(x, y, w, 14, c[C_LABEL], 1 | 4);\n      u_col(0.13, 0.13, 0.15); u_rect(x, y + 22, w, 28);\n      hot ? u_col(0.55, 0.55, 0.6) : u_col(0.30, 0.30, 0.33); u_box(x, y + 22, w, 28);\n      gfx_setfont(1); u_col(0.95, 0.95, 0.97);\n      u_text(x + 4, y + 22, w - 16, 28, u_fmt(#u_val, c, v), 1 | 4);\n      u_col(0.6, 0.6, 0.65);\n      gfx_triangle(u_X(x + w - 12), u_Y(y + 34), u_X(x + w - 5), u_Y(y + 34), u_X(x + w - 8.5), u_Y(y + 39));\n    );\n  ) : c[C_KIND] == K_TOGGLE ? (\n    on = v >= 0.5;\n    compact ? (\n      u_col(0.13, 0.13, 0.15); u_rect(x, y, w, h);\n      hot ? u_col(0.55, 0.55, 0.6) : u_col(0.30, 0.30, 0.33); u_box(x, y, w, h);\n      on ? u_col(1.0, 0.30, 0.25) : u_col(0.25, 0.25, 0.27);\n      u_rect(x + 8, y + h / 2 - 4, 8, 8);\n      gfx_setfont(1); u_col(0.9, 0.9, 0.92);\n      u_text(x + 22, y, w - 22, h, c[C_LABEL], 4);\n    ) : (\n      gfx_setfont(4); u_col(0.62, 0.63, 0.67);\n      u_text(x, y, w, 14, c[C_LABEL], 1 | 4);\n      on ? u_col(0.85, 0.22, 0.20) : u_col(0.15, 0.15, 0.17);\n      u_rect(x + w / 2 - 22, y + 22, 44, 28);\n      hot ? u_col(0.7, 0.7, 0.75) : u_col(0.32, 0.32, 0.35);\n      u_box(x + w / 2 - 22, y + 22, 44, 28);\n      gfx_setfont(2); on ? u_col(1, 1, 1) : u_col(0.55, 0.55, 0.6);\n      u_text(x, y + 22, w, 28, on ? \"On\" : \"Off\", 1 | 4);\n    );\n  ) : c[C_KIND] == K_BUTTON || c[C_KIND] == K_MOMENT ? (\n    on = (c[C_KIND] == K_MOMENT && v >= 0.5) || (c[C_IDX] == A_LEARN && c[C_KIND] == K_BUTTON && ui_learn == ui_pad + 1) ||\n         (c[C_KIND] == K_BUTTON && c[C_IDX] == A_XFER && xfer_chop_rev !== chop_rev);\n    on ? u_col(0.85, 0.22, 0.20) : hot ? u_col(0.24, 0.24, 0.27) : u_col(0.19, 0.19, 0.21);\n    u_rect(x, y, w, h);\n    u_col(0.36, 0.36, 0.40); u_box(x, y, w, h);\n    gfx_setfont(c[C_KIND] == K_MOMENT ? 2 : 1); u_col(0.95, 0.95, 0.97);\n    u_text(x, y, w, h, on && c[C_IDX] == A_LEARN && c[C_KIND] == K_BUTTON ? \"Press a Key\u00e2\u0080\u00a6\" : c[C_LABEL], 1 | 4);\n  );\n);\n\n// ---------------------------------------------------------------------------\n// Header, chop bar and the phrase view\n// ---------------------------------------------------------------------------\nfunction u_btn(x, y, w, h, label, lit)\n(\n  lit ? u_col(0.85, 0.22, 0.20) : u_in(x, y, w, h) ? u_col(0.26, 0.26, 0.29) : u_col(0.19, 0.19, 0.21);\n  u_rect(x, y, w, h);\n  u_col(0.36, 0.36, 0.40); u_box(x, y, w, h);\n  u_col(0.95, 0.95, 0.97);\n  u_text(x, y, w, h, label, 1 | 4);\n);\n\n// The panel's view of the audio thread: @block counts blocks and MIDI in and\n// out; the lights show whether those counts are moving.\nfunction u_watch()\n(\n  blk_count != u_blk_last ? ( u_blk_last = blk_count; u_blk_t = time_precise(); );\n  diag_in_n != u_in_last ? ( u_in_last = diag_in_n; u_in_t = time_precise(); );\n  diag_out_n != u_out_last ? ( u_out_last = diag_out_n; u_out_t = time_precise(); );\n);\nfunction u_engine_ok() ( time_precise() - u_blk_t < 0.5; );\n\nfunction u_led(x, label, on, r, g, b)\n(\n  on ? u_col(r, g, b) : x == 524 ? u_col(0.75, 0.18, 0.16) : u_col(0.25, 0.25, 0.27);\n  u_rect(x + 12, 10, 10, 10);\n  gfx_setfont(4); u_col(0.55, 0.56, 0.60);\n  u_text(x - 2, 22, 38, 12, label, 1);\n);\n\nfunction u_loader_alive()\n(\n  gmem[30] != u_hb_last ? ( u_hb_last = gmem[30]; u_hb_t = time_precise(); );\n  time_precise() - u_hb_t < 2;\n);\n\nfunction u_draw_header() local(blink)\n(\n  u_col(0.07, 0.07, 0.08); u_rect(0, 0, UI_W, 40);\n  u_col(0.85, 0.22, 0.20); u_rect(12, 12, 6, 16);\n  gfx_setfont(3); u_col(0.95, 0.95, 0.97);\n  u_text(24, 0, 260, 40, \"MIDI Production Center\", 4);\n  gfx_setfont(1);\n  time_precise() - u_msg_t < 5 && strlen(#u_msg) ? (\n    u_col(1.0, 0.75, 0.35);\n    u_text(262, 0, 258, 40, #u_msg, 4);\n  ) : (\n    u_col(0.95, 0.95, 0.97);\n    sprintf(#u_hdr, \"%s\", #src_name);\n    u_text(262, 4, 258, 18, #u_hdr, 4);\n    u_col(0.55, 0.56, 0.60);\n    sprintf(#u_hdr, \"%d notes \u00c2\u00b7 %.2f beats \u00c2\u00b7 %d BPM \u00c2\u00b7 %d/%d\", src_n, src_len, src_tempo, src_tsn, src_tsd);\n    u_text(262, 20, 258, 16, #u_hdr, 4);\n  );\n  u_led(524, \"Audio\", u_engine_ok(), 0.25, 0.85, 0.35);\n  u_led(560, \"In\", time_precise() - u_in_t < 0.15, 1.0, 0.75, 0.25);\n  u_led(596, \"Out\", time_precise() - u_out_t < 0.15, 1.0, 0.75, 0.25);\n  gfx_setfont(2);\n  blink = cap_rec && (time_precise() * 2 - floor(time_precise() * 2) < 0.5);\n  u_btn(630, 8, 104, 24, cap_rec ? \"Recording\" : cap_armed ? \"Sample (Armed)\" : \"Sample\", cap_armed && !blink);\n  u_btn(740, 8, 112, 24, \"Load Item\", 0);\n  u_btn(858, 8, 64, 24, \"Panic\", 0);\n  u_col(0.55, 0.56, 0.60); gfx_setfont(4);\n  u_text(926, 8, 66, 24, u_loader_alive() ? \"Loader on\" : \"Loader off\", 1 | 4);\n);\n\nfunction u_draw_chopbar() local(i, x, n)\n(\n  gfx_setfont(2); u_col(0.62, 0.63, 0.67);\n  u_text(12, 46, 44, 24, \"Chop\", 4);\n  i = 0;\n  loop(4,\n    x = 56 + i * 72;\n    slider1 == i ? u_col(0.85, 0.22, 0.20) : u_in(x, 46, 70, 24) ? u_col(0.26, 0.26, 0.29) : u_col(0.17, 0.17, 0.19);\n    u_rect(x, 46, 70, 24);\n    u_col(0.34, 0.34, 0.38); u_box(x, 46, 70, 24);\n    u_col(0.95, 0.95, 0.97); gfx_setfont(1);\n    u_text(x, 46, 70, 24, i == 0 ? \"Transient\" : i == 1 ? \"Grid\" : i == 2 ? \"Equal\" : \"Markers\", 1 | 4);\n    i += 1;\n  );\n  gfx_setfont(2); u_col(0.95, 0.95, 0.97);\n  sprintf(#u_hdr, \"%d slices\", slice_n);\n  u_text(896, 46, 92, 24, #u_hdr, 2 | 4);\n);\n\nfunction u_rx(b) ( RX + b / max(src_len, EPS) * RW; );\nfunction u_rb(x) ( mpc_clamp((x - RX) / RW * src_len, 0, src_len); );\n\n// A pad (current bank first) holding exactly slice si's region, or -1.\nfunction u_pad_for_slice(si) local(k, p, r, S, E)\n(\n  S = SLICE[si * SL_ST + SF_S]; E = SLICE[si * SL_ST + SF_E];\n  r = -1; k = 0;\n  while (k < MAX_PADS && r < 0) (\n    p = (ui_bank * 16 + k) % MAX_PADS;\n    abs(PAD[p * P_ST + PF_S] - S) < EPS && abs(PAD[p * P_ST + PF_E] - E) < EPS ? r = p;\n    k += 1;\n  );\n  r;\n);\n\nfunction u_draw_roll() local(lo, hi, i, a, x, y, w, rowh, S, E, bar, b, p, vv, pos)\n(\n  u_col(0.09, 0.09, 0.10); u_rect(RX, RY, RW, RH);\n  src_n > 0 && src_len > EPS ? (\n    lo = 127; hi = 0; i = 0;\n    loop(src_n, lo = min(lo, SRC[i * N_ST + 2]); hi = max(hi, SRC[i * N_ST + 2]); i += 1; );\n    hi - lo < 24 ? ( lo = max(floor((lo + hi) / 2) - 12, 0); hi = lo + 24; );\n    lo -= 1; hi += 1;\n    rowh = (RH - 18) / (hi - lo + 1);\n\n    // slices\n    i = 0;\n    loop(slice_n,\n      S = SLICE[i * SL_ST + SF_S]; E = SLICE[i * SL_ST + SF_E];\n      x = u_rx(S); w = u_rx(E) - x;\n      u_slice_col(i, 0.6, 0.8, 0.10); u_rect(x, RY, w, RH);\n      u_slice_col(i, 0.7, 1.0, 0.9); u_rect(x, RY, 1, RH);\n      gfx_setfont(4);\n      p = u_pad_for_slice(i);\n      p >= 0 ? u_pad_name(#u_hdr, p) : sprintf(#u_hdr, \"S%d\", i + 1);\n      w > 22 ? u_text(x + 3, RY + 2, w - 4, 12, #u_hdr, 0);\n      i += 1;\n    );\n    // the selected pad's region\n    mpc_pad_has(ui_pad) ? (\n      x = u_rx(PAD[ui_pad * P_ST + PF_S]); w = u_rx(PAD[ui_pad * P_ST + PF_E]) - x;\n      u_cola(1, 1, 1, 0.10); u_rect(x, RY, w, RH);\n      u_col(1, 1, 1); u_rect(x, RY + RH - 3, w, 3);\n    );\n\n    // beats and bars\n    bar = mpc_bar_beats(); b = 0;\n    while (b <= src_len && b < 1024) (\n      x = u_rx(b);\n      abs(b / bar - floor(b / bar + 0.5)) < 0.001 ? u_cola(1, 1, 1, 0.18) : u_cola(1, 1, 1, 0.06);\n      u_rect(x, RY + 16, 1, RH - 16);\n      b += 1;\n    );\n\n    // notes\n    i = 0;\n    loop(src_n,\n      a = SRC + i * N_ST;\n      x = u_rx(a[0]); w = max(u_rx(a[0] + a[1]) - x, 2);\n      y = RY + 16 + (hi - a[2]) * rowh;\n      gfx_set(0.35 + a[3] / 127 * 0.6, 0.35 + a[3] / 127 * 0.45, 0.30, 1);\n      u_rect(x, y, w, max(rowh - 1, 2));\n      i += 1;\n    );\n\n    // markers\n    slider1 == 3 ? (\n      i = 0;\n      loop(mark_ui_n,\n        x = u_rx(MARK_UI[i]);\n        i == u_drag_mark ? u_col(1, 1, 1) : u_col(1.0, 0.75, 0.3);\n        u_rect(x, RY, 1, RH);\n        gfx_triangle(u_X(x - 5), u_Y(RY), u_X(x + 5), u_Y(RY), u_X(x), u_Y(RY + 8));\n        i += 1;\n      );\n    );\n\n    // playheads\n    i = 0;\n    loop(MAX_V,\n      vv = VOICE + i * V_ST;\n      vv[V_ON] ? (\n        pos = vv[V_STUT] ? vv[V_SPOS] : vv[V_POS];\n        vv[V_REV] ? pos = vv[V_L] - pos;\n        x = u_rx(vv[V_S] + pos);\n        u_slice_col(vv[V_SLICE], 0.3, 1, 1); u_rect(x, RY, 2, RH);\n      );\n      i += 1;\n    );\n  ) : (\n    gfx_setfont(5); u_col(0.6, 0.6, 0.65);\n    u_text(RX, RY, RW, RH, \"No phrase loaded \u00e2\u0080\u0094 click Sample or Load Item\", 1 | 4);\n  );\n\n  slider1 == 3 && !cap_armed ? (\n    gfx_setfont(4); u_cola(0, 0, 0, 0.6); u_rect(RX + RW - 290, RY + RH - 16, 290, 16);\n    u_col(1.0, 0.8, 0.45);\n    u_text(RX + RW - 286, RY + RH - 16, 282, 16, \"Double-click to add a marker \u00c2\u00b7 Drag to move \u00c2\u00b7 Right-click to delete\", 4);\n  );\n  cap_armed ? (\n    u_cola(0.5, 0.05, 0.05, 0.55); u_rect(RX, RY + RH - 26, RW, 26);\n    gfx_setfont(2); u_col(1, 1, 1);\n    cap_rec ? sprintf(#u_hdr, \"Recording \u00e2\u0080\u0094 %d notes so far. Stop REAPER to finish.\", cap_n) :\n      strcpy(#u_hdr, \"Sample armed \u00e2\u0080\u0094 press Play in REAPER and MIDI arriving on this track is recorded. Click Sample again to cancel.\");\n    u_text(RX, RY + RH - 26, RW, 26, #u_hdr, 1 | 4);\n  );\n  u_col(0.30, 0.30, 0.33); u_box(RX, RY, RW, RH);\n);\n\n// ---------------------------------------------------------------------------\n// Pads\n// ---------------------------------------------------------------------------\nfunction u_pad_xy(k) ( u_padx = PX + (k % 4) * (PW + PG); u_pady = PY + (3 - floor(k / 4)) * (PH + PG); );\n\nfunction u_draw_pads() local(k, p, si, has, lit, hit, n, x)\n(\n  // bank buttons\n  k = 0;\n  loop(4,\n    x = PX + k * 98;\n    ui_bank == k ? u_col(0.85, 0.22, 0.20) : u_in(x, 266, 92, 24) ? u_col(0.26, 0.26, 0.29) : u_col(0.17, 0.17, 0.19);\n    u_rect(x, 266, 92, 24);\n    u_col(0.34, 0.34, 0.38); u_box(x, 266, 92, 24);\n    gfx_setfont(2); u_col(0.95, 0.95, 0.97);\n    u_text(x, 266, 92, 24, k == 0 ? \"Bank A\" : k == 1 ? \"Bank B\" : k == 2 ? \"Bank C\" : \"Bank D\", 1 | 4);\n    k += 1;\n  );\n  k = 0;\n  loop(16,\n    p = ui_bank * 16 + k;\n    u_pad_xy(k);\n    si = PAD[p * P_ST + PF_SLICE];\n    has = mpc_pad_has(p);\n    n = has ? mpc_count_in(PAD[p * P_ST + PF_S], PAD[p * P_ST + PF_E]) : 0;\n    lit = mpc_pad_active(p);\n    hit = (mpc_now - PADHIT[p]) / max(srate, 1) < 0.12 && PADHIT[p] > 0;\n    lit || hit ? u_slice_col(si, 0.65, hit ? 1 : 0.85, 1) : u_col(0.20, 0.20, 0.22);\n    u_rect(u_padx, u_pady, PW, PH);\n    has && n > 0 ? ( u_slice_col(si, 0.7, 0.9, 1); u_rect(u_padx, u_pady, PW, 4); );\n    p == ui_pad ? ( u_col(1, 1, 1); u_box(u_padx - 1, u_pady - 1, PW + 2, PH + 2); u_box(u_padx, u_pady, PW, PH); ) :\n      ( u_col(0.32, 0.32, 0.35); u_box(u_padx, u_pady, PW, PH); );\n    lit || hit ? u_col(0.05, 0.05, 0.05) : u_col(0.92, 0.92, 0.94);\n    gfx_setfont(2); u_pad_name(#u_hdr, p);\n    u_text(u_padx + 6, u_pady + 8, PW - 8, 14, #u_hdr, 0);\n    gfx_setfont(5);\n    !has ? strcpy(#u_hdr, \"\u00e2\u0080\u0094\") : si < 0 ? strcpy(#u_hdr, \"All\") : sprintf(#u_hdr, \"S%d\", si + 1);\n    u_text(u_padx, u_pady + 22, PW, 34, #u_hdr, 1 | 4);\n    gfx_setfont(4);\n    u_note_name(#u_hdr, PAD[p * P_ST + PF_NOTE]);\n    u_text(u_padx + 6, u_pady + PH - 16, PW - 12, 12, #u_hdr, 0);\n    has ? ( sprintf(#u_hdr, \"%d notes\", n); u_text(u_padx + 6, u_pady + PH - 16, PW - 12, 12, #u_hdr, 2); );\n    k += 1;\n  );\n);\n\n// ---------------------------------------------------------------------------\n// Pages\n// ---------------------------------------------------------------------------\nfunction u_draw_tabs() local(i, x)\n(\n  i = 0;\n  loop(3,\n    x = TX + i * 110;\n    ui_tab == i ? u_col(0.24, 0.24, 0.27) : u_in(x, TY, 106, 24) ? u_col(0.20, 0.20, 0.22) : u_col(0.14, 0.14, 0.16);\n    u_rect(x, TY, 106, 24);\n    ui_tab == i ? ( u_col(0.85, 0.22, 0.20); u_rect(x, TY + 22, 106, 2); );\n    gfx_setfont(2); u_col(0.95, 0.95, 0.97);\n    u_text(x, TY, 106, 24, i == 0 ? \"Pad\" : i == 1 ? \"FX\" : \"Setup\", 1 | 4);\n    i += 1;\n  );\n  u_col(0.14, 0.14, 0.16); u_rect(TX, TY + 26, TW, UI_H - TY - 34);\n);\n\nfunction u_draw_minilist(x, y, w, h) local(a, S, E, L, rev, i, i1, lo, hi, rowh, n, s, e, cs, ce)\n(\n  u_col(0.09, 0.09, 0.10); u_rect(x, y, w, h);\n  mpc_pad_has(ui_pad) ? (\n    a = PAD + ui_pad * P_ST;\n    S = a[PF_S]; E = a[PF_E]; L = max(E - S, EPS); rev = a[PF_REV];\n    i1 = mpc_src_find(E - EPS);\n    lo = 127; hi = 0; i = mpc_src_find(S - EPS);\n    loop(i1 - i, lo = min(lo, SRC[i * N_ST + 2]); hi = max(hi, SRC[i * N_ST + 2]); i += 1; );\n    lo -= 1; hi += 1;\n    n = max(hi - lo + 1, 12);\n    rowh = h / n;\n    i = mpc_src_find(S - EPS);\n    u_slice_col(a[PF_SLICE], 0.55, 0.95, 1);\n    loop(i1 - i,\n      s = SRC[i * N_ST]; e = s + SRC[i * N_ST + 1];\n      cs = s - S; ce = min(e, E) - S;\n      rev ? ( cs = L - ce; ce = L - (s - S); );\n      u_rect(x + cs / L * w, y + (hi - SRC[i * N_ST + 2]) * rowh + (h - (hi - lo + 1) * rowh) / 2,\n             max((ce - cs) / L * w, 2), max(rowh - 1, 2));\n      i += 1;\n    );\n  );\n  u_col(0.30, 0.30, 0.33); u_box(x, y, w, h);\n);\n\nfunction u_draw_padpage() local(a, si)\n(\n  gfx_setfont(3); u_col(0.95, 0.95, 0.97);\n  u_pad_name(#u_hdr, ui_pad);\n  u_text(424, 298, 80, 28, #u_hdr, 4);\n  gfx_setfont(1); u_col(0.62, 0.63, 0.67);\n  a = PAD + ui_pad * P_ST; si = a[PF_SLICE];\n  mpc_pad_has(ui_pad) ? (\n    sprintf(#u_hdr, \"%s \u00c2\u00b7 beats %.2f\u00e2\u0080\u0093%.2f \u00c2\u00b7 %d notes\",\n      si < 0 ? \"Whole phrase\" : sprintf(#u_t2, \"Slice %d\", si + 1),\n      a[PF_S], a[PF_E], mpc_count_in(a[PF_S], a[PF_E]));\n  ) : strcpy(#u_hdr, \"Empty \u00e2\u0080\u0094 click Transfer to Pads, or drag a slice onto a pad\");\n  u_text(500, 298, 480, 28, #u_hdr, 4);\n  u_draw_minilist(424, 570, 556, 76);\n);\n\nfunction u_fx_on_slider(k) ( k == 0 ? 12 : k == 1 ? 18 : k == 2 ? 26 : k == 3 ? 31 : k == 4 ? 37 : 44; );\nfunction u_fx_name(k) ( k == 0 ? \"Filter\" : k == 1 ? \"EQ\" : k == 2 ? \"Compressor\" : k == 3 ? \"Delay\" : k == 4 ? \"Stutter\" : \"Pitch Correction\"; );\nfunction u_fx_help(k)\n(\n  k == 0 ? \"Removes notes past the cutoff pitch. Slope fades them out instead.\" :\n  k == 1 ? \"Raises or lowers the velocity of notes in the low, mid and high ranges.\" :\n  k == 2 ? \"Pulls velocities, pitches or timing closer together.\" :\n  k == 3 ? \"Repeats each note, fading by the feedback. Pitch Step shifts the repeats.\" :\n  k == 4 ? \"Repeats a short window of what the pads play while engaged.\" :\n  \"Snaps notes to a key and scale.\";\n);\n\nfunction u_draw_fxpage() local(k, y, on, s)\n(\n  k = 0;\n  loop(6,\n    y = 298 + k * 48;\n    s = u_fx_on_slider(k);\n    on = slider(s) >= 0.5;\n    ui_fx == k ? u_col(0.24, 0.24, 0.27) : u_in(FL_X, y, FL_W, 44) ? u_col(0.19, 0.19, 0.21) : u_col(0.16, 0.16, 0.18);\n    u_rect(FL_X + 4, y, FL_W - 8, 44);\n    ui_fx == k ? ( u_col(0.85, 0.22, 0.20); u_rect(FL_X + 4, y, 3, 44); );\n    on ? u_col(1.0, 0.30, 0.25) : u_col(0.28, 0.28, 0.30);\n    u_rect(FL_X + 14, y + 17, 10, 10);\n    gfx_setfont(2); u_col(0.95, 0.95, 0.97);\n    u_text(FL_X + 32, y + 4, FL_W - 36, 20, u_fx_name(k), 4);\n    gfx_setfont(4); u_col(0.55, 0.56, 0.60);\n    u_text(FL_X + 32, y + 22, FL_W - 36, 16, on ? \"On\" : \"Off\", 4);\n    k += 1;\n  );\n  gfx_setfont(4); u_col(0.45, 0.46, 0.50);\n  u_text(FL_X + 8, 590, FL_W - 12, 14, \"Runs top to bottom.\", 0);\n  u_text(FL_X + 8, 604, FL_W - 12, 14, \"Stutter acts on the pads.\", 0);\n\n  gfx_setfont(3); u_col(0.95, 0.95, 0.97);\n  u_text(570, 298, 300, 26, u_fx_name(ui_fx), 4);\n  gfx_setfont(1); u_col(0.62, 0.63, 0.67);\n  u_text(570, 322, 410, 20, u_fx_help(ui_fx), 4);\n  s = u_fx_on_slider(ui_fx);\n  u_btn(900, 300, 80, 22, slider(s) >= 0.5 ? \"On\" : \"Off\", slider(s) >= 0.5);\n);\n\nfunction u_draw_setuppage()\n(\n  gfx_setfont(3); u_col(0.95, 0.95, 0.97);\n  u_text(424, 298, 300, 28, \"Setup\", 4);\n  gfx_setfont(2); u_col(0.95, 0.95, 0.97);\n  u_text(424, 462, 556, 16, \"Getting a Phrase In\", 0);\n  gfx_setfont(1); u_col(0.70, 0.71, 0.75);\n  u_text(424, 480, 556, 16, \"Sample: click it, then press Play in REAPER \u00e2\u0080\u0094 MIDI arriving on this track is recorded.\", 0);\n  u_text(424, 496, 556, 16, \"Load Item: select a MIDI item and click Load Item (the MPC Loader script must be running).\", 0);\n  u_text(424, 512, 556, 16, \"Or select the item and run \u00e2\u0080\u009cMPC - Load selected MIDI item\u00e2\u0080\u009d from the Actions list.\", 0);\n  gfx_setfont(2); u_col(0.95, 0.95, 0.97);\n  u_text(424, 536, 556, 16, \"Playing\", 0);\n  gfx_setfont(1); u_col(0.70, 0.71, 0.75);\n  u_text(424, 554, 556, 16, \"Pads answer MIDI notes: bank A starts at 36 (C2), B at 52 (E3), C at 68 (G#4), D at 84 (C6).\", 0);\n  u_text(424, 570, 556, 16, \"Transfer to Pads fills this bank with the chops, or drag one slice onto a pad.\", 0);\n  u_text(424, 586, 556, 16, \"Click a slice to hear it. Command-drag a knob for fine steps; double-click to reset it.\", 0);\n  sprintf(#u_hdr, \"Instance ID %d (used by the loader script)\", slider48);\n  gfx_setfont(4); u_col(0.45, 0.46, 0.50);\n  u_text(424, 620, 556, 16, #u_hdr, 0);\n);\n\n// ---------------------------------------------------------------------------\n// Actions\n// ---------------------------------------------------------------------------\nfunction u_select_pad(p) ( ui_pad = mpc_clamp(p | 0, 0, MAX_PADS - 1); ui_bank = floor(ui_pad / 16); );\n\nfunction u_changed() ( sliderchange(-1); );   // undo point + marks the project dirty\n\nfunction u_action(id) local(i, n)\n(\n  id == A_LEARN ? (\n    ui_learn = ui_learn == ui_pad + 1 ? 0 : ui_pad + 1;\n  ) : id == A_TOMARK ? (\n    // freeze the current chops as editable markers\n    n = 0; i = 0;\n    loop(slice_n, n < MAX_MARK ? ( MARK_UI[n] = SLICE[i * SL_ST + SF_S]; n += 1; ); i += 1; );\n    mark_ui_n = n; mark_rev += 1;\n    slider1 = 3; mpc_touch(1, 0);\n    u_changed(); u_msg(\"Chops copied to markers \u00e2\u0080\u0094 drag to adjust\");\n  ) : id == A_CLEARMARK ? (\n    mark_ui_n = 0; mark_rev += 1; u_changed();\n  ) : id == A_RESETPAD ? (\n    mpc_pad_default(ui_pad); u_changed();\n  ) : id == A_RESETALL ? (\n    mpc_pads_default(); u_changed(); u_msg(\"All 64 pads reset\");\n  ) : id == A_MAPCHROM ? (\n    i = 0; loop(MAX_PADS, PAD[i * P_ST + PF_NOTE] = min(36 + i, 127); i += 1; );\n    u_changed(); u_msg(\"Pad notes reset to start at note 36\");\n  ) : id == A_DEMO ? (\n    ui_req_demo = 1; u_changed();\n  ) : id == A_XFER ? (\n    ui_req_xfer = ui_bank * 16 + 1;\n    u_xfer_wait = 1;\n  );\n);\n\nfunction u_menu_for(c) local(n, i, cur)\n(\n  n = u_nfields(c[C_OPTS]); cur = u_ctl_get(c) | 0;\n  strcpy(#u_menu, \"\"); i = 0;\n  loop(n,\n    i > 0 ? strcat(#u_menu, \"|\");\n    i == cur ? strcat(#u_menu, \"!\");\n    strcat(#u_menu, u_field(#u_t2, c[C_OPTS], i));\n    i += 1;\n  );\n  gfx_x = mouse_x; gfx_y = mouse_y;\n  i = gfx_showmenu(#u_menu);\n  i > 0 ? ( u_ctl_set(c, i - 1, 1); u_changed(); );\n);\n\nfunction u_hit_ctl() local(i, c, r)\n(\n  r = 0; i = ui_nctl - 1;\n  while (i >= 0 && !r) (\n    c = CTL + i * C_ST;\n    u_ctl_shown(c) && u_in(c[C_X], c[C_Y], c[C_W], c[C_H]) ? r = c;\n    i -= 1;\n  );\n  r;\n);\n\nfunction u_mark_hit() local(i, r, d, best)\n(\n  r = -1; best = 6; i = 0;\n  loop(mark_ui_n,\n    d = abs(u_rx(MARK_UI[i]) - u_mx);\n    d < best ? ( best = d; r = i; );\n    i += 1;\n  );\n  r;\n);\n\n// Snaps a position to a nearby note start, else to 1/16 (Shift = no snap).\nfunction u_snap(b) local(i, s, d, best, r)\n(\n  mouse_cap & 8 ? b : (\n    r = floor(b / 0.25 + 0.5) * 0.25; best = 7; i = 0;\n    loop(src_n,\n      s = SRC[i * N_ST]; d = abs(u_rx(s) - u_rx(b));\n      d < best ? ( best = d; r = s; );\n      i += 1;\n    );\n    mpc_clamp(r, 0, src_len);\n  );\n);\n\nfunction u_slice_at(b) local(i, r)\n(\n  r = -1; i = 0;\n  loop(slice_n, b >= SLICE[i * SL_ST + SF_S] && b < SLICE[i * SL_ST + SF_E] ? r = i; i += 1; );\n  r;\n);\n\nfunction u_pad_at() local(k, r)\n(\n  r = -1; k = 0;\n  loop(16, u_pad_xy(k); u_in(u_padx, u_pady, PW, PH) ? r = ui_bank * 16 + k; k += 1; );\n  r;\n);\n\nfunction u_audition(p, vel)\n(\n  u_aud_pad = p + 1;\n  ui_aud_vel = vel; ui_aud_on = p + 1;\n);\n\nfunction u_press() local(c, i, now, p, si, b, dbl)\n(\n  now = time_precise();\n  c = u_hit_ctl();\n  dbl = now - u_click_t < 0.35 && abs(u_mx - u_click_x) < 4 && abs(u_my - u_click_y) < 4;\n  u_click_t = now; u_click_x = u_mx; u_click_y = u_my;\n  c ? (\n    c[C_KIND] == K_KNOB || c[C_KIND] == K_VALUE ? (\n      dbl ? ( u_ctl_set(c, c[C_DEF], 1); u_changed(); ) : (\n        u_drag_ctl = c; u_drag_y = u_my; u_drag_x = u_mx; u_drag_v = u_ctl_get(c);\n      );\n    ) : c[C_KIND] == K_ENUM ? (\n      u_menu_for(c);\n    ) : c[C_KIND] == K_TOGGLE ? (\n      u_ctl_set(c, u_ctl_get(c) >= 0.5 ? 0 : 1, 1); u_changed();\n    ) : c[C_KIND] == K_MOMENT ? (\n      u_ctl_set(c, 1, 0); u_drag_ctl = c;\n    ) : c[C_KIND] == K_BUTTON ? (\n      u_action(c[C_IDX]);\n    );\n  ) : u_in(630, 8, 104, 24) ? (\n    ui_req_cap = 1;\n  ) : u_in(740, 8, 112, 24) ? (\n    u_loader_alive() ? (\n      gmem[20] = slider48; u_req_seq = gmem[21] + 1; gmem[21] = u_req_seq;\n      u_wait_ack = 1; u_ack_prev = gmem[10];\n      u_msg(\"Loading the selected MIDI item\u00e2\u0080\u00a6\");\n    ) : (\n      u_msg(\"Start the MPC Loader script (see Setup)\");\n    );\n  ) : u_in(858, 8, 64, 24) ? (\n    ui_req_panic = 1;\n  ) : u_in(56, 46, 288, 24) ? (\n    slider1 = mpc_clamp(floor((u_mx - 56) / 72), 0, 3); mpc_touch(1, 1); u_changed();\n  ) : u_in(TX, TY, 330, 24) ? (\n    ui_tab = mpc_clamp(floor((u_mx - TX) / 110), 0, 2);\n  ) : u_in(PX, 266, 390, 24) ? (\n    ui_bank = mpc_clamp(floor((u_mx - PX) / 98), 0, 3);\n    u_select_pad(ui_bank * 16 + ui_pad % 16);\n  ) : (p = u_pad_at()) >= 0 ? (\n    u_select_pad(p);\n    u_pad_xy(p % 16);\n    u_audition(p, floor(127 - (u_my - u_pady) / PH * 87));\n    !mpc_pad_has(p) ? u_msg(\"This pad is empty \u00e2\u0080\u0094 click Transfer to Pads\") :\n    !u_engine_ok() ? u_msg(\"Audio is off \u00e2\u0080\u0094 see \u00e2\u0080\u009cNo sound?\u00e2\u0080\u009d in the README\");\n  ) : ui_tab == 1 && u_in(FL_X, 298, FL_W, 6 * 48) ? (\n    i = mpc_clamp(floor((u_my - 298) / 48), 0, 5);\n    u_mx < FL_X + 30 ? (\n      slider(u_fx_on_slider(i)) = slider(u_fx_on_slider(i)) >= 0.5 ? 0 : 1;\n      mpc_touch(u_fx_on_slider(i), 1); u_changed();\n    );\n    ui_fx = i;\n  ) : ui_tab == 1 && u_in(900, 300, 80, 22) ? (\n    i = u_fx_on_slider(ui_fx);\n    slider(i) = slider(i) >= 0.5 ? 0 : 1; mpc_touch(i, 1); u_changed();\n  ) : u_in(RX, RY, RW, RH) && src_len > EPS ? (\n    b = u_rb(u_mx);\n    slider1 == 3 && (i = u_mark_hit()) >= 0 ? (\n      u_drag_mark = i;\n    ) : slider1 == 3 && dbl ? (\n      mark_ui_n < MAX_MARK ? ( MARK_UI[mark_ui_n] = u_snap(b); mark_ui_n += 1; mark_rev += 1; u_changed(); );\n    ) : (\n      si = u_slice_at(b);\n      si >= 0 ? (\n        u_drag_slice = si + 1;\n        p = u_pad_for_slice(si);\n        p >= 0 ? ( u_select_pad(p); u_audition(p, 110); ) : u_msg(\"Drag this slice onto a pad to play it\");\n      );\n    );\n  );\n);\n\nfunction u_drag() local(c, range, fine, v)\n(\n  c = u_drag_ctl;\n  c && (c[C_KIND] == K_KNOB || c[C_KIND] == K_VALUE) ? (\n    range = c[C_MAX] - c[C_MIN];\n    fine = mouse_cap & 4 ? 0.1 : 1;\n    v = u_drag_v + ((u_drag_y - u_my) + (c[C_KIND] == K_VALUE ? (u_mx - u_drag_x) : 0)) * range / 160 * fine;\n    u_ctl_set(c, v, 0);\n  );\n  u_drag_mark >= 0 && u_drag_mark < mark_ui_n ? (\n    MARK_UI[u_drag_mark] = u_snap(u_rb(u_mx)); mark_rev += 1;\n  );\n);\n\nfunction u_release() local(c, p, si)\n(\n  c = u_drag_ctl;\n  c ? (\n    c[C_KIND] == K_MOMENT ? u_ctl_set(c, 0, 1) : (c[C_TGT] == T_SLIDER ? mpc_touch(c[C_IDX], 1));\n    u_changed();\n  );\n  u_drag_mark >= 0 ? u_changed();\n  u_drag_slice > 0 ? (\n    p = u_pad_at();\n    si = u_drag_slice - 1;\n    p >= 0 ? (\n      mpc_pad_set_slice(p, si); u_select_pad(p); u_changed();\n      u_pad_name(#u_t2, p); sprintf(#u_hdr, \"Slice %d \u00e2\u0086\u0092 pad %s\", si + 1, #u_t2); u_msg(#u_hdr);\n    );\n  );\n  u_aud_pad > 0 ? ( ui_aud_off = u_aud_pad; u_aud_pad = 0; );\n  u_drag_ctl = 0; u_drag_mark = -1; u_drag_slice = 0;\n);\n\nfunction u_rclick() local(p, i, r)\n(\n  gfx_x = mouse_x; gfx_y = mouse_y;\n  (p = u_pad_at()) >= 0 ? (\n    u_select_pad(p);\n    r = gfx_showmenu(\"Copy Pad Settings|Paste Pad Settings|Reset Pad||Play Whole Phrase|Mute (No Slice)\");\n    r == 1 ? memcpy(PADCLIP, PAD + p * P_ST, P_ST);\n    r == 2 ? ( i = PAD[p * P_ST + PF_NOTE]; memcpy(PAD + p * P_ST, PADCLIP, P_ST); PAD[p * P_ST + PF_NOTE] = i; u_changed(); );\n    r == 3 ? ( mpc_pad_default(p); u_changed(); );\n    r == 4 ? ( mpc_pad_set_slice(p, -1); u_changed(); );\n    r == 5 ? ( mpc_pad_set_slice(p, NO_SLICE); u_changed(); );\n  ) : slider1 == 3 && u_in(RX, RY, RW, RH) && (i = u_mark_hit()) >= 0 ? (\n    MARK_UI[i] = MARK_UI[mark_ui_n - 1]; mark_ui_n -= 1; mark_rev += 1; u_changed();\n  );\n);\n\nfunction u_wheel() local(c, d)\n(\n  c = u_hit_ctl();\n  c && c[C_KIND] != K_BUTTON && c[C_KIND] != K_MOMENT ? (\n    d = mouse_wheel > 0 ? 1 : -1;\n    c[C_KIND] == K_TOGGLE ? u_ctl_set(c, d > 0, 1) :\n      u_ctl_set(c, u_ctl_get(c) + d * max(c[C_STEP], (c[C_MAX] - c[C_MIN]) / 100), 1);\n    u_changed();\n  );\n  mouse_wheel = 0;\n);\n\n// ---------------------------------------------------------------------------\n// Frame\n// ---------------------------------------------------------------------------\nfunction mpc_ui_frame() local(sc, lb, rb, i, c)\n(\n  sc = max(min(gfx_w / UI_W, gfx_h / UI_H), 0.3);\n  sc != u_sc ? ( u_sc = sc; u_fonts(); );\n  u_ox = floor((gfx_w - UI_W * u_sc) / 2); u_oy = 0;\n  u_mx = (mouse_x - u_ox) / u_sc; u_my = (mouse_y - u_oy) / u_sc;\n  !u_booted ? (\n    u_booted = 1; u_drag_mark = -1; u_select_pad(ui_pad);\n    u_empty_seen = diag_empty_n; u_xfer_seen = xfer_done;\n  );\n\n  u_watch();\n  u_xfer_wait && xfer_done != u_xfer_seen ? (\n    u_xfer_wait = 0; u_xfer_seen = xfer_done;\n    u_pad_name(#u_t2, ui_bank * 16);\n    sprintf(#u_hdr, \"%d slices transferred to pads from %s\", xfer_count, #u_t2); u_msg(#u_hdr);\n    u_changed();\n  );\n  u_xfer_wait == 0 ? u_xfer_seen = xfer_done;\n  diag_empty_n != u_empty_seen ? (\n    u_empty_seen = diag_empty_n;\n    diag_empty > 0 ? (\n      u_pad_name(#u_t2, diag_empty - 1);\n      sprintf(#u_hdr, \"Pad %s was played but is empty\", #u_t2); u_msg(#u_hdr);\n    );\n  );\n\n  // loader replies\n  u_wait_ack && gmem[10] != u_ack_prev ? (\n    u_wait_ack = 0;\n    sprintf(#u_hdr, \"Loaded %d notes\", gmem[11]); u_msg(#u_hdr);\n    u_changed();\n  );\n  u_wait_ack && gmem[23] == u_req_seq && gmem[22] > 0 ? (\n    u_wait_ack = 0;\n    gmem[22] == 1 ? u_msg(\"Select a MIDI item, then click Load Item\") :\n    gmem[22] == 2 ? u_msg(\"The selected item has no notes\") :\n    u_msg(\"The loader couldn\u00e2\u0080\u0099t find this plug-in\");\n  );\n\n  // input\n  lb = mouse_cap & 1; rb = mouse_cap & 2;\n  lb && !u_lb ? u_press();\n  lb && u_lb ? u_drag();\n  !lb && u_lb ? u_release();\n  rb && !u_rb ? u_rclick();\n  mouse_wheel != 0 ? u_wheel();\n  u_lb = lb; u_rb = rb;\n\n  // draw\n  u_col(0.11, 0.11, 0.12); gfx_rect(0, 0, gfx_w, gfx_h);\n  u_draw_header();\n  u_draw_chopbar();\n  u_draw_roll();\n  u_draw_pads();\n  u_draw_tabs();\n  ui_tab == 0 ? u_draw_padpage() : ui_tab == 1 ? u_draw_fxpage() : u_draw_setuppage();\n  i = 0;\n  loop(ui_nctl, c = CTL + i * C_ST; u_ctl_shown(c) ? u_draw_ctl(c); i += 1; );\n  u_drag_slice > 0 ? (\n    gfx_setfont(2); u_col(1, 1, 1);\n    sprintf(#u_hdr, \"S%d\", u_drag_slice);\n    u_text(u_mx + 10, u_my, 60, 16, #u_hdr, 0);\n  );\n);\n"};

/* ---- kit/runtime/jsfx.js ---- */
/* Middaw's JSFX runtime: the family's REAPER plug-ins, run unchanged.
 *
 * A JSFX file is a header (sliders, pins, imports) and sections of EEL2 code:
 * @init, @slider, @block, @sample, @serialize and @gfx. This file reads the
 * header, compiles the EEL2 in each section to JavaScript, and runs it the way
 * REAPER does: @init once, @slider when a slider moves, then for every block
 * @block once and @sample once per sample frame. MIDI arrives through
 * midirecv() and leaves through midisend() with its sample offset.
 *
 * @gfx is not run by default: Middaw draws each device's controls itself from
 * the sliders, so a device looks like the rest of the app. With
 * `{ gfx: true }` it is compiled too, and `runGfx(host, ...)` runs it: every
 * gfx_* call goes to the host, which draws (the Ableton devices' [v8ui]).
 *
 * Everything in EEL2 is a double. Variables live in one Float64Array, so the
 * generated code reads `v[12]`; memory (`buf[i]`) is EEL2's 8M words, given
 * out in 64k-word blocks only when written to, as EEL2 itself does.
 */
(function (NS) {
  'use strict';

  var EPS = 0.00001;
  var MAXLOOP = 1048576;
  var BLOCK = 65536, NBLOCKS = 128;

  // ------------------------------------------------------------ header ----
  function parseSliderLine(line) {
    var m = /^slider(\d+):(?:([A-Za-z_][\w.]*)=)?\s*([^<]*?)\s*<([^>]*)>(.*)$/.exec(line);
    if (!m) return null;
    var inner = m[4], enumNames = null;
    var em = /\{([^}]*)\}/.exec(inner);
    if (em) { enumNames = em[1].split(','); inner = inner.replace(em[0], ''); }
    var shape = null, sm = /:(log|sqr)(?:=([^,>]*))?/.exec(inner);
    if (sm) { shape = { kind: sm[1], value: sm[2] === undefined ? null : Number(sm[2]) }; inner = inner.replace(sm[0], ''); }
    var parts = inner.split(',').map(function (s) { return s.trim(); });
    var desc = m[5].trim();
    var hidden = desc[0] === '-';
    if (hidden) desc = desc.slice(1);
    return {
      index: Number(m[1]), variable: (m[2] || ('slider' + m[1])).toLowerCase(),
      def: Number(m[3]) || 0, min: Number(parts[0]) || 0, max: parts[1] === undefined ? 1 : Number(parts[1]),
      step: parts[2] === undefined || parts[2] === '' ? 0 : Number(parts[2]),
      names: enumNames, shape: shape, name: desc, hidden: hidden
    };
  }

  // A JSFX file and its imports -> header and sections.
  function parseFile(text, readImport) {
    var out = { desc: '', sliders: [], inPins: [], outPins: [], options: '', sections: {}, gfxSize: null };
    var order = ['init', 'slider', 'block', 'sample', 'serialize', 'gfx'];
    order.forEach(function (s) { out.sections[s] = []; });
    function take(src, isImport) {
      var lines = src.replace(/\r\n?/g, '\n').split('\n');
      var section = null, buf = [], startLine = 0;
      function flush() {
        if (section && out.sections[section]) out.sections[section].push({ code: buf.join('\n'), line: startLine });
        buf = [];
      }
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var sm = /^@(\w+)(.*)$/.exec(line);
        if (sm) {
          flush();
          section = sm[1].toLowerCase();
          startLine = i + 2;
          if (section === 'gfx') {
            var sz = sm[2].trim().split(/\s+/).map(Number);
            if (sz.length >= 2 && !out.gfxSize) out.gfxSize = [sz[0], sz[1]];
          }
          continue;
        }
        if (section) { buf.push(line); continue; }
        var t = line.trim();
        if (/^desc:/.test(t)) { if (!isImport || !out.desc) out.desc = t.slice(5).trim(); }
        else if (/^slider\d+:/.test(t)) { var s = parseSliderLine(t); if (s) out.sliders.push(s); }
        else if (/^in_pin:/.test(t)) out.inPins.push(t.slice(7).trim());
        else if (/^out_pin:/.test(t)) out.outPins.push(t.slice(8).trim());
        else if (/^options:/.test(t)) out.options += ' ' + t.slice(8).trim();
        else if (/^import\s+/.test(t)) {
          var name = t.replace(/^import\s+/, '').trim();
          var inc = readImport ? readImport(name) : null;
          if (inc === null || inc === undefined) throw new Error('JSFX import not found: ' + name);
          take(inc, true);
        }
      }
      flush();
    }
    take(text, false);
    out.sliders.sort(function (a, b) { return a.index - b.index; });
    out.inPins = out.inPins.filter(function (p) { return p !== 'none'; });
    out.outPins = out.outPins.filter(function (p) { return p !== 'none'; });
    return out;
  }

  // ------------------------------------------------------------- lexer ----
  var OPS = ['===', '!==', '<<=', '>>=', '==', '!=', '<=', '>=', '<<', '>>', '&&', '||',
    '+=', '-=', '*=', '/=', '%=', '^=', '|=', '&=', '~=',
    '+', '-', '*', '/', '%', '^', '<', '>', '!', '&', '|', '~', '?', ':',
    '(', ')', '[', ']', ',', ';', '='];
  var CONSTS = { pi: Math.PI, phi: (1 + Math.sqrt(5)) / 2, e: Math.E };

  function EelError(msg, line) { this.message = (line ? 'line ' + line + ': ' : '') + msg; this.line = line; }
  EelError.prototype = Object.create(Error.prototype);
  EelError.prototype.name = 'EelError';

  // REAPER's strings are bytes: one character per UTF-8 byte, as the C runtime
  // keeps them.
  function bytes(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.codePointAt(i);
      if (c > 0xffff) i++;
      if (c < 0x80) out += String.fromCharCode(c);
      else if (c < 0x800) out += String.fromCharCode(0xc0 | c >> 6, 0x80 | c & 63);
      else if (c < 0x10000) out += String.fromCharCode(0xe0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63);
      else out += String.fromCharCode(0xf0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63);
    }
    return out;
  }

  function lex(src, firstLine) {
    var toks = [], i = 0, n = src.length, line = firstLine || 1;
    while (i < n) {
      var c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { var j = src.indexOf('\n', i); i = j < 0 ? n : j; continue; }
      if (c === '/' && src[i + 1] === '*') {
        var k = src.indexOf('*/', i + 2); if (k < 0) k = n;
        for (var q = i; q < k; q++) if (src[q] === '\n') line++;
        i = k + 2; continue;
      }
      if (c === '"') {
        var buf = '', p = i + 1;
        while (p < n && src[p] !== '"') {
          if (src[p] === '\\' && p + 1 < n) {
            var e = src[p + 1];
            buf += e === 'n' ? '\n' : e === 't' ? '\t' : e === 'r' ? '\r' : e; p += 2;
          } else { if (src[p] === '\n') line++; buf += src[p++]; }
        }
        toks.push({ k: 'str', v: bytes(buf), line: line }); i = p + 1; continue;
      }
      if (c === "'") {
        var close = src.indexOf("'", i + 1);
        var val = 0;
        var lit = bytes(src.slice(i + 1, close));
        for (var x = 0; x < lit.length; x++) val = val * 256 + lit.charCodeAt(x);
        toks.push({ k: 'num', v: val, line: line }); i = close + 1; continue;
      }
      if (c === '#') {
        var nm = /^#[A-Za-z_][A-Za-z0-9_.]*/.exec(src.slice(i, i + 200));
        if (nm) { toks.push({ k: 'nstr', v: nm[0].toLowerCase(), line: line }); i += nm[0].length; }
        else { toks.push({ k: 'tmpstr', line: line }); i++; }
        continue;
      }
      if (c === '$') {
        var rest = src.slice(i, i + 64), m;
        if ((m = /^\$x([0-9A-Fa-f]+)/.exec(rest))) { toks.push({ k: 'num', v: parseInt(m[1], 16), line: line }); i += m[0].length; continue; }
        if ((m = /^\$'(.)'/.exec(rest))) { toks.push({ k: 'num', v: m[1].charCodeAt(0), line: line }); i += m[0].length; continue; }
        if ((m = /^\$~(\d+)/.exec(rest))) { toks.push({ k: 'num', v: Math.pow(2, Number(m[1])) - 1, line: line }); i += m[0].length; continue; }
        if ((m = /^\$(pi|phi|e)\b/i.exec(rest))) { toks.push({ k: 'num', v: CONSTS[m[1].toLowerCase()], line: line }); i += m[0].length; continue; }
        throw new EelError('bad $ constant', line);
      }
      var hx = /^0[xX][0-9A-Fa-f]+/.exec(src.slice(i, i + 40));
      if (hx) { toks.push({ k: 'num', v: parseInt(hx[0], 16), line: line }); i += hx[0].length; continue; }
      var num = /^(\d+\.\d*|\.\d+|\d+)/.exec(src.slice(i, i + 64));
      if (num) { toks.push({ k: 'num', v: Number(num[0]), line: line }); i += num[0].length; continue; }
      var id = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(src.slice(i, i + 200));
      if (id) {
        var w = id[0].toLowerCase();
        toks.push({ k: (w === 'function' || w === 'local' || w === 'instance' || w === 'globals' || w === 'global' || w === 'static') ? 'kw' : 'id', v: w, line: line });
        i += id[0].length; continue;
      }
      var op = null;
      for (var o = 0; o < OPS.length; o++) if (src.substr(i, OPS[o].length) === OPS[o]) { op = OPS[o]; break; }
      if (!op) throw new EelError("unexpected '" + c + "'", line);
      toks.push({ k: 'op', v: op, line: line }); i += op.length;
    }
    toks.push({ k: 'eof', line: line });
    return toks;
  }

  // ------------------------------------------------------------ parser ----
  var ASSIGN = { '=': 1, '+=': 1, '-=': 1, '*=': 1, '/=': 1, '%=': 1, '^=': 1, '|=': 1, '&=': 1, '~=': 1, '<<=': 1, '>>=': 1 };
  var CMP = { '==': 1, '===': 1, '!=': 1, '!==': 1, '<': 1, '>': 1, '<=': 1, '>=': 1 };

  function parse(toks, funcs) {
    var p = 0;
    function peek() { return toks[p]; }
    function at(k, v) { var t = toks[p]; return t.k === k && (v === undefined || t.v === v); }
    function eat(k, v) { if (at(k, v)) return toks[p++]; return null; }
    function expect(k, v) {
      var t = eat(k, v);
      if (!t) { var q = toks[p]; throw new EelError('expected ' + (v || k) + ', got ' + (q.v !== undefined ? q.v : q.k), q.line); }
      return t;
    }

    function program() {
      var items = [];
      for (;;) {
        while (eat('op', ';')) {}
        if (at('eof')) break;
        if (at('kw', 'function')) { func(); continue; }
        items.push(assign());
        if (!at('op', ';') && !at('eof') && !at('kw', 'function')) {
          var t = peek();
          throw new EelError("missing ';' before " + (t.v !== undefined ? t.v : t.k), t.line);
        }
      }
      return { k: 'seq', items: items };
    }
    function func() {
      var line = expect('kw', 'function').line;
      var name = expect('id').v;
      expect('op', '(');
      var params = [];
      while (!at('op', ')')) { params.push(expect('id').v.replace(/\*$/, '')); eat('op', ','); }
      expect('op', ')');
      var locals = [], instance = [], globals = null;
      while (at('kw')) {
        var kw = toks[p++].v;
        expect('op', '(');
        var list = [];
        while (!at('op', ')')) {
          if (at('op', '*')) { p++; list.push('*'); }
          else list.push(expect('id').v.replace(/\*$/, ''));
          eat('op', ',');
        }
        expect('op', ')');
        if (kw === 'local' || kw === 'static') locals = locals.concat(list);
        else if (kw === 'instance') instance = instance.concat(list);
        else globals = (globals || []).concat(list);
      }
      expect('op', '(');
      var body = block();
      expect('op', ')');
      while (eat('op', ';')) {}
      funcs[name] = { name: name, params: params, locals: locals, instance: instance, globals: globals, body: body, line: line };
    }
    function block() {
      var items = [];
      for (;;) {
        while (eat('op', ';')) {}
        if (at('op', ')') || at('eof')) break;
        if (at('kw', 'function')) { func(); continue; }
        items.push(assign());
        if (!at('op', ';')) break;
      }
      while (eat('op', ';')) {}
      return items.length === 1 ? items[0] : { k: 'seq', items: items };
    }
    function arg() {
      var items = [assign()];
      while (at('op', ';')) {
        p++;
        if (at('op', ')') || at('op', ',')) break;
        items.push(assign());
      }
      return items.length === 1 ? items[0] : { k: 'seq', items: items };
    }
    function assign() {
      var lhs = ternary();
      var t = peek();
      if (t.k === 'op' && ASSIGN[t.v]) {
        p++;
        return { k: 'assign', op: t.v, lhs: lhs, rhs: assign(), line: t.line };
      }
      return lhs;
    }
    function ternary() {
      var c = logic();
      if (eat('op', '?')) {
        var a = at('op', ':') ? { k: 'num', v: 0 } : assign();
        var b = null;
        if (eat('op', ':')) b = assign();
        return { k: 'if', c: c, a: a, b: b };
      }
      return c;
    }
    function logic() {
      var n = cmp();
      while (at('op', '&&') || at('op', '||')) n = { k: 'logic', op: toks[p++].v, a: n, b: cmp() };
      return n;
    }
    function cmp() {
      var n = bit();
      while (peek().k === 'op' && CMP[peek().v]) n = { k: 'bin', op: toks[p++].v, a: n, b: bit() };
      return n;
    }
    function bit() {
      var n = add();
      while (at('op', '|') || at('op', '&') || at('op', '~')) n = { k: 'bin', op: toks[p++].v, a: n, b: add() };
      return n;
    }
    function add() {
      var n = mul();
      while (at('op', '+') || at('op', '-')) n = { k: 'bin', op: toks[p++].v, a: n, b: mul() };
      return n;
    }
    function mul() {
      var n = shift();
      while (at('op', '*') || at('op', '/')) n = { k: 'bin', op: toks[p++].v, a: n, b: shift() };
      return n;
    }
    function shift() {
      var n = mod();
      while (at('op', '<<') || at('op', '>>')) n = { k: 'bin', op: toks[p++].v, a: n, b: mod() };
      return n;
    }
    function mod() {
      var n = pow();
      while (at('op', '%')) { p++; n = { k: 'bin', op: '%', a: n, b: pow() }; }
      return n;
    }
    function pow() {
      var n = unary();
      if (at('op', '^')) { p++; return { k: 'bin', op: '^', a: n, b: pow() }; }
      return n;
    }
    function unary() {
      var t = peek();
      if (t.k === 'op' && (t.v === '!' || t.v === '-' || t.v === '+')) { p++; return { k: 'un', op: t.v, a: unary() }; }
      return postfix();
    }
    function postfix() {
      var n = primary();
      while (at('op', '[')) {
        p++;
        var idx = at('op', ']') ? { k: 'num', v: 0 } : assign();
        expect('op', ']');
        n = { k: 'index', base: n, idx: idx };
      }
      return n;
    }
    function primary() {
      var t = toks[p++];
      switch (t.k) {
        case 'num': return { k: 'num', v: t.v };
        case 'str': return { k: 'strlit', v: t.v };
        case 'nstr': return { k: 'nstr', v: t.v };
        case 'tmpstr': return { k: 'tmpstr', id: p };
        case 'op':
          if (t.v === '(') { var b = block(); expect('op', ')'); return b; }
          break;
        case 'id':
          if (at('op', '(')) {
            p++;
            var args = [];
            while (!at('op', ')')) { args.push(arg()); if (!eat('op', ',')) break; }
            expect('op', ')');
            if ((t.v === 'while' || t.v === 'loop') && at('op', '(')) {
              p++; var body = block(); expect('op', ')');
              args.push(body);
            }
            return { k: 'call', name: t.v, args: args, line: t.line };
          }
          return { k: 'var', name: t.v, line: t.line };
      }
      throw new EelError('unexpected ' + (t.v !== undefined ? t.v : t.k), t.line);
    }
    return program();
  }

  // ---------------------------------------------------------- compiler ----
  // Builtins that are plain maths: name -> JS expression template.
  var MATH = {
    sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan', asin: 'Math.asin', acos: 'Math.acos',
    atan: 'Math.atan', atan2: 'Math.atan2', sqrt: 'H.sqrt', exp: 'Math.exp', log: 'Math.log',
    log10: 'Math.log10', abs: 'Math.abs', floor: 'Math.floor', ceil: 'Math.ceil',
    min: 'Math.min', max: 'Math.max', pow: 'Math.pow', sign: 'H.sign', invsqrt: 'H.invsqrt',
    sqr: 'H.sqr', rand: 'H.rand', exp2: 'H.exp2'
  };

  function Compiler(slotsOf) {
    this.slots = slotsOf;          // name -> index into v
    this.funcs = {};
    this.compiledFuncs = {};
    this.funcCode = [];
    this.strConsts = [];
    this.temps = 0;
    this.gfx = false;              // compile gfx_* calls for a host to draw
  }
  Compiler.prototype.slot = function (name) {
    var s = this.slots[name];
    if (s === undefined) { s = this.slots.__count++; this.slots[name] = s; }
    return s;
  };

  Compiler.prototype.compileSection = function (code, firstLine) {
    var ast = parse(lex(code, firstLine), this.funcs);
    var saveTemps = this.temps;
    this.temps = 0;
    var body = this.stmts(ast, null, true, 'r');
    var temps = this.tempDecl();
    this.temps = saveTemps;
    return 'var r = 0;' + temps + body + 'return r;';
  };
  Compiler.prototype.tempDecl = function () {
    if (!this.temps) return '';
    var names = [];
    for (var i = 1; i <= this.temps; i++) names.push('t' + i);
    return 'var ' + names.join(', ') + ';';
  };
  Compiler.prototype.temp = function () { this.temps++; return 't' + this.temps; };

  // Names inside a function: parameters, statics, instance variables, or
  // globals. A function called as ns.f() keeps its instance() variables, and
  // anything it names as this.x, in ns: ns.x (REAPER's pseudo-objects).
  Compiler.prototype.ref = function (name, ctx) {
    if (ctx) {
      var pi = ctx.fn.params.indexOf(name);
      if (pi >= 0) return 'p' + pi;
      if (ctx.fn.locals.indexOf(name) >= 0) return 'v[' + this.slot(ctx.fn.name + '::' + name) + ']';
      if (ctx.fn.instance.indexOf(name) >= 0) return 'v[' + this.slot(ctx.ns ? ctx.ns + '.' + name : name) + ']';
    }
    if (name.indexOf('this.') === 0) return 'v[' + this.slot(resolveThis(name, ctx)) + ']';
    return 'v[' + this.slot(name) + ']';
  };
  // this.x, this.child.x: the namespace the function was called in.
  function resolveThis(name, ctx) {
    var ns = ctx && ctx.ns ? ctx.ns : '';
    if (name === 'this') return ns;
    return ns ? ns + '.' + name.slice(5) : name.slice(5);
  }

  function hasControl(n) {
    if (!n || typeof n !== 'object') return false;
    if (n.k === 'call' && (n.name === 'loop' || n.name === 'while')) return true;
    for (var key in n) {
      var c = n[key];
      if (Array.isArray(c)) { for (var i = 0; i < c.length; i++) if (hasControl(c[i])) return true; }
      else if (c && typeof c === 'object' && c.k && hasControl(c)) return true;
    }
    return false;
  }

  // Statements computing `n`; the value lands in `target` when wanted.
  Compiler.prototype.stmts = function (n, ctx, want, target) {
    if (n.k === 'seq') {
      var out = '';
      if (!n.items.length) return want ? target + ' = 0;' : '';
      for (var i = 0; i < n.items.length; i++) {
        var last = i === n.items.length - 1;
        out += this.stmts(n.items[i], ctx, want && last, target);
      }
      return out;
    }
    if (n.k === 'call' && n.name === 'loop') {
      var cnt = this.temp(), ii = this.temp();
      var s = cnt + ' = Math.min(' + MAXLOOP + ', Math.trunc(' + this.expr(n.args[0], ctx) + ')); ';
      if (want) s += target + ' = 0; ';
      s += 'for (' + ii + ' = 0; ' + ii + ' < ' + cnt + '; ' + ii + '++) {' + (n.args[1] ? this.stmts(n.args[1], ctx, want, target) : '') + '}';
      return s;
    }
    if (n.k === 'call' && n.name === 'while') {
      var guard = this.temp(), r = this.temp();
      if (n.args.length >= 2) {
        return guard + ' = 0; ' + (want ? target + ' = 0; ' : '') + 'while (Math.abs(' + this.expr(n.args[0], ctx) + ') >= ' + EPS + ' && ' + guard + '++ < ' + MAXLOOP + ') {' +
          this.stmts(n.args[1], ctx, want, target) + '}';
      }
      return guard + ' = 0; do {' + this.stmts(n.args[0], ctx, true, r) + (want ? target + ' = ' + r + ';' : '') +
        '} while (Math.abs(' + r + ') >= ' + EPS + ' && ++' + guard + ' < ' + MAXLOOP + ');';
    }
    if (n.k === 'if' && hasControl(n)) {
      var o = 'if (Math.abs(' + this.expr(n.c, ctx) + ') >= ' + EPS + ') {' + this.stmts(n.a, ctx, want, target) + '}';
      if (n.b) o += ' else {' + this.stmts(n.b, ctx, want, target) + '}';
      else if (want) o += ' else { ' + target + ' = 0; }';
      return o;
    }
    var e = this.expr(n, ctx);
    return (want ? target + ' = ' + e : e) + ';';
  };

  function T(e) { return '(Math.abs(' + e + ') >= ' + EPS + ')'; }

  Compiler.prototype.expr = function (n, ctx) {
    var self = this;
    // A loop inside an expression: the statements holding it run in a
    // closure. Only a loop, a sequence or a conditional is one; anything else
    // compiles its parts, each of which takes its own closure if it needs one.
    if (hasControl(n) && (n.k === 'seq' || n.k === 'if' || (n.k === 'call' && (n.name === 'loop' || n.name === 'while')))) {
      return '(() => { var rr = 0; ' + this.stmts(n, ctx, true, 'rr') + ' return rr; })()';
    }
    switch (n.k) {
      case 'raw': return n.code;
      case 'num': return n.v < 0 ? '(' + String(n.v) + ')' : String(n.v);
      case 'strlit': return String(this.strConst(n.v));
      case 'nstr': return 'S.named(' + JSON.stringify(n.v) + ')';
      case 'tmpstr': return 'S.tempStr(' + n.id + ')';
      case 'var': return this.varRead(n.name, ctx);
      case 'seq': {
        if (!n.items.length) return '0';
        return '(' + n.items.map(function (x) { return self.expr(x, ctx); }).join(', ') + ')';
      }
      case 'if':
        return '(' + T(this.expr(n.c, ctx)) + ' ? ' + this.expr(n.a, ctx) + ' : ' + (n.b ? this.expr(n.b, ctx) : '0') + ')';
      case 'logic': {
        var a = T(this.expr(n.a, ctx)), b = T(this.expr(n.b, ctx));
        return '((' + a + (n.op === '&&' ? ' && ' : ' || ') + b + ') ? 1 : 0)';
      }
      case 'un':
        if (n.op === '!') return '(' + T(this.expr(n.a, ctx)) + ' ? 0 : 1)';
        if (n.op === '-') return '(-' + this.expr(n.a, ctx) + ')';
        return this.expr(n.a, ctx);
      case 'bin': return this.binary(n.op, this.expr(n.a, ctx), this.expr(n.b, ctx));
      case 'index': return this.memRead(n, ctx);
      case 'assign': return this.assignment(n, ctx);
      case 'call': return this.call(n, ctx);
    }
    throw new EelError('cannot compile ' + n.k);
  };

  Compiler.prototype.binary = function (op, a, b) {
    switch (op) {
      case '+': return '(' + a + ' + ' + b + ')';
      case '-': return '(' + a + ' - ' + b + ')';
      case '*': return '(' + a + ' * ' + b + ')';
      case '/': return '(' + a + ' / ' + b + ')';
      case '%': return 'H.mod(' + a + ', ' + b + ')';
      case '^': return 'Math.pow(' + a + ', ' + b + ')';
      case '<<': return 'H.shl(' + a + ', ' + b + ')';
      case '>>': return 'H.shr(' + a + ', ' + b + ')';
      case '|': return 'H.bor(' + a + ', ' + b + ')';
      case '&': return 'H.band(' + a + ', ' + b + ')';
      case '~': return 'H.bxor(' + a + ', ' + b + ')';
      case '==': return '(Math.abs(' + a + ' - ' + b + ') < ' + EPS + ' ? 1 : 0)';
      case '!=': return '(Math.abs(' + a + ' - ' + b + ') < ' + EPS + ' ? 0 : 1)';
      case '===': return '(' + a + ' === ' + b + ' ? 1 : 0)';
      case '!==': return '(' + a + ' !== ' + b + ' ? 1 : 0)';
      case '<': case '>': case '<=': case '>=': return '(' + a + ' ' + op + ' ' + b + ' ? 1 : 0)';
    }
    throw new EelError('bad operator ' + op);
  };

  Compiler.prototype.strConst = function (s) {
    var i = this.strConsts.indexOf(s);
    if (i < 0) { i = this.strConsts.length; this.strConsts.push(s); }
    return 10000 + i;
  };

  Compiler.prototype.varRead = function (name, ctx) {
    if (name === 'gmem') return 'S.gmemBase';
    return this.ref(name, ctx);
  };

  Compiler.prototype.address = function (n, ctx) {
    if (n.base.k === 'var' && n.base.name === 'gmem') return { gmem: true, addr: this.expr(n.idx, ctx) };
    var base = this.expr(n.base, ctx);
    var idx = n.idx.k === 'num' && n.idx.v === 0 ? null : this.expr(n.idx, ctx);
    return { gmem: false, addr: idx === null ? base : '(' + base + ' + ' + idx + ')' };
  };
  Compiler.prototype.memRead = function (n, ctx) {
    var a = this.address(n, ctx);
    if (a.gmem) return 'S.grd(' + a.addr + ')';
    // Inline: a typed array read out of range is undefined, which || makes 0.
    return '(M[(' + a.addr + ' + ' + EPS + ') | 0] || 0)';
  };

  var COMPOUND = { '+=': '+', '-=': '-', '*=': '*', '/=': '/', '%=': '%', '^=': '^', '|=': '|', '&=': '&', '~=': '~', '<<=': '<<', '>>=': '>>' };

  Compiler.prototype.assignment = function (n, ctx) {
    var self = this;
    var lhs = n.lhs, rhs = this.expr(n.rhs, ctx);
    function value(cur) { return n.op === '=' ? rhs : self.binary(COMPOUND[n.op], cur, rhs); }
    if (lhs.k === 'var') {
      var r = this.ref(lhs.name, ctx);
      return '(' + r + ' = ' + value(r) + ')';
    }
    if (lhs.k === 'index') {
      var a = this.address(lhs, ctx), t = this.temp();
      var rdf = a.gmem ? 'S.grd' : 'rd', wrf = a.gmem ? 'S.gwr' : 'wr';
      return '(' + t + ' = ' + a.addr + ', ' + wrf + '(' + t + ', ' + value(rdf + '(' + t + ')') + '))';
    }
    if (lhs.k === 'if') {
      var tv = this.temp();
      var asg = function (side) { return side ? self.assignment({ k: 'assign', op: '=', lhs: side, rhs: { k: 'raw', code: tv } }, ctx) : '0'; };
      if (n.op !== '=') throw new EelError('compound assignment to a conditional is not supported');
      return '(' + tv + ' = ' + rhs + ', ' + T(this.expr(lhs.c, ctx)) + ' ? ' + asg(lhs.a) + ' : ' + asg(lhs.b) + ')';
    }
    if (lhs.k === 'nstr' || lhs.k === 'strlit') {
      return 'S.strcpy(' + this.expr(lhs, ctx) + ', ' + rhs + ')';
    }
    if (lhs.k === 'call' && lhs.name === 'slider') {
      var si = this.temp();
      return '(' + si + ' = ' + this.expr(lhs.args[0], ctx) + ', S.setSliderByIndex(' + si + ', ' + value('S.sliderByIndex(' + si + ')') + '))';
    }
    if (lhs.k === 'seq' && lhs.items.length) {
      var head = lhs.items.slice(0, -1).map(function (x) { return self.expr(x, ctx); });
      return '(' + head.concat([this.assignment({ k: 'assign', op: n.op, lhs: lhs.items[lhs.items.length - 1], rhs: n.rhs }, ctx)]).join(', ') + ')';
    }
    throw new EelError('cannot assign to ' + lhs.k);
  };

  // A variable passed by reference (midirecv, file_var): its JS lvalue.
  Compiler.prototype.lvalue = function (n, ctx) {
    if (n.k === 'var') return this.ref(n.name, ctx);
    return null;
  };

  Compiler.prototype.call = function (n, ctx) {
    var self = this, name = n.name, args = n.args;
    function A(i) { return args[i] === undefined ? '0' : self.expr(args[i], ctx); }
    function all() { return args.map(function (x) { return self.expr(x, ctx); }).join(', '); }
    if (MATH[name]) return MATH[name] + '(' + all() + ')';
    switch (name) {
      case 'midirecv': {
        var lv = args.map(function (x) { return self.lvalue(x, ctx); });
        var sets = [];
        for (var i = 0; i < lv.length; i++) {
          if (!lv[i]) continue;
          var src = lv.length >= 4 ? 'S.mr[' + i + ']' : (i === 2 ? '(S.mr[2] + S.mr[3] * 256)' : 'S.mr[' + i + ']');
          sets.push(lv[i] + ' = ' + src);
        }
        return '(S.midirecv() ? (' + (sets.length ? sets.join(', ') + ', ' : '') + 'S.mr[1]) : 0)';
      }
      case 'midisend':
        if (args.length >= 4) return 'S.midisend(' + A(0) + ', ' + A(1) + ', ' + A(2) + ', ' + A(3) + ')';
        return 'S.midisend3(' + A(0) + ', ' + A(1) + ', ' + A(2) + ')';
      case 'midisend_buf': return 'S.midisendBuf(' + A(0) + ', ' + A(1) + ', ' + A(2) + ')';
      case 'midisyx': return 'S.midisendBuf(' + A(0) + ', ' + A(1) + ', ' + A(2) + ')';
      case 'file_var': {
        var fv = this.lvalue(args[1], ctx);
        if (!fv) return 'S.fileVar(' + A(0) + ', ' + A(1) + ')';
        return '(' + fv + ' = S.fileVar(' + A(0) + ', ' + fv + '))';
      }
      case 'file_riff': {
        // channels and sample rate come back through the arguments
        var nc = this.lvalue(args[1], ctx), fr = this.lvalue(args[2], ctx);
        var t0 = this.temp();
        return '(' + t0 + ' = S.fileRiff(' + A(0) + ')' + (nc ? ', ' + nc + ' = S.riff[0]' : '') + (fr ? ', ' + fr + ' = S.riff[1]' : '') + ', ' + t0 + ')';
      }
      case 'slider': return 'S.sliderByIndex(' + A(0) + ')';
      case 'loop': case 'while':
        return '(() => { var rr = 0; ' + this.stmts(n, ctx, true, 'rr') + ' return rr; })()';
      case 'match': case 'matchi': {
        var refs = args.slice(2).map(function (x) { return self.lvalue(x, ctx); });
        var call = 'S.match(' + (name === 'matchi' ? 'true' : 'false') + ', ' + A(0) + ', ' + A(1) + ')';
        if (!refs.length) return call;
        var tm = this.temp();
        var assigns = refs.map(function (r, k) { return r ? r + ' = S.matchOut[' + k + ']' : ''; }).filter(Boolean);
        return '(' + tm + ' = ' + call + ', ' + tm + ' ? (' + (assigns.length ? assigns.join(', ') + ', ' : '') + '1) : 0)';
      }
    }
    if (this.funcs[name]) return this.userCall(this.funcs[name], args, ctx, '');
    if (name.indexOf('.') > 0) {
      var base = name.slice(name.lastIndexOf('.') + 1), prefix = name.slice(0, name.lastIndexOf('.'));
      if (this.funcs[base]) return this.userCall(this.funcs[base], args, ctx, prefix === 'this' || prefix.indexOf('this.') === 0 ? resolveThis(prefix, ctx) : prefix);
    }
    if (/^gfx_|^mouse_/.test(name)) {
      if (!this.gfx) return '(' + (args.length ? all() + ', ' : '') + '0)';
      // Width and height come back through the arguments, as file_riff's do.
      if (name === 'gfx_measurestr' || name === 'gfx_measurechar' || name === 'gfx_getimgdim') {
        var mw = this.lvalue(args[1] || { k: 'num', v: 0 }, ctx), mh = this.lvalue(args[2] || { k: 'num', v: 0 }, ctx);
        var tg = this.temp();
        return '(' + tg + ' = S.call(' + JSON.stringify(name) + ', ' + A(0) + ')' + (mw ? ', ' + mw + ' = S.gm[0]' : '') +
               (mh ? ', ' + mh + ' = S.gm[1]' : '') + ', ' + tg + ')';
      }
    }
    return 'S.call(' + JSON.stringify(name) + (args.length ? ', ' + all() : '') + ')';
  };

  // One compiled copy per function and namespace, as EEL2 does: a.f() and
  // b.f() are two functions, each with its own instance variables.
  Compiler.prototype.userCall = function (fn, args, ctx, ns) {
    var self = this;
    ns = ns || '';
    if (args.length !== fn.params.length && !(args.length === 1 && fn.params.length === 0)) {
      // EEL2 refuses the wrong number of arguments at compile time.
      throw new EelError(fn.name + '() takes ' + fn.params.length + ' arguments, given ' + args.length);
    }
    var jsName = 'F_' + fn.name.replace(/\./g, '_') + (ns ? '$' + ns.replace(/\./g, '$') : '');
    var key = fn.name + '@' + ns;
    if (!this.compiledFuncs[key]) {
      this.compiledFuncs[key] = true;
      var saved = this.temps;
      this.temps = 0;
      var body = this.stmts(fn.body, { fn: fn, ns: ns }, true, 'r');
      var temps = this.tempDecl();
      this.temps = saved;
      var params = fn.params.map(function (_, i) { return 'p' + i; });
      this.funcCode.push('function ' + jsName + '(' + params.join(', ') + ') { var r = 0;' + temps + body + ' return r; }');
    }
    return jsName + '(' + args.slice(0, fn.params.length).map(function (x) { return self.expr(x, ctx); }).join(', ') + ')';
  };

  // ----------------------------------------------------------- helpers ----
  function i64(x) { return Math.trunc(x); }
  function bigOp(a, b, f) { return Number(BigInt.asIntN(64, f(BigInt(i64(a)), BigInt(i64(b))))); }
  var H = {
    sqrt: function (x) { return Math.sqrt(Math.abs(x)); },
    sign: function (x) { return x > 0 ? 1 : (x < 0 ? -1 : 0); },
    invsqrt: function (x) { return 1 / Math.sqrt(x); },
    sqr: function (x) { return x * x; },
    exp2: function (x) { return Math.pow(2, x); },
    rand: function (x) { return Math.random() * (x === undefined ? 1 : x); },
    mod: function (a, b) {
      var ib = Math.trunc(Math.abs(b));
      return ib ? Math.trunc(Math.abs(a)) % ib : 0;
    },
    shl: function (a, b) { return bigOp(a, b, function (x, y) { return x << (y & 63n); }); },
    shr: function (a, b) { return bigOp(a, b, function (x, y) { return x >> (y & 63n); }); },
    bor: function (a, b) {
      if (Math.abs(a) < 2147483648 && Math.abs(b) < 2147483648) return (i64(a) | i64(b));
      return bigOp(a, b, function (x, y) { return x | y; });
    },
    band: function (a, b) {
      if (Math.abs(a) < 2147483648 && Math.abs(b) < 2147483648) return (i64(a) & i64(b));
      return bigOp(a, b, function (x, y) { return x & y; });
    },
    bxor: function (a, b) {
      if (Math.abs(a) < 2147483648 && Math.abs(b) < 2147483648) return (i64(a) ^ i64(b));
      return bigOp(a, b, function (x, y) { return x ^ y; });
    }
  };

  // C's %f: the double's exact decimal value, rounded half to even.
  var F64 = new Float64Array(1), U32 = new Uint32Array(F64.buffer);
  function toFixedC(x, f) {
    if (!isFinite(x)) return String(x);
    var neg = x < 0; F64[0] = Math.abs(x);
    var hi = U32[1], lo = U32[0], exp = (hi >>> 20) & 0x7ff;
    var mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
    if (exp === 0) exp = 1; else mant |= 1n << 52n;
    var e = exp - 1075, D, sc;
    if (e >= 0) { D = mant << BigInt(e); sc = 0; } else { D = mant * (5n ** BigInt(-e)); sc = -e; }
    var q;
    if (f >= sc) q = D * (10n ** BigInt(f - sc));
    else {
      var div = 10n ** BigInt(sc - f); q = D / div; var r2 = (D % div) * 2n;
      if (r2 > div || (r2 === div && (q & 1n) === 1n)) q += 1n;
    }
    var s = q.toString();
    if (f > 0) { while (s.length <= f) s = '0' + s; s = s.slice(0, s.length - f) + '.' + s.slice(s.length - f); }
    return (neg && /[1-9]/.test(s) ? '-' : (neg ? '-' : '')) + s;
  }

  // EEL2's sprintf, on doubles.
  function eelFormat(fmt, values) {
    var vi = 0;
    return fmt.replace(/%([-+ 0#]*)(\d*)(?:\.(\d+))?([dixXfgecs%])/g, function (all, flags, width, prec, conv) {
      if (conv === '%') return '%';
      var v = values[vi++], s;
      if (v === undefined) v = 0;
      switch (conv) {
        case 'd': case 'i': s = String(Math.trunc(v.num !== undefined ? v.num : v)); break;
        case 'x': s = (Math.trunc(v) >>> 0).toString(16); break;
        case 'X': s = (Math.trunc(v) >>> 0).toString(16).toUpperCase(); break;
        case 'f': s = toFixedC(Number(v), prec === undefined ? 6 : Number(prec)); break;
        case 'e': s = Number(v).toExponential(prec === undefined ? 6 : Number(prec)); break;
        case 'g': s = String(Number(Number(v).toPrecision(prec === undefined ? 6 : Math.max(1, Number(prec))))); break;
        case 'c': s = String.fromCharCode(Math.trunc(v)); break;
        case 's': s = v.str !== undefined ? v.str : String(v); break;
      }
      if (flags.indexOf('+') >= 0 && conv !== 's' && Number(v) >= 0) s = '+' + s;
      var w = Number(width || 0);
      while (s.length < w) s = flags.indexOf('-') >= 0 ? s + ' ' : (flags.indexOf('0') >= 0 && conv !== 's' ? '0' + s : ' ' + s);
      return s;
    });
  }

  // ---------------------------------------------------------- instance ----
  function JSFX(text, opts) {
    opts = opts || {};
    this.file = parseFile(text, opts.readImport);
    this.srate = opts.sampleRate || 48000;
    this.slots = { __count: 0 };
    var self = this;
    var C = new Compiler(this.slots);
    C.gfx = !!opts.gfx;
    // Predeclare what the host reads and writes.
    ['srate', 'samplesblock', 'tempo', 'play_state', 'play_position', 'beat_position', 'ts_num', 'ts_denom',
     'num_ch', 'trigger', 'pdc_delay', 'pdc_bot_ch', 'pdc_top_ch', 'pdc_midi', 'ext_noinit', 'ext_nodenorm',
     'ext_midi_bus', 'midi_bus', 'gfx_ext_retina'].forEach(function (n) { C.slot(n); });
    for (var c = 0; c < 64; c++) C.slot('spl' + c);
    for (var s = 1; s <= 64; s++) C.slot('slider' + s);
    this.file.sliders.forEach(function (sl) { C.slot(sl.variable); });
    if (C.gfx) ['gfx_r', 'gfx_g', 'gfx_b', 'gfx_a', 'gfx_a2', 'gfx_x', 'gfx_y', 'gfx_w', 'gfx_h', 'gfx_texth', 'gfx_mode', 'gfx_clear',
                'gfx_dest', 'gfx_ext_flags', 'mouse_x', 'mouse_y', 'mouse_cap', 'mouse_wheel', 'mouse_hwheel'].forEach(function (n) { C.slot(n); });

    var sections = {};
    ['init', 'slider', 'block', 'sample', 'serialize'].concat(C.gfx ? ['gfx'] : []).forEach(function (name) {
      var parts = self.file.sections[name];
      if (!parts.length) return;
      sections[name] = parts.map(function (part) { return C.compileSection(part.code, part.line); });
    });
    // @gfx is parsed for its functions only, so @init code that calls a
    // helper defined there still compiles.
    if (!C.gfx) this.file.sections.gfx.forEach(function (part) {
      try { parse(lex(part.code, part.line), C.funcs); } catch (e) { /* the window is not run */ }
    });

    // Room for names a later eval() adds: the generated code holds on to v.
    this.v = new Float64Array(this.slots.__count + 4096);
    this.strConsts = C.strConsts;
    var src = [];
    src.push('"use strict";');
    // Memory is one Float64Array that doubles when written past its end, up
    // to EEL2's 8M words; rd and wr sit beside it so V8 can inline them.
    src.push('var v = S.v, M = new Float64Array(' + BLOCK + ');');
    src.push('function rd(a) { var i = (a + ' + EPS + ') | 0; return (i >= 0 && i < M.length) ? M[i] : 0; }');
    src.push('function wr(a, x) { var i = (a + ' + EPS + ') | 0; if (i >= 0 && i < M.length) { M[i] = x; return x; } return grow(i, x); }');
    src.push('function grow(i, x) { if (i < 0 || i >= ' + (BLOCK * NBLOCKS) + ') return x; var n = M.length; while (n <= i) n *= 2;' +
             ' var N = new Float64Array(Math.min(n, ' + (BLOCK * NBLOCKS) + ')); N.set(M); M = N; M[i] = x; return x; }');
    src.push('S.rd = rd; S.wr = wr; S.clearMem = function () { M = new Float64Array(' + BLOCK + '); };');
    // Code compiled later (eval) runs in this scope, beside M, v and the helpers.
    src.push('S.evalIn = function (code) { return eval(code); };');
    src.push(C.funcCode.join('\n'));
    Object.keys(sections).forEach(function (name) {
      src.push('S.sec_' + name + ' = [' + sections[name].map(function (b) { return 'function () {' + b + '}'; }).join(',\n') + '];');
    });
    this.code = src.join('\n');
    this.reset();
    new Function('S', 'H', this.code)(this, H);
  }

  JSFX.prototype.reset = function () {
    this.v.fill(0);
    this.mem = new Array(NBLOCKS);
    this.gmem = NS.sharedGmem || (NS.sharedGmem = {});
    this.gmemName = (/gmem=(\S+)/.exec(this.file.options) || [])[1] || '';
    this.strings = {};
    this.namedIds = {};
    this.nextNamed = 90000;
    this.midiIn = []; this.midiInPos = 0; this.midiOut = [];
    this.mr = [0, 0, 0, 0];
    this.matchOut = [];
    this.serial = null;
    this.blockCount = 0;
    this.sliderDirty = true;
    this.sampleFrame = 0;
    var self = this;
    if (this.clearMem) this.clearMem();
    this.file.sliders.forEach(function (sl) { self.v[self.slots[sl.variable]] = sl.def; });
  };

  JSFX.prototype.slot = function (name) { return this.slots[name.toLowerCase()]; };
  JSFX.prototype.getVar = function (name) { var s = this.slot(name); return s === undefined ? 0 : this.v[s]; };
  JSFX.prototype.setVar = function (name, val) { var s = this.slot(name); if (s !== undefined) this.v[s] = val; };

  JSFX.prototype.sliderVar = function (n) {
    for (var i = 0; i < this.file.sliders.length; i++) if (this.file.sliders[i].index === n) return this.file.sliders[i].variable;
    return 'slider' + n;
  };
  JSFX.prototype.sliderByIndex = function (n) { return this.v[this.slots[this.sliderVar(Math.trunc(n))]] || 0; };
  JSFX.prototype.setSliderByIndex = function (n, val) { this.v[this.slots[this.sliderVar(Math.trunc(n))]] = val; return val; };
  JSFX.prototype.getSlider = function (n) { return this.sliderByIndex(n); };
  JSFX.prototype.setSlider = function (n, val) {
    this.setSliderByIndex(n, val);
    this.sliderDirty = true;
  };

  JSFX.prototype.runSection = function (name) {
    var list = this['sec_' + name];
    if (!list) return 0;
    var r = 0;
    for (var i = 0; i < list.length; i++) r = list[i]();
    return r;
  };

  JSFX.prototype.setTime = function (t) {
    var v = this.v, s = this.slots;
    if (t.tempo !== undefined) v[s.tempo] = t.tempo;
    if (t.playState !== undefined) v[s.play_state] = t.playState;
    if (t.beat !== undefined) v[s.beat_position] = t.beat;
    if (t.seconds !== undefined) v[s.play_position] = t.seconds;
    if (t.num !== undefined) v[s.ts_num] = t.num;
    if (t.den !== undefined) v[s.ts_denom] = t.den;
  };

  JSFX.prototype.init = function (sampleRate) {
    if (sampleRate) this.srate = sampleRate;
    var keep = this.file.sliders.map(function (sl) { return this.v[this.slots[sl.variable]]; }, this);
    this.reset();
    this.file.sliders.forEach(function (sl, i) { this.v[this.slots[sl.variable]] = keep[i]; }, this);
    var v = this.v, s = this.slots;
    v[s.srate] = this.srate;
    v[s.num_ch] = Math.max(this.file.inPins.length, this.file.outPins.length);
    v[s.tempo] = v[s.tempo] || 120; v[s.ts_num] = v[s.ts_num] || 4; v[s.ts_denom] = v[s.ts_denom] || 4;
    this.runSection('init');
    this.runSection('slider');
    this.sliderDirty = false;
    this.initialised = true;
  };

  /* One block: `inputs`/`outputs` are arrays of Float32Array per channel (or
   * null for a MIDI-only device), `midi` is [{offset, data:[b1,b2,b3]}]
   * sorted by offset. Returns the MIDI sent, with offsets. */
  JSFX.prototype.process = function (n, inputs, outputs, midi) {
    if (!this.initialised) this.init();
    var v = this.v, s = this.slots;
    if (this.sliderDirty) { this.sliderDirty = false; this.runSection('slider'); }
    v[s.samplesblock] = n;
    this.midiIn = midi || [];
    this.midiInPos = 0;
    this.midiOut = [];
    this.runSection('block');
    var sec = this.sec_sample;
    if (sec && sec.length) {
      var nIn = inputs ? inputs.length : 0, nOut = outputs ? outputs.length : 0;
      var nch = Math.max(nIn, nOut, 2);
      var spl = [];
      for (var c = 0; c < nch; c++) spl.push(s['spl' + c]);
      for (var i = 0; i < n; i++) {
        this.sampleFrame = i;
        for (var ci = 0; ci < nch; ci++) v[spl[ci]] = ci < nIn && inputs[ci] ? inputs[ci][i] : 0;
        for (var k = 0; k < sec.length; k++) sec[k]();
        for (var co = 0; co < nOut; co++) if (outputs[co]) outputs[co][i] = v[spl[co]];
      }
    } else if (outputs && inputs) {
      for (var ch = 0; ch < outputs.length; ch++) if (outputs[ch] && inputs[ch]) outputs[ch].set(inputs[ch]);
    }
    // MIDI a plug-in did not read passes through, as in REAPER.
    for (var r = this.midiInPos; r < this.midiIn.length; r++) this.midiOut.push(this.midiIn[r]);
    this.blockCount++;
    var out = this.midiOut;
    out.sort(function (a, b) { return a.offset - b.offset; });
    return out;
  };

  // ------------------------------------------------------- the host API --
  JSFX.prototype.midirecv = function () {
    if (this.midiInPos >= this.midiIn.length) return 0;
    var ev = this.midiIn[this.midiInPos++];
    this.mr[0] = ev.offset; this.mr[1] = ev.data[0]; this.mr[2] = ev.data[1] || 0; this.mr[3] = ev.data[2] || 0;
    return 1;
  };
  JSFX.prototype.midisend = function (offset, b1, b2, b3) {
    this.midiOut.push({ offset: Math.max(0, Math.trunc(offset)), data: [Math.trunc(b1) & 255, Math.trunc(b2) & 127, Math.trunc(b3) & 127] });
    return b1;
  };
  JSFX.prototype.midisend3 = function (offset, b1, b23) {
    b23 = Math.trunc(b23);
    return this.midisend(offset, b1, b23 & 255, (b23 >> 8) & 255);
  };
  JSFX.prototype.midisendBuf = function (offset, buf, len) {
    var data = [];
    for (var i = 0; i < len; i++) data.push(Math.trunc(this.rd(buf + i)) & 255);
    this.midiOut.push({ offset: Math.max(0, Math.trunc(offset)), data: data });
    return len;
  };

  JSFX.prototype.grd = function (a) { var g = this.gmem[this.gmemName]; if (!g) return 0; var i = (a + EPS) | 0; return g[i] || 0; };
  JSFX.prototype.gwr = function (a, val) {
    var g = this.gmem[this.gmemName] || (this.gmem[this.gmemName] = {});
    g[(a + EPS) | 0] = val; return val;
  };

  // Strings: literals are 10000+, named strings 90000+, slots 0-1023 free.
  JSFX.prototype.str = function (id) {
    id = Math.trunc(id);
    if (id >= 10000 && id < 90000) return this.strConsts[id - 10000] || '';
    return this.strings[id] || '';
  };
  JSFX.prototype.setStr = function (id, s) { this.strings[Math.trunc(id)] = s; return id; };
  JSFX.prototype.named = function (name) {
    var id = this.namedIds[name];
    if (id === undefined) { id = this.namedIds[name] = this.nextNamed++; this.strings[id] = ''; }
    return id;
  };
  JSFX.prototype.tempStr = function (site) { var id = 200000 + site; if (this.strings[id] === undefined) this.strings[id] = ''; return id; };
  JSFX.prototype.strcpy = function (d, s) { return this.setStr(d, this.str(s)); };
  JSFX.prototype.match = function (ci, pat, sid) {
    var p = this.str(pat), s = this.str(sid);
    var re = '^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
    return new RegExp(re, ci ? 'i' : '').test(s) ? 1 : 0;
  };

  JSFX.prototype.riff = [0, 0];
  JSFX.prototype.fileRiff = function (h) {
    var f = this.files && this.files[Math.trunc(h)];
    this.riff = f ? [f.channels, f.rate] : [0, 0];
    return f ? 1 : 0;
  };
  // One frame of @gfx, drawn by `host`: an object with a method per gfx_*
  // function (each called with the JSFX first), as the Ableton devices give.
  // `w`, `h` and `mouse` ({x, y, cap, wheel, hwheel}) are what REAPER sets.
  JSFX.prototype.runGfx = function (host, w, h, mouse) {
    if (!this.sec_gfx) return 0;
    if (!this.initialised) this.init();
    var v = this.v, s = this.slots;
    this.gfxHost = host;
    v[s.gfx_w] = w; v[s.gfx_h] = h;
    if (mouse) {
      v[s.mouse_x] = mouse.x; v[s.mouse_y] = mouse.y; v[s.mouse_cap] = mouse.cap;
      if (mouse.wheel) v[s.mouse_wheel] += mouse.wheel;
      if (mouse.hwheel) v[s.mouse_hwheel] += mouse.hwheel;
    }
    return this.runSection('gfx');
  };
  JSFX.prototype.gm = [0, 0];

  JSFX.prototype.call = function (name) {
    var a = Array.prototype.slice.call(arguments, 1);
    if (this.gfxHost && this.gfxHost[name]) return +this.gfxHost[name].apply(this.gfxHost, [this].concat(a)) || 0;
    var f = BUILTINS[name];
    if (!f) {
      if (!this.warned) this.warned = {};
      if (!this.warned[name] && typeof console !== 'undefined') { this.warned[name] = true; console.warn('JSFX: no ' + name + '()'); }
      return 0;
    }
    return f.apply(this, a);
  };

  // @serialize: values written in order, read back in order.
  JSFX.prototype.fileVar = function (h, cur) {
    h = Math.trunc(h);
    if (h === 0 && this.serial) {
      if (this.serial.mode === 'write') { this.serial.data.push(cur); return cur; }
      var d = this.serial.data[this.serial.pos++];
      return d === undefined ? cur : (typeof d === 'number' ? d : cur);
    }
    var f = this.files && this.files[h];
    if (f && f.pos < f.values.length) return f.values[f.pos++];
    return cur;
  };
  JSFX.prototype.serialize = function () {
    this.serial = { mode: 'write', data: [], pos: 0 };
    this.runSection('serialize');
    var data = this.serial.data;
    this.serial = null;
    return { sliders: this.file.sliders.map(function (sl) { return this.v[this.slots[sl.variable]]; }, this), data: data };
  };
  JSFX.prototype.deserialize = function (state) {
    if (!state) return;
    if (!this.initialised) this.init();
    if (state.sliders) this.file.sliders.forEach(function (sl, i) {
      if (state.sliders[i] !== undefined) this.v[this.slots[sl.variable]] = state.sliders[i];
    }, this);
    this.serial = { mode: 'read', data: state.data || [], pos: 0 };
    this.runSection('serialize');
    this.serial = null;
    this.sliderDirty = true;
  };

  // Run a line of EEL2 against this instance: how a device's own buttons
  // (Panic, Transfer to Pads...) are pressed from Middaw's controls.
  JSFX.prototype.eval = function (code) {
    var C = new Compiler(this.slots);
    C.gfx = !!opts.gfx;
    C.strConsts = this.strConsts;
    // reuse the instance's functions by recompiling them into this snippet
    var funcs = {};
    var self = this;
    ['init', 'slider', 'block', 'sample', 'serialize', 'gfx'].forEach(function (name) {
      self.file.sections[name].forEach(function (part) { try { parse(lex(part.code, part.line), funcs); } catch (e) {} });
    });
    C.funcs = funcs;
    var body = C.compileSection(code, 1);
    var fn = this.evalIn('(function () {' + C.funcCode.join('\n') + ' return function () {' + body + '}; })()');
    if (this.slots.__count > this.v.length) throw new EelError('too many new variables in eval');
    return fn();
  };

  var BUILTINS = {
    memset: function (d, val, n) { for (var i = 0; i < n; i++) this.wr(d + i, val); return d; },
    memcpy: function (d, s, n) {
      var tmp = [];
      for (var i = 0; i < n; i++) tmp.push(this.rd(s + i));
      for (var j = 0; j < n; j++) this.wr(d + j, tmp[j]);
      return d;
    },
    freembuf: function (n) { return n; },
    mem_set_values: function () { return 0; },
    time: function () { return Math.floor(Date.now() / 1000); },
    time_precise: function () { return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000; },
    sliderchange: function () { if (this.onSliderChange) this.onSliderChange(); return 0; },
    slider_automate: function () { if (this.onSliderChange) this.onSliderChange(); return 0; },
    slider_show: function () { return 0; },
    strlen: function (s) { return this.str(s).length; },
    strcpy: function (d, s) { return this.setStr(d, this.str(s)); },
    strcat: function (d, s) { return this.setStr(d, this.str(d) + this.str(s)); },
    strcmp: function (a, b) { var x = this.str(a), y = this.str(b); return x < y ? -1 : x > y ? 1 : 0; },
    stricmp: function (a, b) { var x = this.str(a).toLowerCase(), y = this.str(b).toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; },
    strncpy: function (d, s, n) { return this.setStr(d, this.str(s).slice(0, n)); },
    strcpy_substr: function (d, s, off, len) {
      var str = this.str(s);
      if (off < 0) off = Math.max(0, str.length + off);
      return this.setStr(d, len === undefined ? str.slice(off) : str.substr(off, Math.max(0, len)));
    },
    str_getchar: function (s, i) { var str = this.str(s); if (i < 0) i += str.length; return i >= 0 && i < str.length ? str.charCodeAt(i) : 0; },
    str_setchar: function (s, i, c) {
      var str = this.str(s); if (i < 0) i += str.length;
      if (i >= 0 && i <= str.length) this.setStr(s, str.slice(0, i) + String.fromCharCode(c) + str.slice(i + 1));
      return c;
    },
    sprintf: function (d, fmt) {
      var self = this, vals = Array.prototype.slice.call(arguments, 2);
      var f = this.str(fmt);
      // %s takes a string handle
      var vi = 0;
      var mapped = [];
      f.replace(/%[-+ 0#]*\d*(?:\.\d+)?([dixXfgecs%])/g, function (all, conv) {
        if (conv === '%') return all;
        var x = vals[vi++];
        mapped.push(conv === 's' ? { str: self.str(x) } : x);
        return all;
      });
      return this.setStr(d, eelFormat(f, mapped));
    },
    file_open: function (s) {
      var name = this.str(s);
      var vals = this.openFile ? this.openFile(name) : null;
      if (!vals) return -1;
      if (!this.files) { this.files = {}; this.nextFile = 1; }
      var h = this.nextFile++;
      this.files[h] = { values: vals.samples || vals, pos: 0, channels: vals.channels || 1, rate: vals.rate || this.srate };
      return h;
    },
    file_close: function (h) { if (this.files) delete this.files[h]; return 0; },
    file_rewind: function (h) { if (this.files && this.files[h]) this.files[h].pos = 0; return 0; },
    file_avail: function (h) {
      h = Math.trunc(h);
      if (h === 0 && this.serial) return this.serial.mode === 'write' ? -1 : this.serial.data.length - this.serial.pos;
      var f = this.files && this.files[h];
      return f ? f.values.length - f.pos : 0;
    },
    file_riff: function () { return 0; },
    file_text: function () { return 0; },
    file_mem: function (h, addr, n) {
      h = Math.trunc(h);
      if (h === 0 && this.serial) {
        if (this.serial.mode === 'write') { for (var i = 0; i < n; i++) this.serial.data.push(this.rd(addr + i)); }
        else { for (var j = 0; j < n; j++) { var d = this.serial.data[this.serial.pos++]; this.wr(addr + j, typeof d === 'number' ? d : 0); } }
        return n;
      }
      var f = this.files && this.files[h];
      if (!f) return 0;
      var k = 0;
      for (; k < n && f.pos < f.values.length; k++) this.wr(addr + k, f.values[f.pos++]);
      return k;
    },
    file_string: function (h, s) {
      h = Math.trunc(h);
      if (h === 0 && this.serial) {
        if (this.serial.mode === 'write') this.serial.data.push({ s: this.str(s) });
        else { var d = this.serial.data[this.serial.pos++]; if (d && d.s !== undefined) this.setStr(s, d.s); }
      }
      return 1;
    },
    export_buffer_to_project: function () { return this.exportBuffer ? this.exportBuffer.apply(this, arguments) : 0; },
    get_host_placement: function () { return 0; },
    get_host_numchan: function () { return 2; },
    set_host_numchan: function () { return 0; },
    get_pin_mapping: function () { return 0; },
    set_pdc: function () { return 0; },
    printf: function () { return 0; },
    gfx_getchar: function () { return 0; }
  };

  NS.JSFX = JSFX;
  NS.parseFile = parseFile;
  NS.parseSliderLine = parseSliderLine;
  NS.lexEel = lex;
  NS.parseEel = parse;
  NS.EelError = EelError;
})(typeof module === 'object' && module.exports
  ? (module.exports = (globalThis.MiddawJSFX = globalThis.MiddawJSFX || {}))
  : (globalThis.MiddawJSFX = globalThis.MiddawJSFX || {}));


/* ---- kit/gfx.js ---- */
/* REAPER's gfx_* drawing, on Max's mgraphics: the host a JSFX's @gfx runs on
 * (MiddawJSFX's runGfx). Each method takes the JSFX first, reads gfx_r, gfx_x
 * and the rest from its variables, and draws as REAPER would: text from its
 * top-left, gfx_x moved on past it, angles from twelve o'clock clockwise.
 *
 * gfx_showmenu cannot wait for a choice inside a frame, so it asks for one:
 * `menu` is set, the frame returns 0, and the device draws the menu. When an
 * item is chosen the device puts the variables back as they were at the start
 * of that frame and runs it again, and this time gfx_showmenu returns the item.
 */
var Gfx = (function () {
  'use strict';
  function Host(g) {
    this.g = g;
    this.fonts = { 0: { name: 'Arial', size: 13, flags: 0 } };
    this.font = 0;
    this.menu = null;        // { text, x, y } asked for this frame
    this.choice = 0;         // the item to give gfx_showmenu on the replayed frame
    this.slots = null;
  }
  Host.prototype.begin = function (g, fx) {
    this.g = g;
    if (!this.slots || this.fx !== fx) {
      this.fx = fx;
      var s = fx.slots;
      this.slots = { r: s.gfx_r, g: s.gfx_g, b: s.gfx_b, a: s.gfx_a, x: s.gfx_x, y: s.gfx_y, texth: s.gfx_texth,
                     mx: s.mouse_x, my: s.mouse_y, clear: s.gfx_clear };
    }
    this.menu = null;
    this.applyFont();
  };
  Host.prototype.v = function (k) { return this.fx.v[this.slots[k]]; };
  Host.prototype.set = function (k, x) { this.fx.v[this.slots[k]] = x; };
  Host.prototype.colour = function () {
    this.g.set_source_rgba(clamp(this.v('r')), clamp(this.v('g')), clamp(this.v('b')), clamp(this.v('a')));
  };
  // EEL2 strings are bytes; REAPER draws them as UTF-8.
  function utf8(s) { try { return decodeURIComponent(escape(s)); } catch (e) { return s; } }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : (x || 0); }
  function num(x, d) { return x === undefined || x !== x ? d : x; }

  // ------------------------------------------------------------ colour ---
  Host.prototype.gfx_set = function (fx, r, g, b, a) {
    r = num(r, 0);
    this.set('r', r); this.set('g', num(g, r)); this.set('b', num(b, r)); this.set('a', num(a, 1));
    return 0;
  };

  // ------------------------------------------------------------ shapes ---
  Host.prototype.gfx_rect = function (fx, x, y, w, h, filled) {
    if (!(w > 0 && h > 0)) return 0;
    this.colour();
    if (num(filled, 1)) { this.g.rectangle(x, y, w, h); this.g.fill(); }
    else { this.g.set_line_width(1); this.g.rectangle(x + 0.5, y + 0.5, w - 1, h - 1); this.g.stroke(); }
    return 0;
  };
  Host.prototype.gfx_line = function (fx, x1, y1, x2, y2) {
    this.colour();
    this.g.set_line_width(1);
    this.g.move_to(x1 + 0.5, y1 + 0.5); this.g.line_to(x2 + 0.5, y2 + 0.5); this.g.stroke();
    return 0;
  };
  Host.prototype.gfx_lineto = function (fx, x, y) {
    this.gfx_line(fx, this.v('x'), this.v('y'), x, y);
    this.set('x', x); this.set('y', y);
    return 0;
  };
  Host.prototype.gfx_circle = function (fx, x, y, r, fill) {
    this.colour();
    this.g.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
    if (num(fill, 0)) this.g.fill(); else { this.g.set_line_width(1); this.g.stroke(); }
    return 0;
  };
  Host.prototype.gfx_arc = function (fx, x, y, r, a1, a2) {
    this.colour();
    this.g.set_line_width(1);
    this.g.arc(x, y, Math.max(0, r), a1 - Math.PI / 2, a2 - Math.PI / 2);
    this.g.stroke();
    return 0;
  };
  Host.prototype.gfx_roundrect = function (fx, x, y, w, h, radius) {
    this.colour();
    this.g.set_line_width(1);
    this.g.rectangle_rounded(x + 0.5, y + 0.5, w, h, radius * 2, radius * 2);
    this.g.stroke();
    return 0;
  };
  Host.prototype.gfx_triangle = function (fx) {
    var p = Array.prototype.slice.call(arguments, 1);
    if (p.length < 6) return 0;
    this.colour();
    this.g.move_to(p[0], p[1]);
    for (var i = 2; i + 1 < p.length; i += 2) this.g.line_to(p[i], p[i + 1]);
    this.g.close_path();
    this.g.fill();
    return 0;
  };
  Host.prototype.gfx_gradrect = function (fx, x, y, w, h, r, g, b, a) {
    this.g.set_source_rgba(clamp(r), clamp(g), clamp(b), clamp(num(a, 1)));
    this.g.rectangle(x, y, w, h); this.g.fill();
    return 0;
  };

  // -------------------------------------------------------------- text ---
  // gfx_setfont(idx, name, size, flags): flags is a character code, 'b' bold, 'i' italic.
  Host.prototype.gfx_setfont = function (fx, idx, name, size, flags) {
    idx = Math.trunc(num(idx, 0));
    if (name !== undefined && idx > 0) {
      this.fonts[idx] = { name: fx.str(name) || 'Arial', size: num(size, 13), flags: Math.trunc(num(flags, 0)) };
    }
    this.font = this.fonts[idx] ? idx : 0;
    this.applyFont();
    return 1;
  };
  Host.prototype.gfx_getfont = function () { return this.font; };
  Host.prototype.applyFont = function () {
    var f = this.fonts[this.font] || this.fonts[0], fl = f.flags;
    // REAPER's names for the system face are not names Max can ask for
    var face = /^\./.test(f.name) || /^segoe/i.test(f.name) ? 'Arial' : f.name;
    var bold = fl === 98 || ((fl >> 8) & 255) === 98 || ((fl >> 16) & 255) === 98;
    var italic = fl === 105 || ((fl >> 8) & 255) === 105 || ((fl >> 16) & 255) === 105;
    this.g.select_font_face(face, italic ? 'italic' : 'normal', bold ? 'bold' : 'normal');
    this.g.set_font_size(f.size);
    this.size = f.size;
    if (this.slots) this.set('texth', Math.round(f.size));
  };
  Host.prototype.measure = function (s) {
    var m = this.g.text_measure(s);
    return [m[0], Math.max(m[1], this.size)];
  };
  Host.prototype.gfx_measurestr = function (fx, s) { this.fx.gm = this.measure(utf8(fx.str(s))); return this.fx.gm[0]; };
  Host.prototype.gfx_measurechar = function (fx, c) { this.fx.gm = this.measure(String.fromCharCode(c)); return this.fx.gm[0]; };
  Host.prototype.text = function (s, flags, right, bottom) {
    var x = this.v('x'), y = this.v('y'), m = this.measure(s);
    flags = Math.trunc(num(flags, 0));
    if (right !== undefined && !(flags & 256)) {
      if (flags & 1) x = x + (right - x - m[0]) / 2; else if (flags & 2) x = right - m[0];
      if (flags & 4) y = y + (bottom - y - m[1]) / 2; else if (flags & 8) y = bottom - m[1];
    }
    this.colour();
    this.g.move_to(x, y + this.size * 0.8);
    this.g.show_text(s);
    this.set('x', x + m[0]);
    return 0;
  };
  Host.prototype.gfx_drawstr = function (fx, s, flags, right, bottom) { return this.text(utf8(fx.str(s)), flags, right, bottom); };
  Host.prototype.gfx_drawchar = function (fx, c) { return this.text(String.fromCharCode(c)); };
  Host.prototype.gfx_drawnumber = function (fx, n, digits) { return this.text(Number(n).toFixed(Math.max(0, Math.trunc(num(digits, 0))))); };
  Host.prototype.gfx_printf = function (fx, fmt) {
    var args = Array.prototype.slice.call(arguments, 2);
    var s = fx.str(fmt).replace(/%(-?\d*)(?:\.(\d+))?([dfsxXc%])/g, function (m, w, p, k) {
      if (k === '%') return '%';
      var a = args.shift();
      if (k === 's') return fx.str(a);
      if (k === 'c') return String.fromCharCode(a);
      if (k === 'x' || k === 'X') { var h = Math.trunc(a).toString(16); return k === 'X' ? h.toUpperCase() : h; }
      return k === 'd' ? String(Math.trunc(a)) : Number(a).toFixed(p === undefined ? 6 : +p);
    });
    return this.text(utf8(s));
  };

  // ------------------------------------------------------------- input ---
  // gfx_getchar(65536) asks about the window: 1 it has focus, 2 it is shown,
  // 4 the mouse is in it. With no argument it is the next key typed, which the
  // window's [key] hands in (Host.key); with a key it asks whether it is held.
  Host.prototype.gfx_getchar = function (fx, c) {
    if (c === 65536) return 1 | 2 | (this.mouseIn ? 4 : 0);
    if (c) return 0;
    return this.keys && this.keys.length ? this.keys.shift() : 0;
  };
  // Max's key codes as REAPER's gfx_getchar gives them: the arrows and the
  // editing keys are four-letter codes there.
  var KEYS = { 28: 0x6C656674, 29: 0x72676874, 30: 0x7570, 31: 0x646F776E, 127: 0x64656C, 8: 8, 9: 9, 13: 13, 27: 27,
               '-9': 0x6C656674, '-10': 0x72676874, '-11': 0x7570, '-12': 0x646F776E };
  Host.prototype.key = function (code) {
    (this.keys = this.keys || []).push(KEYS[code] !== undefined ? KEYS[code] : code);
    if (this.keys.length > 32) this.keys.shift();
  };
  Host.prototype.gfx_showmenu = function (fx, s) {
    if (this.choice) { var k = this.choice; this.choice = 0; return k; }
    this.menu = { text: utf8(fx.str(s)), x: this.v('x'), y: this.v('y') };
    return 0;
  };
  Host.prototype.gfx_setcursor = function () { return 0; };
  Host.prototype.gfx_getdropfile = function () { return 0; };
  Host.prototype.gfx_update = function () { return 0; };

  // A menu as gfx_showmenu writes it: items split by |, '#' greyed, '!'
  // ticked, '>' opens a submenu, '<' closes one. Numbered as REAPER numbers
  // them: every item that is not a submenu's title, in order, from 1.
  function parseMenu(text) {
    var out = [], depth = 0, n = 0;
    String(text).split('|').forEach(function (raw) {
      var t = raw, grey = false, tick = false, opens = false, closes = false;
      for (;;) {
        var c = t.charAt(0);
        if (c === '#') { grey = true; t = t.slice(1); } else if (c === '!') { tick = true; t = t.slice(1); }
        else if (c === '>') { opens = true; t = t.slice(1); } else if (c === '<') { closes = true; t = t.slice(1); } else break;
      }
      if (opens) { out.push({ label: t, title: true, depth: depth }); depth++; return; }
      if (t === '' && !closes) { out.push({ rule: true, depth: depth }); return; }
      n++;
      out.push({ label: t, index: n, grey: grey, tick: tick, depth: depth });
      if (closes) depth = Math.max(0, depth - 1);
    });
    return out;
  }

  return { Host: Host, parseMenu: parseMenu };
})();


/* ---- kit/live.js ---- */
/* The Live set, as the family's devices need it: the song's tempo, meter and
 * scale, the notes of the clip being edited, somewhere to put new notes, and
 * a way to hear notes before they are used.
 *
 * Everything goes through the Live Object Model (LiveAPI). Times are beats,
 * which in Live are quarter notes - the unit every family engine already
 * speaks - so nothing is converted but the field names.
 */
var Live = (function () {
  'use strict';
  function api(path) { return new LiveAPI(null, path); }
  function one(a, prop) { var v = a.get(prop); return Array.isArray(v) ? v[0] : v; }
  function exists(a) { return a && Number(a.id) !== 0; }
  function json(v) {
    if (typeof v === 'string') return JSON.parse(v);
    if (Array.isArray(v) && typeof v[0] === 'string' && v.length === 1) return JSON.parse(v[0]);
    return v;
  }

  // Live 12's scale names, as ScaleView numbers its scales (1-16). A scale
  // ScaleView has no name for is left out: the device keeps its own key.
  var SCALE = {
    'Major': 1, 'Minor': 2, 'Harmonic Minor': 3, 'Dorian': 5, 'Phrygian': 6, 'Lydian': 7,
    'Mixolydian': 8, 'Major Pentatonic': 10, 'Minor Pentatonic': 11, 'Minor Blues': 13,
    'Whole Tone': 14, 'Whole-half Dim.': 15, 'Half-whole Dim.': 16
  };
  // ScaleView's eighteen roots, and the spelling a key on each pitch class
  // takes: flats for the major side, sharps where a minor key has them.
  var ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'Cb'];
  var MAJOR_SIDE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  var MINOR_SIDE = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  var MINORISH = { 2: 1, 3: 1, 5: 1, 6: 1, 11: 1, 13: 1 };
  var SCALE_NAMES = ['Major', 'Minor (Natural)', 'Harmonic Minor', 'Ionian', 'Dorian', 'Phrygian', 'Lydian',
                     'Mixolydian', 'Aeolian', 'Major Pentatonic', 'Minor Pentatonic', 'Major Blues', 'Minor Blues',
                     'Whole Tone', 'Diminished Whole-Half', 'Diminished Half-Whole'];

  function song() {
    var s = api('live_set');
    var out = { tempo: +one(s, 'tempo') || 120, num: +one(s, 'signature_numerator') || 4,
                den: +one(s, 'signature_denominator') || 4, playing: !!+one(s, 'is_playing'),
                position: +one(s, 'current_song_time') || 0, key: null };
    var mode = s.get('scale_mode');
    if (mode !== undefined && mode !== null) {
      var name = String(one(s, 'scale_name')), pc = +one(s, 'root_note');
      var sc = SCALE[name];
      out.liveScale = { on: !!+(Array.isArray(mode) ? mode[0] : mode), name: name, root: pc };
      if (sc) out.key = { root: ROOTS.indexOf((MINORISH[sc] ? MINOR_SIDE : MAJOR_SIDE)[((pc % 12) + 12) % 12]) + 1, scale: sc };
    }
    return out;
  }

  function detailClip() {
    var c = api('live_set view detail_clip');
    if (!exists(c) || !+one(c, 'is_midi_clip')) return null;
    return c;
  }

  // The clip being edited: its selected notes if any are selected, else every
  // note in its loop. Starts are from the start of what was taken.
  function clipNotes() {
    var c = detailClip();
    if (!c) return null;
    var from = +one(c, 'loop_start') || 0, to = +one(c, 'loop_end') || 0;
    var raw = null, selected = false;
    try { raw = json(c.call('get_selected_notes_extended')); selected = raw && raw.notes && raw.notes.length > 0; } catch (e) { raw = null; }
    if (!selected) raw = json(c.call('get_notes_extended', 0, 128, from, Math.max(0, to - from)));
    var notes = ((raw && raw.notes) || []).filter(function (n) { return !n.mute; }).map(function (n) {
      return { start: n.start_time, len: n.duration, pitch: n.pitch, vel: Math.round(n.velocity) };
    });
    var first = selected && notes.length ? Math.min.apply(null, notes.map(function (n) { return n.start; })) : from;
    var beats = to - from;
    if (selected) {
      var bar = 4, end = 0;
      notes.forEach(function (n) { end = Math.max(end, n.start + n.len); });
      first = Math.floor(first / bar) * bar;
      beats = Math.ceil((end - first) / bar) * bar;
    }
    notes.forEach(function (n) { n.start -= first; });
    notes.sort(function (a, b) { return a.start - b.start || a.pitch - b.pitch; });
    return { notes: notes, beats: beats, name: String(one(c, 'name') || ''), selected: selected, drums: drumTrack() };
  }

  // A track whose instrument is a Drum Rack plays drums: its note numbers name
  // drums, not pitches, and the engines treat them that way.
  function drumTrack() {
    try {
      var track = api('this_device canonical_parent'), n = track.getcount('devices');
      for (var i = 0; i < n; i++) if (+one(api(track.unquotedpath + ' devices ' + i), 'can_have_drum_pads')) return true;
    } catch (e) { /* not known: not drums */ }
    return false;
  }

  function liveNotes(notes) {
    return { notes: notes.map(function (n) {
      return { pitch: Math.max(0, Math.min(127, Math.round(n.pitch))), start_time: Math.max(0, n.start),
               duration: Math.max(1 / 128, n.len), velocity: Math.max(1, Math.min(127, Math.round(n.vel || 100))), mute: 0 };
    }) };
  }

  function undoable(fn) {
    var s = api('live_set');
    try { s.call('begin_undo_step'); } catch (e) { /* Live before 11.1 */ }
    try { return fn(); } finally { try { s.call('end_undo_step'); } catch (e2) { /* as above */ } }
  }

  function show(clip) {
    try { api('live_set view').set('detail_clip', 'id', Number(clip.id)); } catch (e) { /* the clip is made either way */ }
  }

  function selectedScene() {
    var scene = api('live_set view selected_scene'), n = api('live_set').getcount('scenes');
    for (var i = 0; i < n; i++) if (Number(api('live_set scenes ' + i).id) === Number(scene.id)) return i;
    return 0;
  }
  function thisTrack() {
    var track = api('this_device canonical_parent');
    if (!exists(track) || !+one(track, 'has_midi_input')) return null;
    return track;
  }
  // Where this device's track is in the set, for putting new tracks beside it.
  function trackIndex(track) {
    var n = api('live_set').getcount('tracks');
    for (var i = 0; i < n; i++) if (Number(api('live_set tracks ' + i).id) === Number(track.id)) return i;
    return n - 1;
  }
  function clipInSlot(slot, notes, beats, name) {
    slot.call('create_clip', Math.max(1, beats));
    var clip = api(slot.unquotedpath + ' clip');
    if (name) clip.set('name', name);
    clip.call('add_new_notes', liveNotes(notes));
    return clip;
  }
  function freeSlot(track, from) {
    var n = track.getcount('clip_slots');
    for (var k = 0; k < n; k++) {
      var at = (from + k) % n, slot = api(track.unquotedpath + ' clip_slots ' + at);
      if (!+one(slot, 'has_clip')) return { slot: slot, at: at };
    }
    return null;
  }
  function arrangementClipOn(track, notes, beats, name, at) {
    var before = track.getcount('arrangement_clips');
    try { track.call('create_midi_clip', at, Math.max(1, beats)); } catch (e) { /* checked below */ }
    var count = track.getcount('arrangement_clips');
    if (!(count > before)) return false;
    for (var i = 0; i < count; i++) {
      var clip = api(track.unquotedpath + ' arrangement_clips ' + i);
      if (Math.abs((+one(clip, 'start_time') || 0) - at) < 1e-6) {
        if (name) clip.set('name', name);
        clip.call('add_new_notes', liveNotes(notes));
        return true;
      }
    }
    return false;
  }

  // New notes, as a new clip in the first free slot on this device's track,
  // from the selected scene down. `more` are further parts ({name, notes}),
  // each on a new MIDI track after this one, in the same scene. Returns what
  // happened, for the status line.
  function newClip(notes, beats, name, more) {
    var track = thisTrack();
    if (!track) return { ok: false, message: 'This device needs to be on a MIDI track.' };
    var free = freeSlot(track, selectedScene());
    if (!free) return { ok: false, message: 'Every clip slot on this track is full. Add a scene, then try again.' };
    return undoable(function () {
      var clip = clipInSlot(free.slot, notes, beats, name);
      var made = newTracks(track, more, function (t) {
        clipInSlot(api(t.unquotedpath + ' clip_slots ' + free.at), this.notes, beats, this.name);
      });
      show(clip);
      return { ok: true, message: 'Added a clip in scene ' + (free.at + 1) + (made ? ', and ' + made + ' on new tracks beside it.' : '.') };
    });
  }

  // New notes on a new MIDI track beside this one, in the selected scene:
  // a suggestion goes with the music it was made for, not over it.
  function newTrackClip(notes, beats, name, more) {
    var track = thisTrack();
    if (!track) return { ok: false, message: 'This device needs to be on a MIDI track.' };
    var scene = selectedScene();
    return undoable(function () {
      var parts = [{ name: name, notes: notes }].concat(more || []);
      newTracks(track, parts, function (t) { show(clipInSlot(api(t.unquotedpath + ' clip_slots ' + scene), this.notes, beats, this.name)); });
      return { ok: true, message: parts.length === 1 ? 'Added a track beside this one, with the clip in scene ' + (scene + 1) + '.'
                                                     : 'Added ' + parts.length + ' tracks beside this one, with the clips in scene ' + (scene + 1) + '.' };
    });
  }

  // Each further part on a new MIDI track, in order, after this one.
  function newTracks(track, more, put) {
    if (!more || !more.length) return '';
    var at = trackIndex(track), song = api('live_set');
    more.forEach(function (part, k) {
      song.call('create_midi_track', at + 1 + k);
      var t = api('live_set tracks ' + (at + 1 + k));
      t.set('name', part.name);
      put.call(part, t);
    });
    return more.length === 1 ? 'one more part' : more.length + ' more parts';
  }

  // New notes in place of the notes of the clip being edited, from its loop start.
  function replaceInClip(notes, beats) {
    var c = detailClip();
    if (!c) return { ok: false, message: 'No MIDI clip is open. Open one in Detail View, then try again.' };
    var from = +one(c, 'loop_start') || 0;
    return undoable(function () {
      var span = Math.max(beats, (+one(c, 'loop_end') || 0) - from);
      c.call('remove_notes_extended', 0, 128, from, span);
      c.call('add_new_notes', liveNotes(notes.map(function (n) {
        return { start: n.start + from, len: n.len, pitch: n.pitch, vel: n.vel };
      })));
      if ((+one(c, 'loop_end') || 0) < from + beats) c.set('loop_end', from + beats);
      return { ok: true, message: 'Replaced the notes in “' + (String(one(c, 'name') || '') || 'the clip') + '”.' };
    });
  }

  // New notes in the Arrangement at the insert marker, on this device's track
  // (Track.create_midi_clip, Live 12.2 and later); further parts as above.
  function arrangementClip(notes, beats, name, more) {
    var track = thisTrack();
    if (!track) return { ok: false, message: 'This device needs to be on a MIDI track.' };
    var at = +one(api('live_set'), 'current_song_time') || 0;
    return undoable(function () {
      if (!arrangementClipOn(track, notes, beats, name, at)) {
        return { ok: false, message: 'This version of Live can\u2019t add Arrangement clips from a device. Choose New Clip instead.' };
      }
      var made = newTracks(track, more, function (t) { arrangementClipOn(t, this.notes, beats, this.name, at); });
      return { ok: true, message: 'Added a clip to the Arrangement at beat ' + (Math.round(at * 100) / 100 + 1) +
               (made ? ', and ' + made + ' on new tracks beside it.' : '.') };
    });
  }

  // ------------------------------------------------------------ player ---
  // Notes heard through this device's MIDI out: the instrument after it on
  // the track plays them. A Task ticks every few milliseconds and sends what
  // is due; nothing waits on the transport.
  function Player(send) {
    this.send = send; this.events = []; this.pos = 0; this.t0 = 0; this.task = null; this.sounding = {};
    this.onEnd = null;
  }
  Player.prototype.play = function (notes, tempo, onEnd) {
    this.stop();
    var ms = 60000 / (tempo || 120), ev = [];
    notes.forEach(function (n) {
      ev.push({ t: n.start * ms, on: true, pitch: n.pitch, vel: n.vel || 100 });
      ev.push({ t: (n.start + n.len) * ms - 1, on: false, pitch: n.pitch });
    });
    ev.sort(function (a, b) { return a.t - b.t || (a.on === b.on ? 0 : a.on ? 1 : -1); });
    this.events = ev; this.pos = 0; this.t0 = Date.now(); this.onEnd = onEnd || null;
    var self = this;
    this.task = new Task(function () { self.tick(); }, this);
    this.task.interval = 4;
    this.task.repeat();
    this.tick();
  };
  Player.prototype.tick = function () {
    var now = Date.now() - this.t0;
    while (this.pos < this.events.length && this.events[this.pos].t <= now) {
      var e = this.events[this.pos++];
      if (e.on) { this.sounding[e.pitch] = (this.sounding[e.pitch] || 0) + 1; this.send([0x90, e.pitch, Math.max(1, Math.min(127, Math.round(e.vel)))]); }
      else if (this.sounding[e.pitch]) { this.sounding[e.pitch]--; this.send([0x80, e.pitch, 0]); }
    }
    if (this.pos >= this.events.length) {
      var end = this.onEnd;
      this.stop();
      if (end) end();
    }
  };
  Player.prototype.playing = function () { return !!this.task; };
  Player.prototype.stop = function () {
    if (this.task) { this.task.cancel(); this.task.freepeer && this.task.freepeer(); this.task = null; }
    var self = this;
    Object.keys(this.sounding).forEach(function (p) {
      for (var i = 0; i < self.sounding[p]; i++) self.send([0x80, +p, 0]);
    });
    this.sounding = {};
    this.onEnd = null;
  };

  return { song: song, clipNotes: clipNotes, newClip: newClip, newTrackClip: newTrackClip, replaceInClip: replaceInClip,
           arrangementClip: arrangementClip, drumTrack: drumTrack, Player: Player, ROOTS: ROOTS, SCALE_NAMES: SCALE_NAMES };
})();


/* ---- actions.js ---- */
/* MIDI Production Center in Live: what its two REAPER loader scripts do.
 *
 * "MPC - Load selected MIDI item" sends a phrase to the plug-in; "MPC -
 * Loader (background)" keeps a heartbeat and answers the window's own Load
 * button. Both speak through the "MIDIProductionCenter" gmem mailbox
 * (Scripts/MIDI Production Center/mpc_loader_lib.lua). Here the device does
 * both: the clip open in Detail View is the selected item, and the
 * plug-in's own Instance ID (slider48) says which plug-in it is for. */
var MPC = { SEQ: 0, TARGET: 1, COUNT: 2, LEN: 3, TEMPO: 4, TSN: 5, TSD: 6, NMARK: 7, NAMELEN: 8,
            ACK_SEQ: 10, ACK_COUNT: 11, REQ_ID: 20, REQ_SEQ: 21, ERR_CODE: 22, ERR_SEQ: 23, HEARTBEAT: 30,
            NOTES: 100, MARKERS: 60000, NAME: 61000, MAX_NOTES: 8192, MAX_NAME: 64,
            ERR_NO_ITEM: 1, ERR_NO_NOTES: 2, INSTANCE_SLIDER: 48 };
var loader = { beat: 0, lastReq: null, waiting: null };

function mailbox(fx) { return fx.gmem[fx.gmemName] || (fx.gmem[fx.gmemName] = {}); }

// The clip as the loader writes a phrase: notes from 100, the name from
// 61000 (printable ASCII only), the header, and the sequence number last.
function sendPhrase(fx, g, id, c) {
  var s = Live.song(), notes = c.notes.slice(0, MPC.MAX_NOTES);
  notes.forEach(function (n, i) {
    var b = MPC.NOTES + i * 5;
    g[b] = n.start; g[b + 1] = n.len; g[b + 2] = n.pitch; g[b + 3] = n.vel; g[b + 4] = 0;
  });
  var name = String(c.name || 'Clip').replace(/[^\x20-\x7e]/g, '').slice(0, MPC.MAX_NAME);
  for (var k = 0; k < name.length; k++) g[MPC.NAME + k] = name.charCodeAt(k);
  g[MPC.TARGET] = id; g[MPC.COUNT] = notes.length; g[MPC.LEN] = c.beats; g[MPC.TEMPO] = s.tempo;
  g[MPC.TSN] = s.num; g[MPC.TSD] = s.den; g[MPC.NMARK] = 0; g[MPC.NAMELEN] = name.length;
  var seq = Math.floor(g[MPC.SEQ] || 0) + 1;
  g[MPC.SEQ] = seq;
  loader.waiting = { seq: seq, name: name || 'the clip', ticks: 0 };
  return seq;
}

var ACTIONS = {
  loadClip: function (fx, Live) {
    var id = fx.getSlider(MPC.INSTANCE_SLIDER);
    if (!id) return 'MIDI Production Center is still starting. Try again in a moment.';
    var c = Live.clipNotes();
    if (!c) return 'No MIDI clip is open. Open one in Detail View, then try again.';
    if (!c.notes.length) return 'That clip has no notes. Choose a clip with notes, then try again.';
    sendPhrase(fx, mailbox(fx), id, c);
    return 'Loading “' + (c.name || 'the clip') + '”…';
  },
  // The background loader: a heartbeat, the window's Load answered, and the
  // plug-in's receipt reported.
  tick: function (fx) {
    var g = mailbox(fx);
    loader.beat++;
    if ((loader.beat & 15) === 1) g[MPC.HEARTBEAT] = loader.beat;
    var req = g[MPC.REQ_SEQ] || 0;
    if (loader.lastReq === null) loader.lastReq = req;
    if (req !== loader.lastReq) {
      loader.lastReq = req;
      var c = null;
      try { c = Live.clipNotes(); } catch (e) { c = null; }
      if (!c) { g[MPC.ERR_CODE] = MPC.ERR_NO_ITEM; g[MPC.ERR_SEQ] = req; }
      else if (!c.notes.length) { g[MPC.ERR_CODE] = MPC.ERR_NO_NOTES; g[MPC.ERR_SEQ] = req; }
      else sendPhrase(fx, g, Math.round(g[MPC.REQ_ID] || 0), c);
    }
    if (loader.waiting) {
      if (g[MPC.ACK_SEQ] === loader.waiting.seq) {
        say('Loaded “' + loader.waiting.name + '” and chopped it onto the pads.');
        loader.waiting = null;
      } else if (++loader.waiting.ticks > 500) {
        say('MIDI Production Center didn’t take the clip. Try again.');
        loader.waiting = null;
      }
    }
  }
};


/* ---- kit/jsfx_device.js ---- */
/* A family JSFX as a Max for Live MIDI effect: the .jsfx itself, unchanged,
 * on Middaw's EEL2 runtime, with its own @gfx window drawn in this [v8ui].
 *
 * The [v8ui] sits in the device's window subpatcher, which the device strip's
 * Show Window button opens. Its code runs whether the window is open or not.
 *
 * A Task ticks every few milliseconds: the MIDI that arrived since the last
 * tick goes in, a block as long as the time that passed is run, and what the
 * plug-in sends comes straight out. Live's tempo, meter, transport and song
 * position are what REAPER would give it.
 *
 * Expects, before it: Gfx, Live, MiddawJSFX, and DEVICE = { main, files,
 * actions? }. A device's own buttons (Load Clip, Insert the Take) are in
 * ACTIONS, defined in the repository's ableton/actions.js, which shares this
 * file's global scope: its own functions must not reuse a name defined here
 * (send, say, load, tick...), or this file's takes its place.
 * Inlet 0: bang (Live is ready), MIDI bytes, restore, and the strip's
 * commands. Outlets: 0 MIDI bytes, 1 the saved state to [pattr], 2 the
 * strip's status line.
 *
 * DEVICE.audio: the sound is gen~'s (ableton/kit/jsfx2gen.js), not this
 * file's. The plug-in here runs @init, @slider and @gfx only, for its window;
 * what its sliders say goes to gen~ (outlet 3, "sliderN value"), with Live's
 * tempo and transport, and MIDI goes to gen~ through the buffer~ the patcher
 * names in "mqname" (three values a message, the count at 0).
 */
inlets = 1;
outlets = DEVICE.audio ? (DEVICE.drops ? 5 : 4) : 3;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var SR = 48000;
var ACTIONS = typeof ACTIONS === 'undefined' ? {} : ACTIONS;

// The bundle keeps files as bytes; the runtime reads a .jsfx as text.
function source(name) {
  var t = DEVICE.files[name];
  if (t === undefined) return null;
  try { return decodeURIComponent(escape(t)); } catch (e) { return t; }
}
var fx = new MiddawJSFX.JSFX(source(DEVICE.main), { gfx: true, sampleRate: SR, readImport: source });
fx.init(SR);

var D = {
  ready: false, pending: null, task: null, last: 0, beat: 0, pos: 0,
  midiIn: [], running: [], status: '', host: new Gfx.Host(mgraphics),
  mouse: { x: -1, y: -1, cap: 0, wheel: 0 }, release: false, frameSaw: true,
  menu: null, menuSnap: null, menuMouse: null, frames: 0, song: { tempo: 120, num: 4, den: 4, playing: false }
};

function say(msg) { D.status = msg || ''; outlet(2, 'set', D.status); }
function send(data) { for (var i = 0; i < data.length; i++) outlet(0, data[i]); }

// ---------------------------------------------------------------- MIDI --
// [midiin] gives a byte at a time; a message is whole once its data are in.
function msg_int(b) {
  b = b & 255;
  if (b >= 0xF8) return;                      // real-time: not passed to the plug-in
  if (b & 0x80) { D.running = [b]; return; }
  if (!D.running.length) return;
  D.running.push(b);
  var st = D.running[0] & 0xF0, need = (st === 0xC0 || st === 0xD0) ? 2 : 3;
  if (D.running[0] >= 0xF0) { D.running = []; return; }  // system messages are not passed on
  if (D.running.length === need) {
    D.midiIn.push(need === 2 ? [D.running[0], D.running[1], 0] : D.running.slice());
    D.running = [D.running[0]];
  }
}

// --------------------------------------------------------------- clock --
function readSong() {
  try {
    var s = Live.song();
    D.song = { tempo: s.tempo, num: s.num, den: s.den, playing: s.playing, position: s.position };
  } catch (e) { /* outside Live */ }
}
// ------------------------------------------------------------ gen~ ----
var GEN = { sent: {}, mq: null, written: 0, CAP: 256, every: 0 };
function mqname(name) {
  try { GEN.mq = new Buffer(String(name)); } catch (e) { GEN.mq = null; }
}
function toGen() {
  fx.file.sliders.forEach(function (sl) {
    var v = fx.sliderByIndex(sl.index);
    if (GEN.sent[sl.index] !== v) { GEN.sent[sl.index] = v; outlet(3, 'slider' + sl.index, v); }
  });
  (DEVICE.fromWindow || []).forEach(function (n) {
    var v = fx.getVar(n);
    if (GEN.sent['w_' + n] !== v) { GEN.sent['w_' + n] = v; outlet(3, 'w_' + n, v); }
  });
  if ((GEN.every++ % 12) === 0) {
    outlet(3, 'tempo', D.song.tempo); outlet(3, 'play_state', D.song.playing ? 1 : 0);
    outlet(3, 'beat_position', D.song.playing ? D.song.position : D.beat);
    outlet(3, 'ts_num', D.song.num); outlet(3, 'ts_denom', D.song.den);
  }
}
function midiToGen(data) {
  if (!GEN.mq) return;
  var at = 1 + 3 * (GEN.written % GEN.CAP);
  GEN.mq.poke(1, at, [data[0], data[1], data[2]]);
  GEN.written++;
  GEN.mq.poke(1, 0, GEN.written);
}

function tick() {
  if (DEVICE.audio) {
    if ((D.frames++ & 63) === 0) readSong();
    if (D.midiIn.length) { D.midiIn.forEach(midiToGen); D.midiIn = []; }
    if ((D.frames % 5) === 0) toGen();
    if (ACTIONS.tick) ACTIONS.tick(fx);
    if ((D.frames & 511) === 0) save();
    return;
  }
  var now = Date.now();
  var ms = Math.min(100, Math.max(0, now - D.last));
  D.last = now;
  if ((D.frames++ & 63) === 0 || D.song.playing) readSong();
  var n = Math.max(1, Math.round(ms * SR / 1000));
  var spb = SR * 60 / D.song.tempo;
  fx.setTime({ tempo: D.song.tempo, num: D.song.num, den: D.song.den, playState: D.song.playing ? 1 : 0,
               beat: D.song.playing ? D.song.position : D.beat, seconds: (D.song.playing ? D.song.position : D.beat) * 60 / D.song.tempo });
  if (!D.song.playing) D.beat += n / spb;
  var midi = D.midiIn.map(function (data) { return { offset: 0, data: data }; });
  D.midiIn = [];
  var out = fx.process(n, null, null, midi);
  for (var i = 0; i < out.length; i++) send(out[i].data);
  if (ACTIONS.tick) ACTIONS.tick(fx);
  if ((D.frames & 511) === 0) save();
}
function start() {
  if (D.task) return;
  D.last = Date.now();
  D.task = new Task(tick, this);
  D.task.interval = 4;
  D.task.repeat();
  var draw = new Task(function () { mgraphics.redraw(); }, this);
  draw.interval = 33;
  draw.repeat();
  D.drawTask = draw;
}

// ------------------------------------------------------------ messages --
function bang() {
  D.ready = true;
  readSong();
  if (D.pending) { load(D.pending); D.pending = null; }
  start();
}
function restore(text) {
  var st = null;
  try { st = JSON.parse(String(text)); } catch (e) { return; }
  if (!D.ready) { D.pending = st; return; }
  load(st);
}
function load(st) {
  if (st && st.v === 1 && st.fx) { fx.deserialize(st.fx); fx.runSection('slider'); lastSaved = JSON.stringify(st); GEN.sent = {}; }
}
// The plug-in's @serialize, kept with the Live set: written when it changes,
// so an untouched device does not mark the set as changed.
var lastSaved = '';
function save() {
  var s = JSON.stringify({ v: 1, fx: fx.serialize() });
  if (s === lastSaved) return;
  lastSaved = s;
  outlet(1, 'set', s);
}
// The strip's buttons: "action <name>".
function action(name) {
  var a = ACTIONS[name];
  if (!a) return;
  try { var msg = a(fx, Live); if (msg) say(msg); } catch (e) { say(String(e.message || e)); }
  save();
  mgraphics.redraw();
}
// Keys typed while the window has focus, from its [key].
function key(code) { D.host.key(code); mgraphics.redraw(); }
function anything() {
  var a = ACTIONS[messagename];
  if (a) action(messagename);
}

// --------------------------------------------------------------- paint --
function size() {
  var r = (typeof box !== 'undefined' && box.rect) ? box.rect : [0, 0].concat(fx.file.gfxSize || [800, 600]);
  return [r[2] - r[0], r[3] - r[1]];
}
function paint() {
  var g = mgraphics, sz = size(), h = D.host;
  var clear = fx.getVar('gfx_clear');
  var c = clear >= 0 ? clear : 0;           // REAPER keeps the last frame for -1; a [v8ui] cannot
  g.set_source_rgba((c & 255) / 255, ((c >> 8) & 255) / 255, ((c >> 16) & 255) / 255, 1);
  g.rectangle(0, 0, sz[0], sz[1]);
  g.fill();
  if (D.menu) { frame(g, sz, D.menuMouse); drawMenu(g, sz); return; }
  var snap = new Float64Array(fx.v);
  var mouse = { x: D.mouse.x, y: D.mouse.y, cap: D.mouse.cap, wheel: D.mouse.wheel };
  D.mouse.wheel = 0;
  frame(g, sz, mouse);
  D.frameSaw = true;
  if (D.release) { D.release = false; D.mouse.cap = 0; }
  if (h.menu) { D.menu = { items: Gfx.parseMenu(h.menu.text), x: mouse.x, y: mouse.y, hover: -1 }; D.menuSnap = snap; D.menuMouse = mouse; }
}
function frame(g, sz, mouse) {
  D.host.begin(g, fx);
  D.host.mouseIn = mouse.x >= 0 && mouse.y >= 0 && mouse.x < sz[0] && mouse.y < sz[1];
  try { fx.runGfx(D.host, sz[0], sz[1], mouse); } catch (e) { say('The window stopped: ' + (e.message || e)); }
}

// The menu gfx_showmenu asked for, over the window.
var ITEM_H = 20;
function menuRect(sz) {
  var m = D.menu, w = 40;
  mgraphics.select_font_face('Arial', 'normal', 'normal');
  mgraphics.set_font_size(12);
  m.items.forEach(function (it) { if (it.label) w = Math.max(w, mgraphics.text_measure(it.label)[0] + 40 + it.depth * 12); });
  var h = m.items.length * ITEM_H + 8;
  var x = Math.min(m.x, sz[0] - w - 2), y = Math.min(m.y, sz[1] - h - 2);
  return [Math.max(0, x), Math.max(0, y), w, h];
}
function drawMenu(g, sz) {
  var r = menuRect(sz), m = D.menu;
  g.set_source_rgba(0.165, 0.184, 0.216, 1); g.rectangle(r[0], r[1], r[2], r[3]); g.fill();
  g.set_source_rgba(0.227, 0.251, 0.29, 1); g.set_line_width(1); g.rectangle(r[0] + 0.5, r[1] + 0.5, r[2] - 1, r[3] - 1); g.stroke();
  m.items.forEach(function (it, i) {
    var y = r[1] + 4 + i * ITEM_H;
    if (it.rule) { g.set_source_rgba(0.227, 0.251, 0.29, 1); g.rectangle(r[0] + 6, y + ITEM_H / 2, r[2] - 12, 1); g.fill(); return; }
    if (i === m.hover && it.index && !it.grey) { g.set_source_rgba(1, 0.949, 0, 1); g.rectangle(r[0] + 2, y, r[2] - 4, ITEM_H); g.fill(); }
    var on = i === m.hover && it.index && !it.grey;
    var ink = on ? [0.078, 0.09, 0.11] : it.grey || it.title ? [0.714, 0.737, 0.776] : [0.867, 0.882, 0.906];
    g.set_source_rgba(ink[0], ink[1], ink[2], 1);
    g.move_to(r[0] + 22 + it.depth * 12, y + 14);
    g.show_text(it.label);
    if (it.tick) { g.move_to(r[0] + 7 + it.depth * 12, y + 14); g.show_text('✓'); }
  });
}
function menuAt(x, y) {
  var r = menuRect(size());
  if (x < r[0] || x >= r[0] + r[2] || y < r[1] + 4 || y >= r[1] + r[3] - 4) return -1;
  return Math.floor((y - r[1] - 4) / ITEM_H);
}
function chooseMenu(i) {
  var m = D.menu, it = i >= 0 ? m.items[i] : null;
  if (it && (!it.index || it.grey)) return;          // a title, a rule or a greyed item: the menu stays
  D.menu = null;
  // The frame that asked runs again from where it started, and gets the answer.
  fx.v.set(D.menuSnap);
  D.host.choice = it ? it.index : 0;
  if (!it) { D.host.choice = 0; D.host.cancelled = true; }
  var g = mgraphics, sz = size();
  if (it) frame(g, sz, D.menuMouse);
  D.host.choice = 0;
  D.mouse.cap = 0;
  save();
  mgraphics.redraw();
}

// --------------------------------------------------------------- mouse --
// REAPER's mouse_cap: 1 left, 2 right, 4 Command, 8 Shift, 16 Option, 32 Control.
function caps(but, cmd, shift, opt, ctrl) {
  return (ctrl ? 2 : 1) | (cmd ? 4 : 0) | (shift ? 8 : 0) | (opt ? 16 : 0);
}
function onclick(x, y, but, cmd, shift, capslock, opt, ctrl) {
  if (D.menu) { chooseMenu(menuAt(x, y)); return; }
  D.mouse.x = x; D.mouse.y = y; D.mouse.cap = caps(but, cmd, shift, opt, ctrl);
  D.frameSaw = false;
  mgraphics.redraw();
}
function ondrag(x, y, but) {
  if (D.menu) return;
  D.mouse.x = x; D.mouse.y = y;
  if (!but) {
    // A click shorter than a frame is still seen down for one frame.
    if (D.frameSaw) D.mouse.cap = 0; else D.release = true;
    save();
  }
  mgraphics.redraw();
}
function onidle(x, y) {
  if (D.menu) { var i = menuAt(x, y); if (i !== D.menu.hover) { D.menu.hover = i; mgraphics.redraw(); } return; }
  D.mouse.x = x; D.mouse.y = y;
}
function onidleout() { if (!D.menu) { D.mouse.x = -1; D.mouse.y = -1; } }
function onwheel(x, y, dx, dy) { D.mouse.wheel += Math.round(dy * 120); mgraphics.redraw(); }


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

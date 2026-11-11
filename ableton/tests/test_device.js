/* The Max for Live device, run in Node on a pretend Max and a pretend Live.
 *   python3 ableton/kit/build.py ableton/device.json && node --test ableton/tests/ */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { liveSet } = require('../kit/test/max.js');
const suite = require('../kit/test/jsfx_suite.js');
require('../kit/test/palette_suite.js')();

const { device } = suite({ bundle: path.join(__dirname, '..', 'MIDIProductionCenter.js'), name: 'MIDI Production Center', window: [1000, 660] });

const PHRASE = [];
for (let i = 0; i < 16; i++) PHRASE.push({ pitch: 60 + (i % 8), start_time: i * 0.5, duration: 0.4, velocity: 100 });

function pitchesFrom(d) {
  const s = new Set(), b = d.midi();
  for (let i = 0; i + 2 < b.length; i += 3) if ((b[i] & 0xF0) === 0x90 && b[i + 2] > 0) s.add(b[i + 1]);
  return s;
}

test('Load Clip chops the open clip onto the pads', () => {
  const set = liveSet();
  set.open(set.clip(8, PHRASE, { name: 'Riff' }));
  const d = device({ set });
  d.run(100);
  d.send('action', 'loadClip');
  d.run(300);
  assert.ok(/^Loaded “Riff” and chopped it onto the pads/.test(d.status()), d.status());
});

test('the window’s own Load is answered, as the background loader answers it', () => {
  const set = liveSet();
  set.open(set.clip(8, PHRASE, { name: 'Riff' }));
  const d = device({ set });
  d.run(100);
  const g = d.ctx.fx.gmem[d.ctx.fx.gmemName];
  assert.ok(g[30] > 0, 'the heartbeat moves');
  g[20] = d.ctx.fx.getSlider(48); g[21] = (g[21] || 0) + 1;     // what the window's Load writes
  d.run(300);
  assert.ok(/^Loaded “Riff”/.test(d.status()), d.status());
});

test('with no clip open the window is told why', () => {
  const d = device();
  d.run(100);
  const g = d.ctx.fx.gmem[d.ctx.fx.gmemName];
  g[20] = d.ctx.fx.getSlider(48); g[21] = (g[21] || 0) + 1;
  d.run(100);
  assert.strictEqual(g[22], 1);
  assert.strictEqual(g[23], g[21]);
});

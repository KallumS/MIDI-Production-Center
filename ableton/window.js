// The picture in the README: `node ableton/window.js` redraws ableton/window.png.
// A phrase loaded from the clip in Detail View and chopped onto the pads.
require('./kit/test/picture.js')(__dirname, { bundle: 'MIDIProductionCenter.js', w: 1000, h: 660, clip: 'Riff',
  go(d) { d.send('action', 'loadClip'); d.run(300); } });

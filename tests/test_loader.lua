-- Tests the loader scripts' library against a mock of the ReaScript API.
--
--   lua5.4 tests/test_loader.lua          run the checks
--   lua5.4 tests/test_loader.lua --dump   print the gmem a load writes (used by
--                                         test_mpc.py to feed the real plug-in)

local here = arg[0]:match("^(.*[/\\])") or "./"
local LIB = here .. "../Scripts/MIDI Production Center/mpc_loader_lib.lua"

---------------------------------------------------------------------------
-- mock REAPER: 120 BPM, 4/4, so 1 second = 2 quarter notes; 960 PPQ
---------------------------------------------------------------------------
local gmem = {}
local tracks, master = {}, { name = "master", fx = {} }
local selected = {}
local focused = nil
local proj_markers = {}

reaper = {}
function reaper.gmem_attach(name) reaper._gname = name end
function reaper.gmem_write(i, v) gmem[i] = v end
function reaper.gmem_read(i) return gmem[i] or 0 end
function reaper.TimeMap2_timeToQN(_, t) return t * 2 end
function reaper.TimeMap2_QNToTime(_, q) return q / 2 end
function reaper.TimeMap_GetTimeSigAtTime(_, _) return 4, 4, 120 end
function reaper.GetMasterTrack() return master end
function reaper.CountTracks() return #tracks end
function reaper.GetTrack(_, i) return tracks[i + 1] end
function reaper.TrackFX_GetCount(tr) return #tr.fx end
function reaper.TrackFX_GetNumParams(tr, fx) return #tr.fx[fx + 1].params end
function reaper.TrackFX_GetParamName(tr, fx, p) return true, tr.fx[fx + 1].params[p + 1][1] end
function reaper.TrackFX_GetParam(tr, fx, p) return tr.fx[fx + 1].params[p + 1][2], 0, 1 end
function reaper.GetTouchedOrFocusedFX(_)
  if not focused then return false end
  return true, focused.trackidx, -1, -1, focused.fx, 0
end
function reaper.CountSelectedMediaItems() return #selected end
function reaper.GetSelectedMediaItem(_, i) return selected[i + 1] end
function reaper.GetActiveTake(item) return item.take end
function reaper.TakeIsMIDI(take) return take.midi end
function reaper.GetMediaItem_Track(item) return item.track end
function reaper.GetMediaItemInfo_Value(item, k)
  if k == "D_POSITION" then return item.pos end
  if k == "D_LENGTH" then return item.len end
  if k == "B_LOOPSRC" then return item.loop and 1 or 0 end
  return 0
end
function reaper.GetMediaItemTakeInfo_Value(take, k)
  if k == "D_PLAYRATE" then return 1 end
  if k == "D_STARTOFFS" then return take.offs or 0 end
  return 0
end
function reaper.GetMediaItemTake_Source(take) return take end
function reaper.GetMediaSourceLength(take) return take.srclen, true end
function reaper.MIDI_CountEvts(take) return true, #take.notes, 0, 0 end
function reaper.MIDI_GetNote(take, i)
  local n = take.notes[i + 1]
  return true, false, n.muted or false, n.s, n.e, n.ch or 0, n.p, n.v
end
-- ppq 0 = the item's source start
function reaper.MIDI_GetProjQNFromPPQPos(take, ppq) return take.item.pos * 2 - (take.offs or 0) * 2 + ppq / 960 end
function reaper.GetNumTakeMarkers(take) return #(take.markers or {}) end
function reaper.GetTakeMarker(take, i) return take.markers[i + 1], "" end
function reaper.CountProjectMarkers() return #proj_markers, #proj_markers, 0 end
function reaper.EnumProjectMarkers3(_, i)
  local m = proj_markers[i + 1]
  if not m then return 0 end
  return i + 1, m.rgn or false, m.pos, 0, "", i
end
function reaper.GetTakeName(take) return take.name or "" end

local function mpc_fx(id)
  return { params = { { "Chop Mode", 0 }, { "Transient Sensitivity", 60 }, { "Instance ID", id }, { "Bypass", 0 } } }
end

local function item(track, pos, len, notes, extra)
  local take = { midi = true, notes = notes, name = extra and extra.name, markers = extra and extra.markers,
                 srclen = extra and extra.srclen, offs = extra and extra.offs }
  local it = { track = track, pos = pos, len = len, take = take, loop = extra and extra.loop }
  take.item = it
  return it
end

local function q(beats) return beats * 960 end

---------------------------------------------------------------------------
local lib = dofile(LIB)
local pass, fail = 0, 0
local function check(label, cond, detail)
  if cond then pass = pass + 1 else fail = fail + 1 end
  print(string.format("  %-58s %s%s", label, cond and "ok" or "FAIL", (not cond and detail) and ("   " .. tostring(detail)) or ""))
end

local t1 = { name = "drums", fx = { { params = { { "Gain", 0 } } }, mpc_fx(424242) } }
local t2 = { name = "keys", fx = { mpc_fx(777777) } }
tracks = { t1, t2 }

-- an item at 2 s (= beat 4), 4 beats long, with notes, a muted note, a note
-- running past the item end and one starting before the item
local notes = {
  { s = q(0), e = q(0.5), p = 36, v = 100 },
  { s = q(1), e = q(1.5), p = 38, v = 90, ch = 9 },
  { s = q(2), e = q(2.25), p = 42, v = 80, muted = true },
  { s = q(3), e = q(6), p = 60, v = 70 },
}
local a = item(t1, 2, 2, notes, { name = "Beat A", markers = { 1 } })   -- take marker 1 s into the source = beat 2 of the item
selected = { a }

if arg[1] == "--dump" then
  local ph = lib.read_phrase(lib.selected_midi_items())
  gmem[0] = 41
  lib.send(424242, ph)
  local keys = {}
  for k in pairs(gmem) do keys[#keys + 1] = k end
  table.sort(keys)
  for _, k in ipairs(keys) do print(k .. "=" .. string.format("%.17g", gmem[k])) end
  os.exit(0)
end

print("\nloader library")
local items = lib.selected_midi_items()
check("finds the selected MIDI item", #items == 1)
local ph = lib.read_phrase(items)
check("muted notes skipped", #ph.notes == 3, #ph.notes)
check("positions relative to the item start", ph.notes[1][1] == 0 and ph.notes[2][1] == 1)
check("notes clipped at the item end", math.abs(ph.notes[3][2] - 1) < 1e-9, ph.notes[3][2])
check("channel carried", ph.notes[2][5] == 9)
check("length = item length in beats", ph.length == 4, ph.length)
check("take marker becomes a chop point (beat 2)", #ph.markers == 1 and math.abs(ph.markers[1] - 2) < 1e-9, ph.markers[1])
check("tempo and time signature", ph.tempo == 120 and ph.tsn == 4 and ph.tsd == 4)
check("name from the take", ph.name == "Beat A")

proj_markers = { { pos = 3.5 }, { pos = 10 }, { pos = 2.5, rgn = true } }
ph = lib.read_phrase(lib.selected_midi_items())
check("project markers inside the item are added, others ignored",
  #ph.markers == 2 and math.abs(ph.markers[2] - 3) < 1e-9)
proj_markers = {}

-- looped item: 2-beat source repeated over 6 beats
local lp = item(t1, 0, 3, { { s = q(0), e = q(0.25), p = 40, v = 100 }, { s = q(1), e = q(1.25), p = 41, v = 100 } },
  { loop = true, srclen = 2 })
selected = { lp }
ph = lib.read_phrase(lib.selected_midi_items())
check("looped items are unrolled", #ph.notes == 6 and ph.notes[5][1] == 4, #ph.notes)

-- two items become one phrase
local b1 = item(t1, 0, 1, { { s = q(0), e = q(1), p = 50, v = 100 } })
local b2 = item(t1, 2, 1, { { s = q(0), e = q(1), p = 52, v = 100 } })
selected = { b1, b2 }
ph = lib.read_phrase(lib.selected_midi_items())
check("several items make one phrase", #ph.notes == 2 and ph.notes[2][1] == 4 and ph.length == 6, ph.length)

check("instances found by their parameters", #lib.find_instances() == 2)
local target = lib.choose_target({ { item = a } })
check("target: the instance on the item's track", target and target.id == 424242)
focused = { trackidx = 1, fx = 0 }
target = lib.choose_target({ { item = a } })
check("target: a focused instance wins", target and target.id == 777777)
focused = nil
tracks = { { fx = {} } }
local none, msg = lib.choose_target({ { item = a } })
check("no instance -> a helpful message", none == nil and msg:find("Add", 1, true))
tracks = { t1, t2 }

gmem = {}
gmem[0] = 5
selected = { a }
ph = lib.read_phrase(lib.selected_midi_items())
local seq = lib.send(424242, ph)
check("send writes the sequence last and bumps it", seq == 6 and gmem[0] == 6)
check("send layout: target, count, length, tempo", gmem[1] == 424242 and gmem[2] == 3 and gmem[3] == 4 and gmem[4] == 120)
check("send layout: notes from slot 100", gmem[100] == 0 and gmem[102] == 36 and gmem[107] == 38)
check("send layout: markers and name", gmem[7] == 1 and gmem[60000] == 2 and gmem[8] == 6 and gmem[61000] == 66)
check("not acked until the plug-in answers", not lib.acked(seq))
gmem[10] = seq
check("acked", lib.acked(seq))

print(string.format("\n%d passed, %d failed", pass, fail))
os.exit(fail == 0 and 0 or 1)

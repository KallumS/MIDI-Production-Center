-- mpc_loader_lib.lua
-- MIDI Production Center - shared code for the loader scripts.
--
-- JSFX can't read .mid files or MIDI items itself, so these scripts read the
-- selected MIDI item(s) through the ReaScript API and hand the notes to the
-- plug-in through shared memory (gmem namespace "MIDIProductionCenter"). The
-- layout is documented next to mpc_import_check() in mpc_engine.jsfx-inc.
--
-- Copyright (c) 2026 KallumS. MIT licence (see LICENSE).

local M = {}

M.GMEM = "MIDIProductionCenter"
M.FX_NAME = "MIDI Production Center"
M.MAX_NOTES = 8192
M.MAX_MARKERS = 256
M.MAX_NAME = 64

-- gmem slots (must match mpc_engine.jsfx-inc)
local G_SEQ, G_TARGET, G_COUNT, G_LEN, G_TEMPO, G_TSN, G_TSD, G_NMARK, G_NAMELEN = 0, 1, 2, 3, 4, 5, 6, 7, 8
local G_ACK_SEQ, G_ACK_COUNT = 10, 11
local G_REQ_ID, G_REQ_SEQ, G_ERR_CODE, G_ERR_SEQ = 20, 21, 22, 23
local G_HEARTBEAT = 30
local G_NOTES, G_MARKERS, G_NAME = 100, 60000, 61000

M.G_ACK_SEQ, M.G_ACK_COUNT = G_ACK_SEQ, G_ACK_COUNT
M.G_REQ_ID, M.G_REQ_SEQ, M.G_ERR_CODE, M.G_ERR_SEQ = G_REQ_ID, G_REQ_SEQ, G_ERR_CODE, G_ERR_SEQ
M.G_HEARTBEAT = G_HEARTBEAT

M.ERR_NO_ITEM, M.ERR_NO_NOTES, M.ERR_NO_PLUGIN = 1, 2, 3

---------------------------------------------------------------------------
-- Finding plug-in instances
---------------------------------------------------------------------------

-- The value of the plug-in's hidden "Instance ID" parameter, or nil if this
-- FX is not a MIDI Production Center. Matching on the parameter rather than
-- the FX name means a renamed instance is still found.
function M.instance_id(track, fx)
  local n = reaper.TrackFX_GetNumParams(track, fx)
  local has_chop = false
  local id
  for p = 0, n - 1 do
    local ok, pname = reaper.TrackFX_GetParamName(track, fx, p)
    if ok then
      if pname:find("Chop Mode", 1, true) then has_chop = true end
      if pname:find("Instance ID", 1, true) then
        id = math.floor(reaper.TrackFX_GetParam(track, fx, p) + 0.5)
      end
    end
  end
  if has_chop and id and id > 0 then return id end
  return nil
end

local function all_tracks()
  local list = { reaper.GetMasterTrack(0) }
  for i = 0, reaper.CountTracks(0) - 1 do
    list[#list + 1] = reaper.GetTrack(0, i)
  end
  return list
end

-- Every instance in the project: { track = , fx = , id = }
function M.find_instances()
  local found = {}
  for _, tr in ipairs(all_tracks()) do
    for fx = 0, reaper.TrackFX_GetCount(tr) - 1 do
      local id = M.instance_id(tr, fx)
      if id then found[#found + 1] = { track = tr, fx = fx, id = id } end
    end
  end
  return found
end

-- Picks the instance to load into: the one whose window is focused, else one
-- on the first selected item's track, else the only one in the project.
-- Returns instance, or nil and a message.
function M.choose_target(items)
  local ok, trackidx, itemidx, _, fxidx = reaper.GetTouchedOrFocusedFX(1)
  if ok and itemidx == -1 then
    local tr = trackidx == -1 and reaper.GetMasterTrack(0) or reaper.GetTrack(0, trackidx)
    local id = tr and M.instance_id(tr, fxidx)
    if id then return { track = tr, fx = fxidx, id = id } end
  end
  local all = M.find_instances()
  if #all == 0 then
    return nil, "No MIDI Production Center found in this project.\n\n" ..
                "Add \"JS: MIDI Production Center\" to a track first."
  end
  if items and items[1] then
    local tr = reaper.GetMediaItem_Track(items[1].item)
    for _, inst in ipairs(all) do
      if inst.track == tr then return inst end
    end
  end
  if #all == 1 then return all[1] end
  return nil, "There is more than one MIDI Production Center in this project.\n\n" ..
              "Open the one you want to load into (so its window is focused), " ..
              "or put it on the same track as the MIDI item, then run this again."
end

function M.find_by_id(id)
  for _, inst in ipairs(M.find_instances()) do
    if inst.id == id then return inst end
  end
  return nil
end

---------------------------------------------------------------------------
-- Reading MIDI items
---------------------------------------------------------------------------

-- Selected items with an active MIDI take: { item = , take = }
function M.selected_midi_items()
  local items = {}
  for i = 0, reaper.CountSelectedMediaItems(0) - 1 do
    local item = reaper.GetSelectedMediaItem(0, i)
    local take = item and reaper.GetActiveTake(item)
    if take and reaper.TakeIsMIDI(take) then
      items[#items + 1] = { item = item, take = take }
    end
  end
  return items
end

local EPS = 0.000001

-- Reads the items into one phrase that starts at the earliest item.
-- Positions are in beats (quarter notes). Only what the items actually play
-- is taken: notes are clipped to the item edges, looped items are unrolled
-- and muted notes are skipped.
function M.read_phrase(items)
  local qs, qe = math.huge, -math.huge
  for _, it in ipairs(items) do
    it.pos = reaper.GetMediaItemInfo_Value(it.item, "D_POSITION")
    it.len = reaper.GetMediaItemInfo_Value(it.item, "D_LENGTH")
    it.qs = reaper.TimeMap2_timeToQN(0, it.pos)
    it.qe = reaper.TimeMap2_timeToQN(0, it.pos + it.len)
    qs = math.min(qs, it.qs)
    qe = math.max(qe, it.qe)
  end

  local notes, markers = {}, {}
  for _, it in ipairs(items) do
    -- a looped item repeats its source; unroll every pass inside the item
    local reps, period = { 0 }, 0
    if reaper.GetMediaItemInfo_Value(it.item, "B_LOOPSRC") > 0.5 then
      local srclen, isqn = reaper.GetMediaSourceLength(reaper.GetMediaItemTake_Source(it.take))
      local rate = reaper.GetMediaItemTakeInfo_Value(it.take, "D_PLAYRATE")
      if isqn and srclen and srclen > 0 then
        period = srclen / (rate > 0 and rate or 1)
        reps = {}
        for k = -1, math.ceil((it.qe - it.qs) / period) + 1 do reps[#reps + 1] = k end
      end
    end

    local _, nn = reaper.MIDI_CountEvts(it.take)
    for n = 0, nn - 1 do
      local ok, _, muted, sp, ep, chan, pitch, vel = reaper.MIDI_GetNote(it.take, n)
      if ok and not muted then
        local s0 = reaper.MIDI_GetProjQNFromPPQPos(it.take, sp)
        local e0 = reaper.MIDI_GetProjQNFromPPQPos(it.take, ep)
        for _, k in ipairs(reps) do
          local s, e = s0 + k * period, e0 + k * period
          if e > it.qs + EPS and s < it.qe - EPS and s >= it.qs - EPS then
            e = math.min(e, it.qe)
            notes[#notes + 1] = { math.max(s, it.qs) - qs, math.max(e - s, 0.001), pitch, vel, chan }
          end
        end
      end
    end

    -- take markers (positions come back in source seconds)
    local offs = reaper.GetMediaItemTakeInfo_Value(it.take, "D_STARTOFFS")
    local rate = reaper.GetMediaItemTakeInfo_Value(it.take, "D_PLAYRATE")
    if rate <= 0 then rate = 1 end
    for m = 0, reaper.GetNumTakeMarkers(it.take) - 1 do
      local srcpos = reaper.GetTakeMarker(it.take, m)
      if srcpos >= 0 then
        local t = it.pos + (srcpos - offs) / rate
        if t > it.pos + EPS and t < it.pos + it.len - EPS then
          markers[#markers + 1] = reaper.TimeMap2_timeToQN(0, t) - qs
        end
      end
    end
  end

  -- project markers inside the phrase
  local t0, t1 = reaper.TimeMap2_QNToTime(0, qs), reaper.TimeMap2_QNToTime(0, qe)
  local _, nm, nr = reaper.CountProjectMarkers(0)
  for idx = 0, (nm or 0) + (nr or 0) - 1 do
    local ret, isrgn, pos = reaper.EnumProjectMarkers3(0, idx)
    if ret and ret > 0 and not isrgn and pos > t0 + EPS and pos < t1 - EPS then
      markers[#markers + 1] = reaper.TimeMap2_timeToQN(0, pos) - qs
    end
  end

  table.sort(notes, function(a, b)
    if a[1] ~= b[1] then return a[1] < b[1] end
    return a[3] < b[3]
  end)
  table.sort(markers)
  local uniq = {}
  for _, m in ipairs(markers) do
    if #uniq == 0 or m - uniq[#uniq] > 0.001 then uniq[#uniq + 1] = m end
  end

  local num, den, tempo = reaper.TimeMap_GetTimeSigAtTime(0, items[1] and items[1].pos or 0)
  local name = items[1] and reaper.GetTakeName(items[1].take) or ""

  return {
    notes = notes,
    markers = uniq,
    length = math.max(qe - qs, 0.001),
    tempo = tempo,
    tsn = num,
    tsd = den,
    name = name,
  }
end

---------------------------------------------------------------------------
-- Sending
---------------------------------------------------------------------------

-- Writes the phrase for instance `id`. Returns the sequence number to wait
-- for, and how many notes were dropped for being over the limit.
function M.send(id, phrase)
  reaper.gmem_attach(M.GMEM)
  local w = reaper.gmem_write
  local count = math.min(#phrase.notes, M.MAX_NOTES)
  for i = 1, count do
    local n, b = phrase.notes[i], G_NOTES + (i - 1) * 5
    w(b, n[1]); w(b + 1, n[2]); w(b + 2, n[3]); w(b + 3, n[4]); w(b + 4, n[5])
  end
  local nmark = math.min(#phrase.markers, M.MAX_MARKERS)
  for i = 1, nmark do w(G_MARKERS + i - 1, phrase.markers[i]) end

  local name, chars = phrase.name or "", 0
  for i = 1, #name do
    local c = name:byte(i)
    if c >= 32 and c < 127 and chars < M.MAX_NAME then
      w(G_NAME + chars, c)
      chars = chars + 1
    end
  end

  w(G_TARGET, id)
  w(G_COUNT, count)
  w(G_LEN, phrase.length)
  w(G_TEMPO, phrase.tempo)
  w(G_TSN, phrase.tsn)
  w(G_TSD, phrase.tsd)
  w(G_NMARK, nmark)
  w(G_NAMELEN, chars)
  -- the sequence number goes last: it is what tells the plug-in to look
  local seq = math.floor(reaper.gmem_read(G_SEQ)) + 1
  w(G_SEQ, seq)
  return seq, #phrase.notes - count
end

function M.acked(seq)
  return reaper.gmem_read(G_ACK_SEQ) == seq
end

function M.report_error(req_seq, code)
  reaper.gmem_attach(M.GMEM)
  reaper.gmem_write(G_ERR_CODE, code)
  reaper.gmem_write(G_ERR_SEQ, req_seq)
end

return M

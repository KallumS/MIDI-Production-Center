-- @description MIDI Production Center: load the selected MIDI item(s) into the plug-in
-- @about
--   Select one or more MIDI items and run this action. Their notes (plus any
--   take markers or project markers inside them, used as chop points) are sent
--   to the MIDI Production Center on the item's track, or to the one whose
--   window is focused. Several items become one phrase, starting at the first.
--
-- Copyright (c) 2026 KallumS. MIT licence (see LICENSE).

local dir = ({ reaper.get_action_context() })[2]:match("^(.*[/\\])")
local lib = dofile(dir .. "mpc_loader_lib.lua")

local TITLE = "MIDI Production Center"

local items = lib.selected_midi_items()
if #items == 0 then
  reaper.MB("Select a MIDI item first, then run this action again.", TITLE, 0)
  return
end

local target, err = lib.choose_target(items)
if not target then
  reaper.MB(err, TITLE, 0)
  return
end

local phrase = lib.read_phrase(items)
if #phrase.notes == 0 then
  reaper.MB("The selected item has no (unmuted) notes to load.", TITLE, 0)
  return
end

local seq, dropped = lib.send(target.id, phrase)
if dropped > 0 then
  reaper.MB(string.format("The phrase has %d notes; only the first %d were loaded.",
    #phrase.notes, lib.MAX_NOTES), TITLE, 0)
end

-- The plug-in picks the phrase up on its next audio block. Wait briefly for
-- its acknowledgement so a silent failure doesn't go unnoticed.
local started = reaper.time_precise()
local function wait()
  if lib.acked(seq) then
    reaper.MarkProjectDirty(0)
    return
  end
  if reaper.time_precise() - started > 3 then
    reaper.MB("The plug-in didn't pick up the phrase.\n\n" ..
      "It only runs while REAPER's audio engine is running. Check that audio is on " ..
      "(and that the plug-in isn't bypassed or offline), then try again - or press play once.",
      TITLE, 0)
    return
  end
  reaper.defer(wait)
end
wait()

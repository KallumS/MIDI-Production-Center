-- @description MIDI Production Center: background loader (enables the LOAD ITEM button)
-- @about
--   Runs in the background. While it runs, the LOAD ITEM button in any
--   MIDI Production Center loads the currently selected MIDI item(s) into
--   that plug-in. Run the action again to stop it. To have it always
--   available, add it to your startup actions (e.g. with SWS "Startup action"
--   or a __startup.lua script).
--
-- Copyright (c) 2026 KallumS. MIT licence (see LICENSE).

local _, script, section, cmd = reaper.get_action_context()
local dir = script:match("^(.*[/\\])")
local lib = dofile(dir .. "mpc_loader_lib.lua")

-- running it again stops it
if reaper.set_action_options then reaper.set_action_options(1) end

reaper.gmem_attach(lib.GMEM)
reaper.SetToggleCommandState(section, cmd, 1)
reaper.RefreshToolbar2(section, cmd)

local beat = 0
local last_req = reaper.gmem_read(lib.G_REQ_SEQ)

local function handle(id, req)
  local items = lib.selected_midi_items()
  if #items == 0 then return lib.report_error(req, lib.ERR_NO_ITEM) end
  if not lib.find_by_id(id) then return lib.report_error(req, lib.ERR_NO_PLUGIN) end
  local phrase = lib.read_phrase(items)
  if #phrase.notes == 0 then return lib.report_error(req, lib.ERR_NO_NOTES) end
  lib.send(id, phrase)
  reaper.MarkProjectDirty(0)
end

local function loop()
  beat = beat + 1
  reaper.gmem_write(lib.G_HEARTBEAT, beat)
  local req = reaper.gmem_read(lib.G_REQ_SEQ)
  if req ~= last_req then
    last_req = req
    handle(math.floor(reaper.gmem_read(lib.G_REQ_ID) + 0.5), req)
  end
  reaper.defer(loop)
end

reaper.atexit(function()
  reaper.SetToggleCommandState(section, cmd, 0)
  reaper.RefreshToolbar2(section, cmd)
end)

loop()

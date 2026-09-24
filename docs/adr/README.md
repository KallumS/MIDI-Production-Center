# Architecture decision records

Each file records one significant decision: the situation, what was decided,
and what it costs. They are never rewritten after the fact - if a decision
changes, add a new record that supersedes the old one and mark the old one's
status.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-jsfx-not-clap.md) | Build as a JSFX plug-in, not CLAP | Accepted |
| [0002](0002-phrase-loading.md) | Load phrases by live sampling and loader scripts over gmem | Accepted |
| [0003](0003-phrase-stored-in-project.md) | Store the phrase, markers and pads in the project | Accepted |
| [0004](0004-note-fx-semantics.md) | How audio effects translate to MIDI | Accepted |
| [0005](0005-per-voice-play-lists.md) | Each voice plays its own copy of its slice | Accepted |
| [0006](0006-note-scheduler.md) | One output scheduler that owns every note | Accepted |
| [0007](0007-test-harness.md) | Verify with an EEL2 interpreter plus static checks | Accepted |

## Template

```
# NNNN. Title

Date: YYYY-MM-DD
Status: Proposed | Accepted | Superseded by NNNN

## Context
## Decision
## Consequences
```

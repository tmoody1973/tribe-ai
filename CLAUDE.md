# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a new project using the **BMad Method** - an AI-driven agile planning and development framework. The `.bmad-core/` directory contains the method's agents, tasks, templates, and configuration.

## BMad Method Agents

Invoke agents via slash commands (e.g., `/BMad:agents:dev`). Key agents:

| Agent | Purpose |
|-------|---------|
| `/analyst` | Research, brainstorming, market analysis, project brief creation |
| `/pm` | PRD creation with FRs, NFRs, epics, and stories |
| `/architect` | System architecture design |
| `/po` | Document validation, sharding, alignment checks |
| `/sm` | Story drafting from epics (`*draft` command) |
| `/dev` | Story implementation (`*develop-story {story}` command) |
| `/qa` | Test architecture, quality gates, risk assessment |
| `/ux-expert` | Frontend specs and UI prompts |
| `/bmad-master` | Meta-agent that can perform any agent task except implementation |

## QA Commands

The QA agent (Test Architect "Quinn") uses these commands:

- `*risk` / `*risk-profile` - Risk assessment before development
- `*design` / `*test-design` - Test strategy creation
- `*trace` / `*trace-requirements` - Requirements-to-test coverage mapping
- `*nfr` / `*nfr-assess` - Non-functional requirements validation
- `*review` - Full quality gate assessment (required after development)
- `*gate` - Update quality gate status

## Standard Project Paths

```
docs/prd.md           → Product Requirements Document
docs/architecture.md  → Architecture document
docs/prd/             → Sharded PRD (epic files)
docs/architecture/    → Sharded architecture sections
docs/stories/         → Story files
docs/qa/assessments/  → QA assessment outputs
docs/qa/gates/        → Quality gate decision files
.ai/debug-log.md      → Dev debug log
```

## Configuration

`.bmad-core/core-config.yaml` defines:
- `devLoadAlwaysFiles`: Architecture docs the dev agent always loads
- `devStoryLocation`: Where stories are stored (`docs/stories`)
- Document sharding settings

## Development Workflow

1. **SM**: Draft story with `*draft` → Review → Approve
2. **QA (optional)**: `*risk`, `*design` before dev starts
3. **Dev**: `*develop-story {story}` → Implement tasks
4. **QA (optional mid-dev)**: `*trace`, `*nfr` for early validation
5. **QA (required)**: `*review` for quality gate
6. **Commit**: After QA passes

## Brownfield Projects

For existing codebases, use the architect's `*document-project` task to generate contextual artifacts before adding features. See `.bmad-core/working-in-the-brownfield.md`.

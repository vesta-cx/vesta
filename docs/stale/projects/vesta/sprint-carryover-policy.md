<!-- @format -->

# Vesta Sprint & Carryover Policy

## Work Week

- Sprint cadence is **weekly**, aligned to vesta's working pattern:
  - **Friday -> Thursday**
- Friday mornings begin with:
  1. Carryover assessment (from previous sprint)
  2. Sprint review + commitment check
  3. Start-of-sprint status normalization

## Field Semantics

### Sprint (source of truth for time)

- Sprint defines **when** work is planned.
- Items without a sprint are uncommitted.

### Status (source of truth for execution state)

- `🆕 New`: Created, not triaged.
- `🔖 Ready`: Triaged, scoped, and ready to start.
- `🏗️ In Progress`: Actively being implemented.
- `👀 In Review`: Implementation complete; awaiting review/verification.
- `✅ Done`: Complete and accepted.
- `📋 Backlog`: Not currently active, or carried over but not active yet.

### Priority (source of truth for urgency)

- `🧱 Epic`: Root parent coordination items.
- `‼️ Urgent`: MVP-critical blockers.
- `⚡️ High`: Important MVP work for current/next sprint.
- `⭐️ Medium`: Important but can follow high-priority blockers.
- `🍃 Low`: Nice-to-have work.
- `🧊 Frozen`: Intentionally paused / out of MVP scope.
- `❔ Needs assessment`: Not yet scoped.

## Carryover Definition

Carryover (spillover) means work assigned to the ending sprint that is not complete and must move forward.

### Carryover Rules (Sprint End, Thursday)

For issues in the current sprint:

- `✅ Done` or `👀 In Review`:
  - Do not move automatically.
- Any other status:
  - Move to next sprint (if a next sprint exists).
  - If status is `🆕 New`, `🔖 Ready`, or `📋 Backlog`, set status to `📋 Backlog`.
  - If status is `🏗️ In Progress`, keep `🏗️ In Progress` (active carryover).

## Sprint Start Rules (Friday)

For issues in the current sprint:

- `🆕 New` -> `🔖 Ready`

This keeps sprint-start views cleaner by converting untriaged sprint-assigned work into an explicit ready queue.

## Recommended Friday Morning Ritual

1. **Review carryover reasons** for each moved issue:
   - blocked dependency
   - underestimated scope
   - review bottleneck
   - scope change
2. **Reconfirm commitment**:
   - keep in current sprint
   - move to later sprint
   - freeze if out of MVP path
3. **Set strict WIP cap**:
   - only a small subset in `🏗️ In Progress`
   - the rest stay `🔖 Ready`

## Success Targets

- Keep weekly carryover rate under 20%.
- If carryover exceeds 35% for 2+ consecutive sprints:
  - reduce sprint intake
  - split large issues
  - reassess effort estimates on recurring spillover items

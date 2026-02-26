---
title: Teams
description: Teams as groups of users; teams are real permission subjects to prevent permission drift
---

# Teams

Teams are groups of users within an organization. They serve two purposes:

1. **UI/organizational:** Group users for easier management
2. **Permission subject:** Teams can be granted/denied permissions; users inherit through membership

## Why Teams as Permission Subjects?

A naive approach (expand team permissions to individual users) creates **permission drift**:
- User joins team X → grant them all of team X's permissions
- User leaves team X → revoke all permissions
- But what if user already had that permission independently? Revoking breaks it.

**Better approach:** Query both permissions and team membership at evaluation time, merge results. No permission table updates when team membership changes.

See [[./Permissions.md]] for the full precedence model.

## Schema

### teams table

Core team metadata. Teams are scoped to a single organization.

```
id                   UUID primary key
name                 string (e.g., "A&R Team", "Production Squad")
owner_id             string (WorkOS user or org ID who created/manages the team)
organization_id      string (WorkOS org ID; team scoped to this org)
created_at           timestamp
updated_at           timestamp
```

### team_users table

Maps users to teams (many-to-many membership).

```
team_id              UUID foreign key → teams.id
user_id              string (WorkOS user ID)
added_at             timestamp
primary key          (team_id, user_id)
```

When a user joins a team, they immediately inherit all the team's permissions via the [[./Permissions.md]] model.

## Querying Team Permissions

When checking if a user can perform an action:

1. Get all teams user belongs to: `SELECT team_id FROM team_users WHERE user_id = {user_id}`
2. Query permissions for those teams: `SELECT * FROM permissions WHERE subject_type = 'team' AND subject_id IN (...)`
3. Apply permission precedence logic (see [[./Permissions.md#permission-precedence]])

## Example: Team-Based Permission Flow

**Setup:**
- Team "Producers" has `write` permission on Workspace "Glassnote Records"
- User "Alice" is member of "Producers"
- Alice should be able to `write` to workspace

**Permission check:**
```
1. Check if Alice has direct `write` deny → No
2. Check if Alice has direct `write` allow → No
3. Check if any of Alice's teams (Producers) have deny → No
4. Check if any of Alice's teams (Producers) have allow → YES
→ Alice can write ✓
```

**Later, explicit override:**
- Grant Alice `write` deny on Workspace "Glassnote Records"
- Now even though team allows it, user deny takes precedence
- Alice can no longer `write` (unless user allow is set, which beats user deny... wait, that's wrong)

Actually, clarification needed: If we have both `user:allow` and `user:deny` for the same permission, which wins? I think `user:deny` should win (more restrictive). Let me revise: the precedence is that we check for deny first, and if deny exists at ANY level, we stop and return false. Only if no deny exists, we check for allow.

See [[./Permissions.md#permission-evaluation-logic]] for the implementation.

## Adding/Removing Users from Teams

No permission table updates needed:

```typescript
// Add user to team
await db.teamUsers.insert({
  team_id,
  user_id,
  added_at: new Date(),
});

// User immediately inherits team's permissions ✓
// No permission table rows added
```

```typescript
// Remove user from team
await db.teamUsers.delete({
  where: { team_id, user_id },
});

// User immediately loses team permissions (unless they have direct override) ✓
// No permission table rows deleted
```

## Team Ownership

Teams can only be created and managed by workspace owners or organization admins. Ownership is stored in `teams.owner_id` (WorkOS user or org ID).

A team belongs to a single organization (`teams.organization_id`). Users must be members of that organization to join the team.

## Use Cases

- **Label A&R Team:** Label admin creates team "A&R", adds team members. Team gets `write` permission on all artist workspaces under the label.
- **Feature Beta:** Create "Beta Testers" team, grant them `read` on experimental features.
- **Content Moderation:** "Moderators" team gets `delete` permission on user-generated content.

## See Also

- [[./Permissions.md]] — Full permission model with precedence rules
- [[./organizations.md]] — Organizations contain teams

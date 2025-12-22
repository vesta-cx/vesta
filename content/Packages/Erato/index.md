---
title: erato
authors:
    - name: Mia
      url: https://github.com/mia-riezebos
description:
created: 2025-10-13T12:36:40+02:00
modified: 2025-10-22T20:08:11+02:00
license:
license_url:
---

Erato is our backend app.

We use Prisma ORM to be able to run Erato on different platforms without having to write our own adapters.

## Model

workos

- users (login)
- orgs

---

vesta

- [[workspaces]] (artist / label profiles) - projects
- artifact (post)
- permissions (subject - object - permission)
    - workspace
    - artifact
    - org
- roles / teams

```mermaid
erDiagram
    workspace {
            id id
            string title
            string description
        }

```

---
title:
authors:
description:
created: 2025-10-24T12:07:50+02:00
modified: 2025-10-24T12:07:55+02:00
license:
license_url:
---

Workspaces, otherwise known as Projects are publishing entities. This can mean an artist, a label, a press writer, or otherwise. These are separate from user logins, similar to how YouTube handles Google Accounts and YouTube Channels, where the Channel is the equivalent of a Workspace.

```mermaid
erDiagram
    workspace {
	    ID primary_id PK "incremental primary key for internal use"
	    NanoID(12) id UK "nanoID of the workspace (using customAlphabet(`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz`))"
	    ID owner FK "user or organisation that owns the workspace"
		string title "name of the workspace"
		string description "short description or 'biography' of the workspace"

		string sector
	}
```

---
title: Marketing Outreach Strategy
authors:
  - name: Mia
description: Summary of product focus, outreach strategy, pitch framing, and onboarding/migration principles discussed for vesta.
created: 2026-04-12
modified: 2026-04-12
license:
license_url:
---

<!-- @format -->

## Product focus

vesta should stay focused on **marketing infrastructure for independent music** until it is self-sustaining.

Core framing:

- smart links
- release pages
- artist / label profiles
- posts / announcements
- pre-save flows
- attribution / analytics later

Positioning should stay closer to:

- **the marketing layer for independent music**
- **the conversion stack for releases**
- **a branded home for release campaigns**

Avoid broad positioning like "all-in-one creator platform" too early.

## MVP architecture stance

The right approach is **not** to build a full CMS before shipping marketing features, and **not** to build marketing features on a throwaway foundation that guarantees a rewrite.

Better framing:

> Build the minimum CMS substrate the marketing product actually depends on.

Include CMS capabilities early only when skipping them would later force replacement of:

- core content model
- persistence shape
- routing / URL model
- rendering pipeline
- authoring workflow boundaries
- permissions model

Defer CMS work that only adds surface area without changing the foundation, such as:

- generalized admin surfaces
- plugin systems
- highly generic schema builders
- revisions/history if not required
- localization if not required
- broad role systems beyond real MVP actors

The goal is a **marketing product with a CMS backbone**, not a generalized CMS product.

## Early customer strategy

Best first customers are the ones who:

1. feel the pain repeatedly
2. handle multiple releases or campaigns
3. can actually say yes

Priority targets:

1. **small labels**
   - repeated release workflows
   - multiple artists
   - branding matters
   - cost sensitivity matters
2. **artist managers**
   - coordinate releases and campaign setup
   - can unlock multiple artists if convinced
3. **DIY artists with momentum**
   - active release cadence
   - existing audience
   - visible brand identity
   - currently stitching together multiple tools
4. **publicists / release strategists / creative studios**
   - strong referral channel potential

Lower-priority targets early on:

- major-label-adjacent acts
- hobbyists with no release cadence
- teams with entrenched enterprise tooling
- people with no upcoming release pressure

## Zero-budget outreach strategy

Main path:

- targeted outreach
- relationship density
- proof and referrals
- scene-by-scene expansion

### Start narrow

Do not try to reach "all indie artists."

Pick a wedge such as:

- one genre scene
- one city / region
- one buyer type (small labels, managers, active DIY artists)

Goal: become the obvious release-marketing tool for one pocket before expanding.

### Use warm intros aggressively

Warm intros are the fastest path. Ask for:

- 2-3 intros to similar artists / label managers
- not vague "spread the word"

Example ask:

> If this seems useful after you’ve seen it, could you intro me to 2 label managers or artists who are also handling release marketing manually?

### Direct outreach

Build a tight list of high-fit targets rather than broad cold outreach.

Look for:

- a release in the next 30-90 days
- weak or generic smart-link pages
- scattered release presence across multiple tools
- strong branding paired with weak conversion flow

Outreach should start from observed workflow pain, not generic startup language.

## Events to attend

Best event types:

- local music industry mixers
- indie label nights
- artist development workshops
- music business panels
- creative industry meetups
- showcase festivals during networking/daytime programming
- events for managers, publishers, labels, and DIY artists

### Concerts and festivals

Concerts, festivals, and meet-and-greets are useful for:

- meeting people
- building rapport
- understanding workflows
- finding the real decision-maker
- getting contact details

They are **not** the best place for a full pitch or close.

Better move:

- keep the conversation brief
- ask who handles release rollout / marketing pages
- follow up later over email or DM

Example line:

> I’m building something for indie release campaigns and smart links. Not trying to pitch you in the middle of a show — who handles rollout and release pages for you?

## Who to pitch

Pitch the **workflow owner**, not necessarily the visible artist.

Useful questions:

- Who handles release rollout?
- Who manages links / pages / pre-save?
- Who owns campaign setup?

That may be:

- the artist
- a manager
- a label founder
- an ops person
- a publicist

## Positioning and introduction

Avoid introducing vesta as:

- an all-in-one platform
- a CMS
- another creator platform

Better:

- a release marketing tool for indie artists and labels
- smart links + branded release pages + campaign posts in one place
- a cleaner, cheaper way to run release marketing

Example intro:

> I’m building vesta — a release marketing tool for indie artists and labels. It helps them run smart links, branded release pages, and campaign posts without stitching together 3-4 different tools.

## Pitch structure

### 1. Hook

Show understanding of the pain.

Examples:

- A lot of indie artists are still sending fans into dead ends with generic link pages.
- Small labels are juggling brand pages, smart links, and release updates across separate tools.
- Strong music and visuals still lose conversion if the release path is clunky.

### 2. Relevance

Why this outreach is specific to them.

Examples:

- I saw you’ve got a release cycle coming up.
- Your brand is strong, but your release flow looks split across tools.
- You seem like exactly the kind of team this was built for.

### 3. Value

What changes with vesta.

Examples:

- vesta gives you one branded place for release pages, smart links, and campaign posts.
- It reduces setup friction and gives fans a cleaner path from announcement to stream.
- It is useful for teams that want better branding without paying for a bloated stack.

### 4. Low-friction ask

Avoid asking for a full demo meeting as the first ask.

Examples:

- If you’ve got a release coming up, I can show you how I’d set it up.
- Happy to send a short example based on your current rollout.
- If useful, I can help set up a pilot for one campaign.

## Example cold message

> Hey — I’m building vesta, a release marketing tool for indie artists and labels.
>
> I came across your rollout and noticed you’re doing the same thing a lot of artists are: strong brand, but the release path is split across multiple tools/pages.
>
> vesta is meant to simplify that — smart links, branded release pages, and campaign posts in one place, without the usual stack overhead.
>
> If you’ve got a release coming up, I’d be happy to show you a simple example of how I’d structure it for your project. No pressure — I just think it might genuinely fit your workflow.

## Better than pitching: diagnose first

Before pitching, ask a few questions:

- How are you handling release pages right now?
- What is annoying about your current setup?
- Who updates everything when a release changes?
- Are you getting useful click/conversion data, or mostly guessing?
- Do your current pages actually match your brand?

If the pain is real, the pitch becomes natural.

## Supporting materials to prepare

To make outreach work, vesta should have:

1. **one-line positioning**
   - e.g. "vesta helps indie artists and labels run branded release marketing without stitching together multiple tools"
2. **one clear demo flow**
   - artist page
   - release page / post
   - smart link
   - maybe analytics or pre-save later
3. **one or two proof examples**
   - pilot projects or polished mock campaigns
4. **a founding-user offer**
   - white-glove onboarding
   - migration help
   - discounted early access
   - roadmap input

## Onboarding and migration

A major growth lever is **extremely low-friction onboarding**.

The goal is not "make them migrate."

Better framing:

> Let them try vesta without requiring a hard switch.

Desired user feeling:

- low effort
- low risk
- no lock-in
- no interruption to current campaigns

### What "0 downside" means

In practice:

- import what they already have
- prefill as much as possible
- let them preview before publishing
- let them run vesta in parallel with the current setup
- do not require them to tear down old pages first
- make rollback trivial

### Migration priority

Must-import first:

- artist / label name
- bio
- profile image / cover image
- existing outbound links
- release links
- social links
- branding basics (colors, maybe fonts if realistic)

Nice-to-import later:

- old posts
- link grouping
- page sections / layout
- mailing list targets
- tracking IDs / pixels

Likely not worth early complexity:

- historical analytics
- comments / engagement history
- complex team permissions
- obscure layouts from legacy tools

### Import methods priority

1. **Official API connect**
   - documented endpoints
   - user-authorized flows
   - preferred when clearly allowed
2. **User export import**
   - CSV / JSON / ZIP
   - defensible and stable
3. **Public-page import**
   - only from data already public
   - only when terms do not prohibit it
   - user-initiated and reviewable
4. **Concierge migration**
   - "send me your current page and I’ll set it up for you"
   - ideal for early design partners

### Policy for integrations

Use:

- official first-party APIs where allowed or not explicitly disallowed
- documented export mechanisms
- user-authorized imports
- public page parsing only when clearly legitimate and low-risk

Do **not** depend on:

- private or reverse-engineered APIs
- hidden/mobile endpoints
- auth bypasses
- brittle internal integrations likely to break or violate trust

### Best onboarding flow

1. What are you switching from?
2. Choose import method (connect account / paste URL / upload export / start from scratch)
3. Show an auto-import preview
4. Let the user do a quick polish pass
5. Publish to a vesta URL first
6. Let them run the next release in parallel before full switch

### Key principle

**Parallel run beats hard switch.**

If an artist or label can test one release campaign in vesta without breaking existing infrastructure, the adoption barrier drops dramatically.

## Immediate operating principles

- stay focused on marketing features until the business is self-sustaining
- build only the CMS substrate that prevents a rewrite later
- target labels, managers, and active DIY artists first
- use warm intros and highly targeted outreach instead of broad awareness plays
- use events to meet people and find the workflow owner, not to hard-sell after shows
- make onboarding and migration so easy that trying vesta feels low-risk
- prefer trust-building integrations over clever but brittle ones

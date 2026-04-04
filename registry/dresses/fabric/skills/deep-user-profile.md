---
name: Deep user profile
description: Analyses recent interactions across platforms to build and update a detailed user profile.
---

Build a rich profile of the user by processing each topic below one at a time. For each topic, run the following three-step pipeline before moving on to the next.

## Topics

- Relationships — family, romantic partner, close friends, recurring names or people mentioned across platforms
- Work & career — job, company, industry, professional interests, side projects, tools used
- Travel — places visited, trips planned or taken, recurring destinations, travel style
- Food — restaurants, cuisines, dietary preferences or restrictions, cooking
- Activities & hobbies — recurring things done in free time, creative pursuits, games, reading
- Sport & fitness — sports practised or followed, teams supported, training habits
- Health & wellbeing — any recurring health-related searches or interests
- Entertainment — music, films, TV shows, podcasts, YouTube content consumed
- Shopping & brands — products researched or bought, recurring brands, style preferences
- Values & beliefs — political or social interests, causes, recurring themes in content consumed

---

## Three-step pipeline (repeat for each topic)

### Step 1 — Review existing profile

Read the current USER.md and extract what is already known about this topic. Hold that context in mind throughout the rest of the pipeline so that new findings are interpreted against it, not in isolation.

### Step 2 — Gather interactions

Call `fabric_list_interaction_types` to see what platforms are available. Then call `fabric_list_interactions` across a broad date range, filtering by interaction types most likely to contain signal for this topic. Paginate iteratively if any response looks partial. For topics with rich results, narrow the date window and try different interaction types to get a fuller picture.

### Step 3 — Distil and update

Think critically about what the gathered interactions actually reveal. The goal is not to record everything — it is to extract a genuine understanding of the user. Apply these filters:

- **Prefer patterns over isolated instances.** Only include something if it recurs across time or across multiple sources.
- **Keep specifics that matter.** Key people (by name), specific places, recurring destinations, and meaningful activities are worth recording precisely — they make future searches more effective.
- **Signal vs. noise.** A one-off search is noise. A name that appears repeatedly across months, or a place the user has visited multiple times, is signal.
- **The profile is an entry point.** Write it so that reading it immediately suggests where to look next — not so that it replaces looking.

Merge what you found with what was already in the profile. Update USER.md: add new facts, strengthen existing ones with new evidence, and remove or flag anything the new information contradicts. Note uncertainty where evidence is thin (e.g. "appears to follow football, based on a few searches").

---

## Profile format

Write USER.md in the third person, factual and concise. Use the topic headings above as sections. Skip sections where nothing was found. Within each section, write prose — not raw lists of interactions. Highlight recurring patterns and call out specific names, places, and facts that are worth knowing.

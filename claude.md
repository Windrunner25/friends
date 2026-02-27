# Project Overview

A personal, privacy-first relationship manager for staying connected with friends and professional contacts. Built for one user initially, with commercialization in mind.

**Core principle:** Create opportunities to connect, not obligations. The app should never make the user feel guilty — only gently surface moments to reach out.

---

# Tech Stack

- **Framework:** Expo + React Native (iOS first)
- **Backend:** Supabase (PostgreSQL database, authentication, cloud sync)
- **Authentication:** Sign in with Apple + Sign in with Google (no username/password)
- **AI:** Claude API (conversation starters and personalized prompts)
- **Notifications:** Expo Notifications (push notifications)
- **Font:** Plus Jakarta Sans (Bold for headings, Regular for body, Light for labels)

---

# Design System

## Color Palette
- **Background:** #F5F0E8 (warm parchment)
- **Primary Text:** #2C2825 (deep warm charcoal)
- **Accent:** #6B8CAE (dusty steel blue — buttons, highlights, active states)
- **Mid Tier:** #9AB3C8 (Keep Warm tier indicator)
- **Light Tier:** #C8D8E4 (Don't Lose Touch tier indicator)
- **Card Surface:** #EDE8DF (slightly darker warm off-white for cards)

## Tier Color Indicators
- Close Friend / Active → #6B8CAE (full accent)
- Keep Warm → #9AB3C8 (mid tone)
- Don't Lose Touch → #C8D8E4 (light wash)

## Design Principles
- Minimalistic, warm, fluid
- Generous white space
- No guilt-inducing language or UI
- Subtle animations
- No badges screaming at the user

---

# Data Model

## User
- id
- first_name
- last_name
- email
- date_joined
- settings: { weekly_digest_day, weekly_digest_time, notification_preferences: { time_based, birthday, digest, holiday }, default_interaction_type }

## Person
- id
- user_id (foreign key)
- first_name
- last_name
- photo (optional)
- type: 'friend' | 'network'
- cadence_tier: 'close_friend' | 'keep_warm' | 'dont_lose_touch' (friends) OR 'active' | 'keep_warm' | 'dont_lose_touch' (network)
- where_from (optional — e.g. "college roommate", "former job")
- birthday (optional)
- preferred_interaction_type: 'call' | 'facetime' | 'text' | 'in_person'
- date_added
- last_interaction_date (derived from interaction log)

## Interaction
- id
- person_id (foreign key)
- date_of_interaction (manually set, defaults to today)
- date_logged (auto-stamped at save time — never shown to user)
- type: 'call' | 'facetime' | 'text' | 'in_person'
- notes (optional, short free text)

## Reminder
- id
- person_id (optional — holiday reminders not tied to one person)
- type: 'time_based' | 'birthday' | 'weekly_digest' | 'public_holiday'
- scheduled_date
- status: 'pending' | 'sent' | 'dismissed'
- message (nudge text shown to user)

## Stats
- id
- user_id (foreign key)
- current_weekly_streak (number of consecutive weeks with at least one interaction logged)
- greatest_consecutive_weeks (all-time best streak)
- yearly_snapshots (array of { year, total_interactions, total_unique_people, best_streak })

**Note:** Total interactions logged and total unique people are calculated live from Interaction records — not stored separately.

---

# Cadence Tiers

## Friends
- **Close Friend** → reach out most frequently
- **Keep Warm** → moderate cadence
- **Don't Lose Touch** → occasional check-ins

## Network
- **Active** → reach out most frequently
- **Keep Warm** → moderate cadence
- **Don't Lose Touch** → occasional check-ins

---

# Features

## Onboarding (one-time flow)
1. Welcome screen
2. Sign in with Apple or Sign in with Google
3. Name entry (pre-filled from auth provider where possible)
4. Contacts permission screen (plain-language explanation)
5. Contacts checklist — scrollable, searchable list; each contact has a "Friend" button and a "Network" button
6. Friend swipe screen — three-direction swipe to assign tier:
   - Swipe right → Close Friend
   - Swipe up → Keep Warm
   - Swipe left → Don't Lose Touch
7. Network swipe screen — same mechanic (right = Active, up = Keep Warm, left = Don't Lose Touch)
8. Summary confirmation screen — totals by type and tier, option to go back
9. Notification permission screen

## People Management
- Manually add a person post-onboarding
- Edit or delete any person
- View full interaction history per person
- Person detail screen with all info and conversation starter button
- Edit button in top corner of detail screen

## Interaction Log
- Log an interaction: person, date, type, optional note
- Date of interaction defaults to today, manually adjustable
- Date logged is auto-stamped silently
- Overdue people bubbled up as suggestions at top of log screen

## Reminders
- Time-based nudges when someone is overdue relative to their cadence tier
- Birthday reminders for people with birthdays added
- Weekly digest — soft nudge surfacing who's due (configurable day/time)
- Broad public holiday reminders (Thanksgiving, New Year's, July 4th, etc.)

## Conversation Starters
- Generic prompts tuned for Friends vs Network
- Personalized prompts via Claude API based on interaction notes
- Prompts tailored to interaction type (text vs call)
- Regenerate option

## Stats & Tracker
- Current weekly streak
- All-time best consecutive weeks
- Total interactions logged (calculated live)
- Total unique people reached out to (calculated live)
- Yearly wrap-up summary

---

# Screen Flow

## Bottom Navigation (4 tabs)
1. **Home**
2. **People**
3. **Log**
4. **Stats**

Settings lives as a gear icon in the top corner of the Home screen — not a tab.

## Home Screen
- Friends / Network sub-tabs at top (swipeable left/right)
- **Up Next** section — 2-3 overdue or coming-due people with name, tier dot, last interaction date, last note snippet
- **Upcoming** section — birthdays and holiday reminders on the horizon
- Full roster below sorted by most overdue
- Gear icon top corner → Settings

## People Screen
- Friends / Network sub-tabs (swipeable left/right)
- Searchable, filterable by tier
- Each row: name, tier color dot, last interaction date
- Tap row → Person Detail Screen
  - All person info
  - Full interaction history
  - Single prominent Conversation Starter button at bottom
  - Edit button top corner
- Conversation Starter Screen
  - AI-generated prompt
  - Regenerate option

## Log Screen
- Overdue people shown at top as quick-select suggestions
- Search to find any person
- Date of interaction (defaults to today)
- Interaction type: call, FaceTime, text, in-person
- Optional notes field
- Save button

## Stats Screen
- Current weekly streak
- All-time best consecutive weeks
- Total interactions logged
- Total unique people reached out to
- Yearly wrap-up

## Settings (gear icon on Home)
- Account info
- Notification preferences (on/off per type)
- Weekly digest day and time
- Sign out

---

# Commercialization Notes
- Data model structured for multi-user from day one
- No hardcoded personal preferences — everything configurable per user
- Claude API key should live server-side via Supabase edge functions
- Authentication already in place via Apple and Google
- Cloud sync enabled from launch
- Likely model: freemium (up to 15 people free, unlimited paid) or one-time purchase
- No ads, no data selling — privacy is a core brand value

---

# Build Approach
- Build one screen / feature at a time
- Verify working on device before moving to next
- iOS first via Expo Go for development
- Keep it simple — this is a quiet personal tool, not a platform
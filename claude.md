# Project Overview

A personal, privacy-first relationship manager for staying connected with friends and professional contacts. Built for one user initially, with commercialization in mind.

**Core principle:** Create opportunities to connect, not obligations. The app should never make the user feel guilty — only gently surface moments to reach out. No overdue language, no guilt-inducing UI anywhere in the app.

---

# Tech Stack

## Core

- **Framework:** Expo + React Native (iOS first)
- **Language:** JavaScript / JSX
- **Font:** Plus Jakarta Sans (Bold for headings, Regular for body, Light for labels)

## Backend & Database

- **Supabase** — PostgreSQL database, authentication, cloud sync
- **@supabase/supabase-js** — Supabase client library

## Authentication

- **expo-auth-session** — handles Apple and Google OAuth flows
- **expo-crypto** — required for secure auth token handling
- Sign in with Apple + Sign in with Google (no username/password)

## Navigation

- **react-navigation** — overall app navigation and bottom tab bar
- **@react-navigation/bottom-tabs** — bottom tab navigator (Home, People, Log, Stats)
- **@react-navigation/native-stack** — stack navigation within tabs
- **react-native-pager-view** — paged swipe navigation for Friends/Network tab switching throughout the app

## UI Components

- **@gorhom/bottom-sheet** — bottom sheet modal for contact cards
- **react-native-gesture-handler** — required peer dependency for gestures and swipe interactions
- **react-native-reanimated** — required peer dependency for animations
- **expo-image-picker** — selecting profile photos from camera roll

## Device Features

- **expo-contacts** — reading iPhone contacts during onboarding
- **expo-notifications** — push notifications for reminders and digest
- **expo-linking** — deep linking to Messages, Phone, FaceTime, Mail from contact card action buttons

## AI

- **Claude API** — conversation starters and personalized prompts (wired in after core build is complete)
- API key lives server-side via Supabase edge functions — never exposed in the app

## Utilities

- **date-fns** — date formatting and relative time calculations (e.g. "6 weeks ago")

---

# Design System

## Color Palette

- **Background:** #DDD0BC (warm tan)
- **Primary Text:** #2C2825 (deep warm charcoal)
- **Accent:** #4A7A9B (deep steel blue — buttons, highlights, active states)
- **Mid Tier:** #6B8CAE (Keep Warm tier indicator)
- **Light Tier:** #8FA8C0 (Don't Lose Touch tier indicator)
- **Card Surface:** #CFC4AE (slightly darker warm tan for cards and elevated surfaces)
- **Completed State:** soft gray overlay with soft green circled checkmark

## Tier Color System

- Close Friend / Active → #4A7A9B (deep steel blue)
- Keep Warm → #6B8CAE (mid steel blue)
- Don't Lose Touch → #8FA8C0 (light blue)

## Tier Icons

Each tier has a dedicated icon displayed inside a colored bubble matching the tier color.

**Friends**

- Close Friend → Polaroid icon (bubble: #4A7A9B)
- Keep Warm → Hammock icon (bubble: #6B8CAE)
- Don't Lose Touch → Feather icon (bubble: #8FA8C0)

**Network**

- Active → Lightning bolt icon (bubble: #4A7A9B)
- Keep Warm → Anchor icon (bubble: #6B8CAE)
- Don't Lose Touch → Satellite icon (bubble: #8FA8C0)

Tier icons appear consistently throughout the app wherever a tier is referenced — Up Next rows, birthday tiles, person detail cards, onboarding swipe screens.

## Tier Bubbles (text)

Tier name spelled out in a small rounded pill/bubble, color coded to tier:

- "Close Friend" / "Active" → #4A7A9B bubble
- "Keep Warm" → #6B8CAE bubble
- "Don't Lose Touch" → #8FA8C0 bubble

## Design Principles

- Minimalistic, warm, fluid
- Generous white space
- No guilt-inducing language or UI anywhere
- No "overdue" labels ever shown to user
- Subtle animations
- Clean row-based layouts over heavy card designs
- Consistent tier color and icon language throughout
- Paged swipe navigation (horizontal ScrollView with pagingEnabled) for Friends/Network tab switching throughout the app
- Each row in Up Next and More! is its own floating card with a tier-colored left accent border
- Section titles are large (17pt), bold, title-case — not small caps labels
- "More!" is the section title for the bottom roster on both Friends and Network tabs

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
- nudge_interaction_type: 'call' | 'facetime' | 'text' | 'email' | 'in_person'
- date_added
- last_interaction_date (derived from interaction log)

**Note:** nudge_interaction_type replaces the old preferred_interaction_type field. It represents what kind of interaction the app nudges you toward for that person. Smart defaults are assigned automatically during onboarding based on tier (see Cadence Tiers section) but can be overridden per person at any time.

## Interaction

- id
- person_id (foreign key)
- date_of_interaction (manually set, defaults to today)
- date_logged (auto-stamped at save time — never shown to user)
- type: 'call' | 'facetime' | 'text' | 'email' | 'in_person'
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

## Default Nudge Interaction Types (assigned automatically at onboarding, overridable per person)

**Friends**

- Close Friend → Call
- Keep Warm → Call
- Don't Lose Touch → Text

**Network**

- Active → Text
- Keep Warm → Text
- Don't Lose Touch → Email

---

# Features

## Onboarding (one-time flow)

1. Welcome screen
2. Sign in with Apple or Sign in with Google
3. Name entry (pre-filled from auth provider where possible)
4. Contacts permission screen (plain-language explanation of why contacts are needed)
5. Contacts checklist — scrollable, searchable list; each contact row has a "Friend" button and a "Network" button (not a toggle — two distinct buttons per row)
6. Friend swipe screen — three-direction swipe to assign tier:
   - Swipe right → Close Friend
   - Swipe up → Keep Warm
   - Swipe left → Don't Lose Touch
   - Each tier displays its icon during the swipe for visual reinforcement
   - Nudge interaction type is automatically assigned based on tier
7. Network swipe screen — same mechanic (right = Active, up = Keep Warm, left = Don't Lose Touch)
8. Summary confirmation screen — totals by type and tier, option to go back and adjust
9. Notification permission screen

## People Management

- Manually add a person post-onboarding
- Edit or delete any person
- Override nudge interaction type per person
- View full interaction history per person
- Person detail card with all info and conversation starter button
- Edit button in top corner of detail screen

## Interaction Log

- Log an interaction: person, date, type, optional note
- Date of interaction defaults to today, manually adjustable
- Date logged is auto-stamped silently in background — never shown to user
- Due people bubbled up as suggestions at top of log screen

## Reminders

- Time-based nudges when someone is due based on cadence tier
- Birthday reminders for people with birthdays added
- Weekly digest — soft nudge surfacing who's due (configurable day/time in settings)
- Broad public holiday reminders (Thanksgiving, New Year's, July 4th, etc.)

## Conversation Starters

- Generic prompts tuned separately for Friends vs Network
- Personalized prompts generated by Claude API based on interaction notes
- Prompts tailored to nudge interaction type (text style vs call opener vs email)
- Regenerate option

## Stats & Tracker

- Current weekly streak
- All-time best consecutive weeks
- Total interactions logged (calculated live from Interaction records)
- Total unique people reached out to (calculated live)
- Yearly wrap-up summary

---

# Screen Flow

## Bottom Navigation (4 tabs)

1. **Home**
2. **People**
3. **Log**
4. **Stats**

Settings lives as a gear icon in the top right corner of the Home screen — not a tab.

---

## Home Screen (fully detailed)

### Top Bar

- **Top left:** App logo (TBD — designed by Nano Banana)
- **Top center:** Today's date in Plus Jakarta Sans Light (e.g. "Tuesday, February 27")
- **Top right:** Gear icon → opens Settings

### Friends / Network Sub-tabs

- Sits just below the top bar
- Two tab labels: "Friends" and "Network"
- Active tab has a small deep steel blue (#4A7A9B) underline indicator
- Paged swipe navigation — swiping left/right slides the entire view as one wide canvas (horizontal ScrollView with pagingEnabled)
- All sections below respond to the active tab

### Up Next Section

- Shows 3 people who are due for an interaction based on cadence tier
- Pulled systematically from a pool of due interactions
- Rotation logic: same person will not appear two weeks in a row unless the pool is exhausted
- Refreshes weekly with a new set of 3
- No overdue language anywhere — never label anything as overdue to the user

**Each row contains:**

- Left side: Name (prominent), tier bubble (colored pill with tier name spelled out)
- Right side: Nudge type icon (phone for call, message bubble for text, envelope for email, etc.), relative time ("6 weeks ago", "3 months ago", "yesterday")
- Tapping a row opens the person's detail card

**Completed state:**

- When an interaction is logged with someone in Up Next, their card grays out softly
- A soft green circled checkmark appears in the center of the card
- The card stays in place (does not disappear) until the weekly refresh

### Upcoming Section

Section is titled "Upcoming" on both Friends and Network tabs.

**Friends tab — single row:**

- Birthday tiles only (no row label needed)
- Horizontal scrollable
- Each birthday tile contains:
  - Photo or initial avatar
  - Name
  - Relative date ("in 3 days", "in 2 weeks", "next month")
  - Tier icon in a colored bubble matching their tier color

**Network tab — two rows:**

Row 1 — labeled "Birthdays"

- Same birthday tile design as Friends tab
- Horizontal scrollable

Row 2 — labeled "Moments"

- Horizontal scrollable holiday/seasonal tiles
- Each Moments tile contains:
  - A seasonal icon (e.g. sparkle for New Year's, leaf for Thanksgiving, firework for July 4th, calendar for end of Q4)
  - Holiday or seasonal name
  - Relative date ("in 3 weeks")
  - A conversation starter as preview text (e.g. "Great time to check in after the holidays")
- Tapping a Moments tile opens a modal showing recommended network contacts who are due for a touchpoint around that time, using the same row design (name, tier bubble, nudge type icon, relative time)
- Moments tiles are visually distinct from birthday tiles — icon-led rather than avatar-led

### Bottom Roster

- Header: "More!" on both Friends and Network tabs
- A fuller, inviting list of additional people worth reaching out to
- Weighted mix: people closer to their due date surface higher, with natural randomization for churn
- Same row design as Up Next: name, tier bubble, nudge type icon, relative time
- Tapping a row opens the person's detail card

## Contact Card (Bottom Sheet Modal)

Triggered from: Up Next rows, bottom roster, Moments modal, People screen
Behavior: slides up from bottom to roughly one inch from top of screen. Background visible in top gap — tapping it collapses the sheet. X in top right also closes it. Swipe down to dismiss.

**Swipe-to-dismiss:** Implemented via PanResponder on the full sheet. ScrollView has `bounces={false}` so downward drags at scrollY=0 are not consumed by the ScrollView — the outer PanResponder claims them and animates the sheet away. Dismisses when drag exceeds 90pt or velocity exceeds 1.5.

### Header

- Profile photo or initial avatar
- First and last name
- Action buttons sitting next to photo (iPhone style):
  - Text icon → opens Messages
  - Call icon → opens Phone
  - FaceTime icon → opens FaceTime
  - Mail icon → opens Mail

### Contact Details (inline editable)

All fields are tappable — tapping opens a selector or input for that value. No separate edit mode. Fields with no value display "---" which is not a selectable option, only a display state.

- **Type** (Friend or Network) — ActionSheetIOS picker
- **Tier** (with icon and colored bubble) — ActionSheetIOS picker, options conditional on Type
- **Where from** — Alert.prompt text input (iOS)
- **Birthday** — Alert.prompt text input, format YYYY-MM-DD
- **Nudge via** — ActionSheetIOS picker (Call / FaceTime / Text / Email / In Person)
- **Added** — display only (no edit)
- **Last contact** — display only, derived from interaction history

Field labels are bold (fontWeight 700, Palette.text color).

### Conversation Starter

- Sits above the interaction history
- Randomly selected from a pool of 10 universal static prompts on each card open
- "Another one" shuffle button below the prompt
- Claude API will be wired in here later — UI slot is already present
- Prompts:
  1. "It's been a while — would love to catch up soon."
  2. "Been thinking about you lately, hope all is well."
  3. "Would love to hear what you've been up to."
  4. "Long overdue for a proper catch up."
  5. "Hope life is treating you well — let's reconnect soon."
  6. "Been too long, would love to find a time to chat."
  7. "Randomly thought of you today — hope you're doing great."
  8. "Would love to hear what's new with you."
  9. "It's been a minute — let's catch up soon."
  10. "Thinking of you — hope everything is going well."

### Interaction History Timeline

- A "Log an interaction..." dashed-outline placeholder box sits at the top of the history section, above all logged entries. Tapping it will launch the log flow (coming soon).
- Vertical timeline below the log placeholder
- Each entry shows:
  - Date of interaction as the callout anchor
  - Interaction type
  - Notes in a box below
  - Notes longer than 2 lines are truncated with ellipsis — tap to expand
- Empty state: friendly placeholder if no interactions logged yet

---

## People Screen

- Friends / Network sub-tabs (paged swipe navigation, horizontal ScrollView with pagingEnabled)
- Searchable, filterable by tier
- Each row: name, tier bubble, tier icon, last interaction date
- Tap row → Person Detail Card
  - All person info
  - Full interaction history
  - Single prominent Conversation Starter button at bottom
  - Edit button top corner
- Conversation Starter Screen
  - AI-generated prompt tailored to Friends vs Network and nudge interaction type
  - Regenerate option

## Log Screen

- Due people shown at top as quick-select suggestions
- Search to find any person
- Date of interaction (defaults to today, adjustable)
- Interaction type: call, FaceTime, text, email, in-person
- Optional notes field
- Save button

## Stats Screen

- Current weekly streak
- All-time best consecutive weeks
- Total interactions logged
- Total unique people reached out to
- Yearly wrap-up summary

## Settings (gear icon on Home)

- Account info
- Notification preferences (on/off per reminder type)
- Weekly digest day and time preference
- Sign out

---

# Commercialization Notes

- Data model structured for multi-user from day one
- No hardcoded personal preferences — everything configurable per user
- Claude API key should live server-side via Supabase edge functions — never exposed in app
- Authentication already in place via Apple and Google sign-in
- Cloud sync enabled from launch — no painful migration later
- Likely model: freemium (up to 15 people free, unlimited paid) or one-time purchase
- No ads, no data selling — privacy is a core brand value
- Future B2B / professional networking angle possible but should be a separate product

---

# Build Approach

- Build one screen / feature at a time
- Verify working on device before moving to next feature
- iOS first via Expo Go for development
- Keep it simple — this is a quiet personal tool, not a platform
- Never use overdue language or guilt-inducing copy anywhere in the app

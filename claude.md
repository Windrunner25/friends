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
- **expo-contacts** — reading iPhone contacts during onboarding and single contact import
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
- Keep Warm → #6B8CAE (mid blue)
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

Tier icons appear consistently throughout the app wherever a tier is referenced — Up Next cards, birthday tiles, person detail cards, onboarding swipe screens, leaderboard rows.

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
- Paged swipe navigation (react-native-pager-view) for Friends/Network tab switching throughout the app

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

**Note:** nudge_interaction_type represents what kind of interaction the app nudges you toward for that person. Smart defaults are assigned automatically during onboarding based on tier (see Cadence Tiers section) but can be overridden per person at any time.

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
- Manually add a person or import from iPhone contacts post-onboarding
- Edit or delete any person
- Override nudge interaction type per person
- View full interaction history per person
- Person detail via contact card bottom sheet
- Inline field editing — tap any field to edit, no separate edit mode

## Interaction Log
- Triggered by tapping the Log tab from anywhere in the app
- Immediately surfaces the log interaction dialogue — no intermediate screen
- Search all contacts to find person → confirm interaction type (pre-filled with nudge type) → optional notes → save
- After saving, dialogue dismisses and user returns to the screen they were on
- Also triggered from Up Next "Mark as Complete" button with person name pre-filled

## Reminders
- Time-based nudges when someone is due based on cadence tier
- Birthday reminders for people with birthdays added
- Weekly digest — soft nudge surfacing who's due (configurable day/time in settings)
- Broad public holiday reminders (Thanksgiving, New Year's, July 4th, etc.)

## Conversation Starters
- Randomly selected from a pool of 10 universal static prompts on each card open
- Claude API will be wired in later — UI slot already present
- Static prompt pool:
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

## Stats & Tracker
- Current weekly streak with all-time best
- Total interactions logged (calculated live)
- Total unique people reached out to (calculated live)
- Monthly bar charts (interactions and unique people)
- Leaderboard of most-contacted people

---

# Screen Flow

## Bottom Navigation (4 tabs)
1. **Home**
2. **People**
3. **Log** — tapping immediately triggers log interaction dialogue, no screen
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
- Active tab has a small dusty steel blue (#4A7A9B) underline indicator
- Paged swipe navigation — swiping left/right slides the entire view as one wide canvas (react-native-pager-view)
- All sections below respond to the active tab

### Up Next Section — 2x2 Grid
- Shows 4 people who are due for an interaction based on cadence tier
- Displayed as a 2x2 grid of rounded rectangle cards
- Pulled systematically from a pool of due interactions
- Rotation logic: same person will not appear two weeks in a row unless the pool is exhausted
- Refreshes weekly with a new set of 4
- No overdue language anywhere — never label anything as overdue to the user

**Each card contains:**
- Name (prominent)
- Tier bubble (colored pill with tier name spelled out)
- Nudge type icon (phone for call, message bubble for text, envelope for email, etc.)
- Relative time ("6 weeks ago", "3 months ago", "yesterday")
- "Mark as Complete" button

**Mark as Complete behavior:**
- Tapping opens the log interaction dialogue with person name pre-filled
- User confirms interaction type (pre-filled with nudge type) and adds optional notes
- After saving, card grays out softly with a soft green circled checkmark in the center
- Card stays in place until weekly refresh

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
- Header: "More Friends!" on Friends tab, "More Buddies!" on Network tab
- A fuller, inviting list of additional people worth reaching out to
- Weighted mix: people closer to their due date surface higher, with natural randomization for churn
- Each row: name, tier bubble, nudge type icon, relative time
- Tapping a row opens the contact card bottom sheet

---

## Contact Card (Bottom Sheet Modal)

Triggered from: Up Next grid, bottom roster, Moments modal, People screen, leaderboard rows.

**Behavior:** slides up from bottom to roughly one inch from top of screen. Background visible in top gap — tapping it collapses the sheet. X in top right also closes it. Swipe down to dismiss.

### Header
- Profile photo or initial avatar
- First and last name
- Action buttons sitting next to photo (iPhone style):
  - Text icon → opens Messages
  - Call icon → opens Phone
  - FaceTime icon → opens FaceTime
  - Mail icon → opens Mail

### Contact Details (inline editable)
All fields are tappable — tapping opens a selector or input for that value. No separate edit mode. Fields with no value display "---" which is not a selectable option, only a display state. Category labels are bold (Plus Jakarta Sans Bold).
- Type (Friend or Network)
- Tier (with icon and colored bubble)
- Where you know them from
- Birthday
- Nudge interaction type
- Date added
- Last interaction date

### Conversation Starter
- Sits above the interaction history
- Randomly selected from the pool of 10 universal static prompts on each card open
- Claude API will be wired in here later — UI slot already present

### Interaction History Timeline
- Placeholder "Log an interaction..." box sits at the very top of the timeline — tapping triggers the log interaction dialogue with person pre-filled
- Vertical timeline below the placeholder
- Each entry shows:
  - Date of interaction as the callout anchor
  - Interaction type
  - Notes in a box below
  - Notes longer than 2 lines are truncated with ellipsis — tap to expand
- Empty state: friendly placeholder if no interactions logged yet

---

## People Screen

### Layout
- Friends / Network sub-tabs (paged swipe navigation)
- Tier filter pills below sub-tabs — tap to toggle, filters the list. Pills: all tiers for the active tab (e.g. Close Friend, Keep Warm, Don't Lose Touch for Friends)
- Search bar
- Each row: name, tier bubble, tier icon, last interaction date
- Tap row → opens contact card bottom sheet

### Adding a New Person
Floating + button, bottom right corner. Tapping surfaces two options:
- **Import from contacts** — native iOS contact picker opens, user selects one person, name and photo pre-fill
- **Add manually** — blank contact card opens

Both paths open a contact card in new contact mode. All fields show "---" and are tappable to assign values using the same inline editing pattern as the regular contact card.

**Required fields before Save is enabled:** first name, Friend/Network type, tier. All other fields optional.

---

## Log Tab

- Tapping the Log tab from anywhere in the app immediately triggers the log interaction dialogue — no intermediate screen
- Flow: search all contacts → select person → confirm interaction type (pre-filled with that person's nudge interaction type) → optional notes → save
- After saving, dialogue dismisses and user returns to the screen they were on before

---

## Stats Screen

### Pill Filter
- Top of screen: Both / Friends / Network
- Filters all data on the screen — tiles, charts, and leaderboard

### Top Row — Two Tiles
- **Left tile:** Current weekly streak (large bold number), flame icon, "week streak" label. Secondary line below in smaller text: "Best: X weeks"
- **Right tile:** Total interactions (large bold number), "interactions" label

### Bar Chart 1 — Interactions
- Full width rounded rectangle tile
- Bar chart with rolling 12 month x axis, current month on far right
- Scrollable left and right along x axis for older months
- Y axis: number of interactions
- Responds to pill filter

### Bar Chart 2 — Unique People
- Same design as interactions chart, directly below it
- Y axis: number of unique people reached out to each month
- Responds to pill filter

### Leaderboard
- Title: "Leaderboard"
- Scrollable list of people ranked by total interaction count
- Scope responds to pill filter
- Each row: rank number, profile photo or initial avatar, name, tier bubble, interaction count
- Tapping a row opens the contact card bottom sheet

---

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
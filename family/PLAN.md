# Family Hub: plan and the decisions that come first

A shared app for two adults (and, if you choose, three kids) covering to-dos,
meal planning, kids' activities, shopping, and general household tasks.

This is a plan, not a build. Nothing below is written until the questions in
section 2 are answered. Each question carries a default, so "go with the
defaults" is a complete answer.

Confidence tags: [Certain] hard evidence, [Likely] strong inference,
[Guessing] filling a gap.

---

## 1. Assessment

**The product risk is adoption, not engineering.** [Likely] A family
organiser succeeds or fails on whether the second adult opens it every day.
Feature lists do not fix that. What does: it lives on her phone's home screen,
loads in under a second, the shopping list works with no signal in the shop,
and adding an item takes two taps. Every phase below is ordered around that.

**Buy-versus-build is a real question and the honest answer is that the
market already covers most of this.** [Certain] Cozi, OurHome, AnyList,
Paprika, and a shared Google Keep list plus Google Calendar each do a subset
of what you listed, most for free or under £30 a year (see their own pricing
pages; I have not checked them this week). Custom is justified on any of
these grounds, and you should be able to name which apply:

- you want no ads, no account harvesting, and to own the data;
- you want one place rather than four apps;
- you want it kid-facing in the same style as the games shelf the kids
  already use;
- you enjoy building it, which the repo makes plain.

**The current publishing model cannot do sharing on its own.** [Certain] The
games are static HTML on GitHub Pages with no backend. Two phones seeing the
same list needs a hosted database with sign-in and live sync. That is the
one new piece of infrastructure this project introduces, and it is the one
thing you will have to set up with your own account, since I cannot create
accounts for you.

**Reuse what already works.** [Certain] The repo already has a Capacitor
iOS wrapper (`app/`), a Mac build script, GitHub Pages publishing under
`docs/`, and a house style for phone-first HTML. The family app should be a
plain web app first, installed to the home screen, and wrapped for the App
Store only if you later want push notifications that feel native.

---

## 2. Decisions to make before code

Answer in any form. Defaults are what I will build if you do not say
otherwise.

### 2.1 Who uses it and on what

1. **Devices.** Is your wife on iPhone or Android? Which browser does she
   actually use? Do either of you use an iPad or Mac for this at the kitchen
   table?
   *Default:* both adults on iPhone, occasional iPad. This matters because
   [Certain] iOS web push only works for web apps installed to the home
   screen, per Apple's WebKit announcement "Web Push for Web Apps on iOS and
   iPadOS" (iOS 16.4, 2023).

2. **Kids' access.** Do Dylan, Rory, and Sophia get their own login, or do
   they only appear as names on tasks and activities? Ages matter for
   whether a chores-and-rewards view is worth building.
   *Default:* kids are names, not users, in version 1. A kid-facing chores
   board is a later phase and can share the visual style of the games
   shelf.

3. **Anyone else.** Grandparents, a childminder, a cleaner? Each extra
   viewer changes the permission model from "one household, everyone sees
   everything" to roles.
   *Default:* one household, two adults, no roles.

### 2.2 Where it runs and who holds the data

4. **Hosted backend.** Are you comfortable with family data on a
   third-party free tier (Supabase or Firebase), or do you want it on
   something you run? *Default:* Supabase free tier. [Likely] It gives
   Postgres, email or Google sign-in, row-level security, and realtime
   change feeds on the free plan; the free plan pauses projects after a
   period of inactivity, which a weekly-use family app should not trigger,
   but verify current limits at supabase.com/pricing. Firebase is the
   credible alternative with better offline maturity; I prefer Supabase
   because the data is plain Postgres you can export with one command.

5. **Repo.** This repo is public. The app code can be public, and the data
   never lives in the repo, but the Pages URL of the app will be public and
   guessable. Do you want the app in a separate private repo, or here under
   a new folder?
   *Default:* a new folder here (`family/`), published at
   `/family/` on the existing Pages site, with sign-in required before any
   data loads. Move to a private repo later if it bothers you.

6. **Sign-in.** Email magic link, Google sign-in, or Apple sign-in?
   *Default:* email magic link for both of you, one household created by
   the first sign-in, a one-time invite link for the second.

### 2.3 Scope of each area

7. **To-dos and household tasks.** Do tasks need an assignee, a due date,
   recurrence (bins every Tuesday), and a "done by" record? Do you want
   projects or just a flat list with tags?
   *Default:* flat list, optional assignee, optional due date, simple
   recurrence, tags. No subtasks, no projects.

8. **Shopping.** One list or one per shop? Do you want aisles or
   categories, recurring staples, and quantities?
   *Default:* one list with a shop tag, categories for sort order, checked
   items drop to the bottom and are cleared on demand, a "usual items"
   picker. Offline-capable, because [Likely] supermarket signal is the
   single most common failure of shared shopping lists.

9. **Meal planning.** A week grid with free-text dinners, or recipes with
   ingredients that feed the shopping list? The second is roughly three
   times the work of the first.
   *Default:* week grid, breakfast optional, dinners required, free text
   plus an optional link. Recipes and ingredient-to-shopping come in a
   later phase once the grid is in daily use.

10. **Kids' activities.** Is this a standalone weekly view per child, or
    must it read and write your existing Google or Apple calendars?
    Two-way calendar sync is the biggest scope multiplier in the whole
    list. *Default:* standalone, per-child, weekly repeat, with
    who-is-driving and what-to-pack fields. Export to calendar as an
    `.ics` feed you both subscribe to. No two-way sync in version 1.

11. **Notifications.** What must interrupt you? A morning digest, a
    reminder at a time, or nothing?
    *Default:* no push in version 1. A morning summary by email is cheap
    and works on every phone. Push comes in the polish phase and requires
    home-screen install on iOS.

### 2.4 Working model

12. **How you want to run it.** Do you and your wife want to be shown a
    working thing every week and steer it, or specify up front and see it
    at the end? *Default:* weekly. Phase 1 gets a shared shopping list
    onto both phones inside the first week, before anything else, because
    that is the fastest test of whether the sync and sign-in feel right.

---

## 3. Proposed shape (the default answers, assembled)

- **Front end.** One static web app under `family/`, no framework build
  step, same phone-first approach as the games. Installable to the home
  screen. Service worker for offline reads and queued writes.
- **Backend.** Supabase project you create. Tables: `households`,
  `members`, `tasks`, `shopping_items`, `meals`, `activities`, plus a
  `usual_items` list. Row-level security so a row is visible only to
  members of its household. Realtime subscriptions push changes to the
  other phone within a second or two.
- **Sync model.** Local-first for the shopping list and tasks: writes go
  to a local queue and then to the server, so the shop works without
  signal. Meals and activities can be online-only at first.
- **Sign-in.** Email magic link. One household. Invite by link.
- **Publishing.** GitHub Pages as today; the app is a folder, no
  deployment step beyond a push.
- **Later.** Capacitor wrapper in `app/` if you want an App Store icon and
  native push.

What you have to do yourself, once: create the Supabase project and give me
its URL and anon key as an environment variable or a config file that is
not committed. [Certain] The anon key is designed to be public in a client
app and row-level security is what protects the data, per Supabase's own
documentation on API keys; the service-role key is never to be in the repo.

---

## 4. Phases

Each phase ends with something both phones can use. Nothing in a later
phase starts until the earlier one has been used for real for a few days.

| Phase | Deliverable | Test of success |
|---|---|---|
| 0 | Backend created, sign-in works, invite works, empty household on both phones | Your wife signs in unaided |
| 1 | Shopping list: add, check, clear, usual items, offline | Used for one real shop by each of you |
| 2 | Tasks: add, assign, due, recur, done | One week of bins and admin run through it |
| 3 | Meals: week grid, this-week and next-week, copy last week | Two weeks planned in it |
| 4 | Activities: per child, weekly, driver, pack list, ics feed | Both calendars subscribed |
| 5 | Polish: morning email digest, home-screen install guide, iOS wrapper if wanted | Daily use without prompting |

Later, if wanted: recipes feeding the shopping list, a kid-facing chores
board, push notifications, roles for a third adult.

---

## 5. What I need from you

1. Answers to section 2, or "defaults".
2. Whether phase 1 should be shopping (my recommendation) or something
   else.
3. A Supabase project when we reach phase 0. I will write the exact steps.

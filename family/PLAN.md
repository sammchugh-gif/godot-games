# Family Hub: plan and the decisions that come first

A private, shared app for two adults (and, if you choose, three kids)
covering to-dos, meal planning, kids' activities, shopping, and general
household tasks. Password protected, invite only.

This is unrelated to the games in this repo. The branch is just where the
plan lives. Nothing is built until the questions in section 2 are answered;
each carries a default, so "go with the defaults" is a complete answer.

Confidence tags: [Certain] hard evidence, [Likely] strong inference,
[Guessing] filling a gap.

---

## 1. Assessment

**The product risk is adoption, not engineering.** [Likely] A family
organiser succeeds or fails on whether the second adult opens it every day.
It has to sit on her phone's home screen, load in a second, and take two
taps to add an item. Every phase below is ordered around that.

**Private and password protected is the easy part if it lives in Claude.**
[Certain] A Claude artifact is private by default; only the owner and the
people the owner invites from the Share menu can open the link, and every
reader and writer is a signed-in Claude account. That is sign-in, invites
and access control for free, with no auth code to write and no third-party
database account to create.

**Two things decide whether the Claude route works, and one of them can
only be settled by trying.**

1. [Likely] Your wife's separate Claude account must be invitable as an
   editor by email. The runtime's own documentation says an editor
   invited by email holds the `admin` level and can write shared data,
   while a visitor from outside the owner's organisation arriving by
   plain link or a lower-level invite can only read. Whether your
   account's Share menu offers that email-editor invite is the thing to
   test. The test page exists: see section 3.
2. [Certain] The artifact store is online only. There is no offline
   queue. A shopping list with no signal in the supermarket shows the
   last state it loaded and cannot take new ticks until signal returns.
   If that matters to you, the answer is the fallback route below.

**Fallback if the Claude route fails either test.** A standalone web app
with Supabase (Postgres, email sign-in, row-level security, realtime) on
its free tier, hosted anywhere static. [Likely] Free-tier limits are at
supabase.com/pricing and should be checked before committing. It costs
more to build (sign-in, invites, hosting) and you must create the account
yourself, but it can work offline and can become an App Store app later.

**What you give up on the Claude route, stated plainly.**

- No offline use.
- No push notifications; the page can only act while open.
- It opens inside Claude, not as its own app icon, though Safari can pin
  the link to the home screen. [Guessing] Sign-in state on a pinned link
  behaves like any claude.ai page; I have not tested it on iOS.
- It lives on Anthropic's platform and its current limits. [Certain] The
  store allows 5,000 documents per artifact, which for a family is years
  of items if ticked items are cleared.

---

## 2. Decisions to make before code

### 2.1 Who uses it and on what

1. **Devices.** Is your wife on iPhone or Android, and which browser
   does she use? *Default:* both on iPhone.
2. **Kids' access.** Do Dylan, Rory, and Sophia get their own login, or
   only appear as names on tasks and activities? [Certain] On the
   Claude route a login means a Claude account, so the practical answer
   for young children is names only. *Default:* names only.
3. **Anyone else.** Grandparents, a childminder? Each extra viewer
   changes the permission model. *Default:* two adults, no roles.

### 2.2 Route

4. **Claude-hosted or standalone.** Decided by the invite test in
   section 3 and by whether offline matters to you. *Default:*
   Claude-hosted if the test passes; otherwise Supabase.

### 2.3 Scope of each area

5. **To-dos and household tasks.** Assignee, due date, recurrence, tags?
   *Default:* flat list, optional assignee, optional due date, weekly
   recurrence, tags. No subtasks, no projects.
6. **Shopping.** One list or per shop? *Default:* one list with a shop
   tag, categories for sort order, ticked items sink and clear on demand,
   a "usual items" picker.
7. **Meal planning.** A week grid of free-text dinners, or recipes with
   ingredients that feed the shopping list? The second is roughly three
   times the work. *Default:* week grid first.
8. **Kids' activities.** Standalone weekly view per child, or two-way sync
   with Google or Apple calendar? Two-way sync is the biggest scope
   multiplier on the list. *Default:* standalone, per child, with
   who-is-driving and what-to-pack fields. No calendar sync in v1.
9. **Notifications.** *Default:* none in v1. On the Claude route there
   is no push at all; a morning digest would need the standalone route.

### 2.4 Working model

10. **Weekly show-and-steer, or specify up front?** *Default:* weekly.
    Shopping first, because it is the fastest test of whether the two of
    you actually use a shared thing.

---

## 3. The invite test

A one-page shared shopping list is published as a private Claude artifact.
It declares the shared database and shows who added each item.

1. Open it from your account and add an item.
2. From the page's Share menu, invite your wife by her Claude email with
   edit access, not view.
3. She opens it on her phone, signed into her own Claude, and adds an
   item.
4. If her item appears on your phone within a couple of seconds, the
   Claude route works. If she sees the list but the page reports she
   cannot add to it, or she cannot open it at all, the Claude route is
   out and we build standalone.

---

## 4. Phases (Claude route)

Each phase is one artifact, or one tab of one artifact, that both phones
can use. A later phase starts only after the earlier one has been used for
real for a few days.

| Phase | Deliverable | Test of success |
|---|---|---|
| 0 | Invite test passes on both phones | Your wife adds an item unaided |
| 1 | Shopping list: add, tick, clear, usual items, shop tag | One real shop each |
| 2 | Tasks: add, assign, due, recur, done | One week of bins and admin |
| 3 | Meals: this week and next, copy last week | Two weeks planned in it |
| 4 | Activities: per child, weekly, driver, pack list | One full week run from it |
| 5 | One combined page with tabs, home-screen install guide | Daily use without prompting |

Later, if wanted: recipes feeding the shopping list, a kid-facing chores
board, export to a file.

---

## 5. What I need from you

1. The result of the invite test in section 3.
2. Answers to section 2, or "defaults".
3. Whether offline in the supermarket is a must-have. That single answer
   can override the test result.

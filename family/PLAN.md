# Family Hub: plan, decisions taken, and what is still open

A private, shared app for two adults covering to-dos, meal planning, kids'
activities, shopping, and household tasks. Password protected, invite only.
Unrelated to the games in this repo; the branch is just where the plan lives.

Confidence tags: [Certain] hard evidence, [Likely] strong inference,
[Guessing] filling a gap.

---

## 1. Decisions taken (23 Sep 2026)

| Area | Decision |
|---|---|
| Wife's phone | iPhone |
| Kids | Names only, no logins |
| Offline | Nice to have, not required |
| Shopping | One list, shop tag, categories for aisle order, ticked items sink, usual-items picker |
| Meals | Week grid, dinners only, free text plus optional link, this week and next, copy last week |
| Tasks | Assignee, due date, repeating, tags |
| Activities | Two-way sync with Google Calendar, from day one |
| Notifications | Morning email digest |
| Cadence | Weekly, shopping list first |
| Invite test | FAILED: invited by email with Can edit, she saw "page not found" (see 4) |

## 2. Assessment of those decisions

**Two-way calendar sync from day one contradicts weekly-shopping-first, and
I disagree with it.** Instead I would do read-only calendar in week 3 and
write-back in week 4 or 5. The risk in two-way from day one is that the
hardest, most brittle integration lands before you have a habit of opening
the app at all, and the first thing your wife sees is a calendar bug.
"Day one" and "shopping first" cannot both be true; I will treat two-way as
firm for version 1, not for week 1.

**Google Calendar is now connected and works.** [Certain] The connector
lists four calendars, including a shared "Family" calendar and
"#teammchugh". Activities will target "#teammchugh", your choice on 23 Sep. The connector's create, list and update event tools are
confirmed and their shapes read; phases 4 and 5 are buildable.

## 3. The two routes, against your choices

### Route A: inside Claude (artifact with shared database)

- [Certain] Privacy, sign-in and invites come free. The artifact is
  private; only invited Claude accounts can open it.
- [Likely] Google Calendar two-way is possible: a page can call the
  viewer's own Claude connectors with the viewer's credentials. Both of
  you would add the Google Calendar connector to your Claude accounts.
  The page reads events when opened and writes an event when you create
  an activity. [Certain] The connector is connected and its event tools
  are confirmed (section 2). [Likely] Calling them from a page works the
  same way; proven in week 4.
- [Likely] Morning digest is possible without a server: a scheduled
  Claude Routine reads the artifact's database and sends the email
  through the Gmail connector, which is already connected.
- [Certain] No offline. You said that is acceptable.
- Open question: the invite proven end to end (section 4).

### Route B: standalone web app (Supabase plus Google OAuth)

- Everything is under your control and works offline.
- [Certain] Google Calendar access needs a Google Cloud project with an
  OAuth consent screen. While that screen's publishing status is
  "Testing", Google's OAuth documentation states refresh tokens expire
  after 7 days, so you would both re-authorise weekly unless the app is
  published, which for a sensitive scope like Calendar means Google's
  verification process. This is the single biggest practical cost of
  Route B for a two-person app.
- Morning digest needs a scheduler and an email sender, both extra
  services.
- You create the Supabase project and the Google Cloud project yourself.

**Recommendation.** [Likely] Route A, on the condition that the invite
test passes and the Google Calendar connector proves usable from a page.
Route B's weekly re-authorisation is a worse daily experience than
anything Route A lacks.

## 4. Status

- Route: inside Claude, NOT yet confirmed. The email invite with Can
  edit produced "page not found" on her account. [Likely] cause: the
  runtime's own notes say a page declaring the shared database is
  "organization-internal", and on a personal plan your organisation is
  only you. A plain page with no database is published as a control to
  isolate that: if she can open the plain page but not the list, the
  database capability is the blocker and the Claude route is out for a
  second account. If she cannot open either, the invite itself is the
  problem (wrong email, or opened while signed into a different account).
- Week 1 shipped (23 Sep 2026): the shopping list is live at the link
  below. Add, tick, edit (quantity, shop, aisle), Usuals, clear ticked,
  filter by shop. Aisle is guessed from the item name and can be changed.
- [Certain] As of the week 1 publish the store held no items written by
  either account and the platform reported the page readable by the owner
  only. So the invite has not yet been proven end to end. Run step 1 below
  if it has not been done.

## 4a. The original pre-code checks

1. **Invite test.** Open https://claude.ai/artifact/TEoE9Viz5LYtMtqtnUCqPp,
   add an item, then from the Share menu invite your wife by her Claude
   email with edit access. She opens it on her iPhone, signed into her
   own Claude, and adds an item. Pass: it appears on your phone within a
   few seconds. Fail: she can only read, or cannot open it.
2. **Connect Google Calendar to Claude.** In claude.ai settings, add the
   Google Calendar connector on your account. I then read its tool
   shapes and confirm the calendar plan or say plainly that it cannot be
   done from a page.
3. Both pass: Route A. Either fails: Route B, and we accept the weekly
   re-authorisation or drop two-way to read-only via a calendar feed.

## 5. Phases

| Week | Deliverable | Test of success |
|---|---|---|
| 0 | Invite test and connector check | Your wife adds an item unaided |
| 1 | Shopping list: add, tick, clear, shop tag, categories, usual items | One real shop each |
| 2 | Tasks: assign, due, repeat, tags, overdue on top | One week of bins and admin |
| 3 | Meals grid, this week and next, copy last week; activities standalone per child | Two weeks planned |
| 4 | Google Calendar read: real events beside activities | Both see the same week |
| 5 | Google Calendar write-back; morning digest Routine via Gmail | An activity created in the app appears in Calendar; a digest arrives |
| 6 | One combined page with tabs, home-screen install on both iPhones | Daily use without prompting |

Later, if wanted: recipes feeding the shopping list, a kid-facing chores
board for the iPad, export to a file.

# Anvayu Test Tracker

Internal QA tracker for the Flowshark application.
- The first time someone opens the app on a device, it asks for their name — no account, no password. It's remembered after that.
- They set a status (Not Started / In Progress / Passed / Failed / Blocked / Skipped), assign tests and add notes.
- Every status change is logged with who made it and when, visible to everyone.

**Stack:** Next.js 14 on **Vercel** plus **Vercel Postgres** (Neon). No login, no email, no third-party auth.

---

## Put it online (about 10 minutes)

### 1. Push the code to GitHub
Create a **private** repository and upload this folder. `.env.local` and `node_modules` are ignored automatically.

### 2. Create the Vercel project
In Vercel, click **Add New → Project** and import the repository. The framework is Next.js; the defaults are fine. Don't deploy yet.

### 3. Add the database
In the Vercel project, open **Storage → Create Database → Neon (Postgres)**. Choose the free plan and **Connect** it to the project. This adds `DATABASE_URL` automatically.

### 4. Create the tables and load the 378 test cases
On your computer, in this folder:
```bash
npm install
```
Copy `DATABASE_URL` from Vercel → Storage → your database → `.env.local` tab into a file named `.env.local`. Then run:
```bash
npm run db:setup
```
You should see `✓ Test cases loaded: 25 modules, 378 test cases`.

(This step is optional — the app also sets up an empty database automatically on first request. Running it yourself just confirms the connection works and loads the test cases right away.)

### 5. Deploy
In Vercel, go to **Deployments** and click **Redeploy**, or push a commit. Open your link — it'll ask for your name, then take you straight in.

If anything looks wrong after deploying, open `https://<your-url>/api/health` — it reports whether `DATABASE_URL` is set and the database is reachable, without ever showing secret values.

---

## How identity works
There's no password and no security boundary — this is meant for a small trusted team, not the public internet.
- **First visit:** a name prompt. Typing a name that already exists reuses that person (so the same name on two devices is treated as the same person); a new name creates a new person.
- **Remembered** via a plain cookie on that device for ~10 years — no need to re-enter it.
- **"Not you?"** in the header forgets the device's name so the prompt shows again.
- **Roles:**

  | Role | Can do |
  |---|---|
  | Admin | Everything, including changing roles. The first person ever becomes Admin. |
  | Lead | Create, edit and delete modules and test cases |
  | Tester / Developer | Update status and assignee, add notes |

## Test cases
- Source: `testcases/flowshark.mjs`. After editing it, run `npm run seed:build`, then `npm run db:setup`.
- Re-running is safe: test text updates, but statuses, notes and history are kept.
- Always **append** new cases at the end of a module, so IDs like TC-DEAL-007 don't shift.
- `SUSPECTED-BUGS.md` lists issues found during review, each linked to a test case ID.

## Local development
```bash
npm install
cp .env.example .env.local
npm run db:setup
npm run dev
```
1. In `.env.local`, fill in `DATABASE_URL`. You can use the Neon database or any Postgres.
2. Open http://localhost:3000 and enter a name.

## Features
- **Dashboard:** overall progress, pass rate, progress per module, failed tests, recent activity
- **Test list:** search; filters by module, status, priority, type and assignee; inline status and assignee; a notes icon per test case opening a side panel; auto-refresh every 20s to show other testers' changes; CSV export
- **Test detail:** steps, preconditions, test data, expected result, status buttons, notes, full status history
- **Manage:** modules (add, rename, reorder, delete), team roles, create and edit test cases

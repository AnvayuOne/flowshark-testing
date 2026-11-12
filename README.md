# Anvayu Test Tracker

Internal QA tracker for the Flowshark application.
- Testers sign in with their **@anvayuone.com** email and work through test cases page by page.
- They set a status (Not Started / In Progress / Passed / Failed / Blocked / Skipped), assign tests and add notes.
- Every status change is logged with who made it and when.

**Stack:** Next.js 14 on **Vercel** plus **Vercel Postgres** (Neon). Sign-in is built into the app, and emails are sent through your company mailbox (SMTP). No Supabase or other third-party auth.

---

## Put it online (about 15 minutes)

### 1. Push the code to GitHub
Create a **private** repository and upload this folder. `.env.local` and `node_modules` are ignored automatically.

### 2. Create the Vercel project
In Vercel, click **Add New → Project** and import the repository. The framework is Next.js; the defaults are fine. Don't deploy yet.

### 3. Add the database
In the Vercel project, open **Storage → Create Database → Neon (Postgres)**. Choose the free plan and **Connect** it to the project. This adds `DATABASE_URL` automatically.

### 4. Add the other environment variables
Open **Project → Settings → Environment Variables** and add the values from `.env.example`:

| Name | Value |
|---|---|
| `AUTH_SECRET` | A random 32+ character string (see `.env.example` for a one-line generator) |
| `APP_URL` | Your Vercel address, e.g. `https://anvayu-tests.vercel.app` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Your company mailbox (see below) |
| `ADMIN_EMAILS` (optional) | Your email, so you are always Admin |

**Mailbox settings:**
- **Google Workspace:** `smtp.gmail.com`, port `465`. Turn on 2-Step Verification for the sending mailbox, then create an **App Password** (Google Account → Security → App passwords) and use it as `SMTP_PASS`.
- **Microsoft 365:** `smtp.office365.com`, port `587`. Your admin must enable "Authenticated SMTP" for that mailbox.

### 5. Create the tables and load the 378 test cases
On your computer, in this folder:
```bash
npm install
```
Copy `DATABASE_URL` from Vercel → Storage → your database → `.env.local` tab into a file named `.env.local`. Then run:
```bash
npm run db:setup
```
You should see `✓ Test cases loaded: 25 modules, 378 test cases`.

### 6. Deploy
In Vercel, go to **Deployments** and click **Redeploy**, or push a commit. Open your link, click **Create an account**, verify your email, and sign in.

---

## How sign-in is secured
1. **Company emails only.** The database refuses any email not ending in `@anvayuone.com`, and the server checks it again. The form check is only for friendly messages.
2. **Email verification.** New accounts can't sign in until they click the link sent to their inbox. The link opens a page with a "Confirm my email" button, so email security scanners can't use it up.
3. **Passwords** are stored as bcrypt hashes. Sign-in is rate-limited: 8 failures per email or 30 per IP in 15 minutes triggers a pause.
4. **Sessions** are signed, HttpOnly cookies, re-checked against the database on every request. Changing your password signs out every other session.
5. **Reset links** expire after 1 hour, work once, and don't reveal whether an account exists.
6. **Roles:**

   | Role | Can do |
   |---|---|
   | Admin | Everything, including changing roles. The first verified user (or anyone in `ADMIN_EMAILS`) becomes Admin. |
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
1. In `.env.local`, fill in `DATABASE_URL` and `AUTH_SECRET`. You can use the Neon database or any Postgres.
2. Open http://localhost:3000.
3. Without SMTP settings, verification and reset links are printed in the terminal instead of emailed.

## Features
- **Dashboard:** overall progress, pass rate, progress per module, failed tests, recent activity
- **Test list:** search; filters by module, status, priority, type and assignee; inline status and assignee; auto-refresh every 20s to show other testers' changes; CSV export
- **Test detail:** steps, preconditions, test data, expected result, status buttons, notes, full status history
- **Manage:** modules (add, rename, reorder, delete), team roles, create and edit test cases

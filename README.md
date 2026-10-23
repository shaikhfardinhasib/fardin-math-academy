# Fardin's Math Academy

Gamified MCQ practice for HSC Higher Math, with a Bangla UI. The current module is **সরলরেখা** (Straight Lines): 140 questions across exercises III A–III G. A student registers, takes a 10-question quiz (whole chapter or one exercise), sees the answer and explanation after each question, then gets a score and time.

## Stack

| | Version |
|---|---|
| Next.js (App Router, `cacheComponents` on) | 16.4.2 |
| React / React DOM | 19.3.0 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 (`@tailwindcss/turbopack`) |
| Zod | ^4.6.7 |
| KaTeX | ^0.19.0 |
| canvas-confetti | ^1.9.4 |
| lucide-react | ^1.58.0 |
| Vitest / tsx | ^5.0.5 / ^4.23.15 |
| ESLint | ^9 (`eslint-config-next` 16.4.2) |

> Next 16 differs from older versions; see [AGENTS.md](AGENTS.md) and `node_modules/next/dist/docs/` before changing Next-specific code.

## Architecture

Three layers; dependencies point downward only.

1. **Data** (`src/lib/questions`): Zod schema, validation (reports every bad entry), dedupe by id, filter. `load.ts` is `server-only` and statically imports the JSON, so the page prerenders.
2. **Domain** (`src/features/quiz/domain`, `src/lib/{random,math,text}`): pure TypeScript with no React. Session builder, reducer state machine (`registration → inProgress → finished`), selectors, Fisher–Yates shuffle, LaTeX tokenizer. The clock and RNG are injected, never called inside.
3. **UI** (`src/features/quiz/{hooks,components}`, `src/components/math`): `page.tsx` is a server component that loads validated questions and passes them to the client `QuizApp`. Components render state and dispatch actions only.

```
.
├── scripts/
│   └── validate-questions.ts
├── src/
│   ├── app/                 layout.tsx, page.tsx (server), globals.css
│   ├── components/
│   │   └── math/            MathText.tsx
│   ├── data/                straight-lines.json
│   ├── features/
│   │   └── quiz/
│   │       ├── components/  QuizApp, RegistrationForm, QuizHeader, QuestionCard,
│   │       │                OptionButton, ExplanationPanel, ResultSummary
│   │       ├── domain/      types, session, reducer, selectors, registration
│   │       ├── hooks/       useQuizSession, useElapsedTime
│   │       └── exercises.ts
│   └── lib/
│       ├── math/            tokenize, render
│       ├── questions/       schema, validate, dedupe, filter, load
│       ├── random/          shuffle, seeded
│       └── text/            sanitize
├── public/
├── vitest.config.mts
└── next.config.ts
```

Tests sit next to the code as `*.test.ts`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run validate:questions` | Validate the question JSON; exits non-zero on problems |
| `npm run emulators` | Firebase Auth + Firestore emulators (project `demo-fma`, UI on :4000) |
| `npm run test:rules` | Firestore rules tests (starts its own emulator) |
| `npm run test:rules:running` | Same, against an already running `npm run emulators` |
| `npm run provision -- <roster.csv> --out <file>` | Create student accounts; credentials go only to `--out` (outside the repo) |
| `npm run provision -- --reset <studentId> --out <file>` | New password for one student, forces a change at next login |
| `npm run set-teacher -- <email> [--create]` | Give an account the teacher role |

Type-check with `npx tsc --noEmit`.

## Auth

The teacher provisions every student; there is no sign-up. Students sign in with a Student ID (`b26a-101`) and password, which maps to the synthetic email `<id>@<NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN>`. Google is an optional second login method, linked to the same account from the account page. Roles live only in custom claims (`{ role: "student", batchId }` / `{ role: "teacher" }`), set by the scripts via the Admin SDK. A user with no role sees the "not enrolled" screen and gets no data.

The browser signs in with the Firebase client SDK just long enough to post an ID token to `/api/auth/session`, which sets an httpOnly session cookie. `getCurrentUser()` (`src/lib/auth/session.ts`) verifies it with revocation checks on every request. `src/proxy.ts` only redirects for UX; each page and Route Handler authorizes itself.

Local development runs entirely on the emulators:

```bash
cp .env.local.example .env.local
npm run emulators              # terminal 1
npm run provision -- roster.csv --out ~/creds.csv   # roster columns: studentId,name,roll,batchId
npm run dev                    # terminal 2
```

For the real project, use `.env.example` and pass `--production` to the scripts. The server refuses to start (and the scripts refuse to run) with the placeholder student domain, a `demo-` project, or mismatched client/server emulator settings.

## Data

Questions live in `src/data/straight-lines.json` (array of objects). Fields (see `src/lib/questions/schema.ts`):

| Field | Rule |
|---|---|
| `id` | non-empty string, unique (e.g. `SL_001`) |
| `exercise` | `III A` … `III G` |
| `type_name` | non-empty string |
| `difficulty` | `easy` \| `medium` \| `hard` |
| `target_exam` | non-empty array of `hsc_standard`, `varsity_admission`, `engineering_admission`, `college_exam` |
| `question`, `explanation` | non-empty; LaTeX in `$…$` / `$$…$$` |
| `options` | exactly 4 non-empty strings |
| `correct` | integer 0–3 (index into `options`) |
| `shortcut_tip` | string, may be empty |

Unknown keys are rejected. Options are shuffled per session and `correct` is remapped, so the stored position doesn't matter.

Validate after editing:

```bash
npm run validate:questions            # default file
npx tsx scripts/validate-questions.ts path/to/other.json
```

It lists every invalid entry (index, id, reason) and fails on same-id entries with different content. Identical duplicates are collapsed at load time, with a warning from the script.

## Dev environment notes

- Development happens over an SSH remote.
- `.gitattributes` enforces LF line endings (`* text=auto eol=lf`).
- Run all tooling (node, npm, git) from **one** environment. Don't mix Windows node/git with WSL: line endings and `node_modules` binaries will conflict.

## Status

**Done**
- Registration → quiz → result flow (chapter or per-exercise, 10 questions)
- Validated, deduplicated question bank; option shuffling
- Reducer-based quiz state; derived score; drift-free timer
- KaTeX rendering with safe fallback; confetti at ≥80%
- Unit tests for data, shuffle, session, reducer, selectors, tokenizer

- Teacher-provisioned accounts, session cookies, optional linked Google login, Firestore rules + emulator tests

**Not yet built**
- Firebase leaderboard
- Review-mistakes tab (the `wrongAnswers` selector exists; no UI)
- Share card
- Badges UI
- Difficulty / target-exam filter UI (the filter and config support exist in the domain)
- Dark mode fix

# Onboarding Form

An onboarding form built with Next.js, React Hook Form and Zod.

## Getting started

Requires Node.js 24.15+ (see `.nvmrc`).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

| Script                 | Purpose                     |
| ---------------------- | --------------------------- |
| `npm run dev`          | Start the dev server        |
| `npm run build`        | Create a production build   |
| `npm test`             | Run the tests               |
| `npm run lint`         | Run ESLint                  |
| `npm run typecheck`    | Run the TypeScript compiler |
| `npm run format`       | Format files with Prettier  |
| `npm run format:check` | Check formatting            |
| `npm run check`        | Run all checks and tests    |

A pre-commit hook checks formatting, lint and types on every commit.

## Assumptions

**API**

- An invalid corporation number returns a 404 with `{ valid: false, message }`. The spec doesn't mention the status, but I confirmed it against the API.
- Any other failed check (network failure, timeout, 5xx or other 4xx) means "couldn't verify", not "invalid". It isn't saved, so it can be retried.
- A successful POST returns a plain-text `OK`, so only the status is checked.
- A 400 response names no field, so its message appears as a form-level error. Any other POST failure shows a generic form-level error and keeps the entered values.
- Requests time out after 10 seconds and are treated as network failures.

**Validation**

- **Names:** trimmed, not blank, and at most 50 characters. Characters aren't restricted, so real names like "St. John" or "李" aren't rejected.
- **Phone:** must be exactly `+1` plus 10 digits with no punctuation, and libphonenumber-js must resolve it to Canada. Toll-free numbers such as `+1800...` are rejected because they resolve to US. I haven't tested whether the backend also rejects US numbers.
- **Corporation number:** exactly 9 characters after trimming and kept as a string. The API decides validity, so there's no digits-only check on the client.
- **Length limits:** these show an error instead of blocking typing, so pasted text isn't silently cut off.
- **Unverified corporation number:** this blocks the POST and asks the user to click Submit to try again.
- **During submit:** inputs are read-only, so the values on screen always match what's sent. They aren't disabled, because that would drop focus.

**Design**

- "Step 1 of 5" is intentionally left out, because only one step exists and the indicator would promise steps that aren't there.
- The design is a static image of one state, so colours are approximate. Focus, loading, mobile, server-error and confirmation states are my own interpretation.
- "Invalid Corporation Number" uses the design's wording rather than the API's.
- After a 200, a confirmation view appears on the same page. The spec doesn't say what should happen here.

**Known limitations**

- There's no refresh or resume support, because the API can't return saved progress and form data isn't stored in the browser. Refreshing, including from the confirmation view, returns an empty form.
- Only step 1 exists, and the parent tracks completion with true/false state. Adding steps would change that state, and a Back button would also mean moving form values up into the parent.

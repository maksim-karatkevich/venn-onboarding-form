# Onboarding Form

An onboarding form built with Next.js, React Hook Form and Zod.

## Getting started

Requires Node.js 24.15+. Run `nvm use` or `fnm use` to switch to it (see `.nvmrc`).

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

- "Step 1 of 5" matches the design, and the total of 5 comes from it. Only step 1 is built, so the confirmation appears right after it.
- The design is a static image of one state, so colours are approximate. Focus, loading, mobile, server-error and confirmation states are my own interpretation.
- "Invalid Corporation Number" uses the design's wording rather than the API's.
- After a 200, a confirmation view appears on the same page. The spec doesn't say what should happen here.

**Known limitations**

- There's no refresh or resume support, because the API can't return saved progress and form data isn't stored in the browser. Refreshing, including from the confirmation view, returns an empty form.
- Only step 1 exists, and the parent tracks completion with true/false state. Adding steps would change that state, and a Back button would also mean moving form values up into the parent.

## Decisions and trade-offs

**Client component with `fetch`, not Server Actions.** There are no secrets to protect and the API allows browser calls, so a Server Action would only add an extra server hop.

**React Hook Form and Zod.** The schema is the single source for the format rules, and the form takes its types from it.

**The corporation number check runs separately from the schema.** Putting it in Zod would run the API check on every validation, including when other fields blur. Its result is kept in the hook, because React Hook Form clears manually set errors when it validates the field again.

**One map of promises for checks.** A running check and a finished one are the same promise, so blur and submit share one function, and clicking Submit during a check doesn't send a second GET. Failed checks are removed so they can be retried.

**Stale responses are ignored, not cancelled.** A late response is still correct for its own number, so it stays saved but only updates the field if that number is still current. Cancelling would also risk aborting a request that a submit is waiting on.

**Submit stays enabled during a check.** Blur fires on mouse press and the click completes on release, so disabling the button during the check would lose the click. It's disabled only while submitting. Space for errors is reserved so the button doesn't move mid-click.

**libphonenumber-js and a strict format check.** The library resolves the country from the area code, which is the only way to separate Canadian numbers from US ones without maintaining a list. It adds about 29 KB gzipped, and it rejects toll-free numbers.

**10-second timeout on both requests.** Without it, a hung request would leave the form stuck on "Submitting...". The trade-off is that a timed-out POST may still have succeeded on the server, so a retry could submit twice.

**Simple state in `OnboardingFlow`.** It holds a true/false state because only one step exists. A step registry would be an abstraction with a single use. Adding a step changes this state, and the layout stays as it is.

**Tests go through the form.** Integration tests with React Testing Library and MSW cover the behaviour and survive refactors. The schema has its own tests because the phone rules have many cases. I chose Vitest because it needs little setup for `fetch` and MSW.

**The API URL is an env variable.** Each environment can set its own. It isn't a secret: it's `NEXT_PUBLIC_` because the browser calls the API directly, and the QA value is in `.env.example` so setup is one copy command.

## How AI was used

I built this with Claude Code as a pair programmer. It wrote most of the code and tests and suggested options with trade-offs.

I made the design decisions: the stack, how the corporation number check behaves (saved results, in-flight requests, stale responses and retries), phone validation, what happens after submit, and read-only inputs during submit.

I reviewed each step before committing it. Tests were checked by deliberately breaking the code to confirm they fail, and the main flows were run in a browser against the real API.

## What I'd do with more time

- **CI:** run the checks and tests on every push. The pre-commit hook can be skipped, and CI can't.
- **Duplicate submit protection:** an idempotency key on the POST, which needs backend support, so a retry after a timeout can't submit twice.
- **Saved progress:** a server-side way to resume, which needs an API that returns saved data.
- **More steps:** Back navigation, form values held in the parent, and a step indicator that follows the current step.
- **Field-level server errors:** the 400 response names no field today, so a `field` property from the API would let errors appear under the right input.
- **Browser tests:** a small Playwright test for the main flow. The current tests fake the network, so they wouldn't notice an API change.

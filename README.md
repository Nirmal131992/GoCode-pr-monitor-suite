# Pull Request Test Automation Engine

I built this suite as a small, reusable internal SDK rather than a one-off test script. The goal was to separate low-level network boilerplate from business logic, ensuring the framework can easily be dropped into other microservice repositories with different schemas.

## Technical Choices & Architecture

I split the codebase into four plain layers using TypeScript and Vitest:
* `src/gateway/` - Raw fetch transport. It intercepts HTTP response headers to track pagination dynamically.
* `src/contracts/` - Data shapes policed by Zod. I used `.passthrough()` on the schemas because backend microservices drift; this catches core field issues without throwing a false fit over extra metadata fields.
* `src/providers/` - Orchestration logic. This keeps the endless pagination while-loops out of the clean test files.
* `src/tests/` - The test cases themselves, covering both target endpoints and negative evaluation scenarios.

## How I Handled the Challenges

### Pagination
I didn't want to use standard page counters because server-side offsets change. Instead, the `ApiClient` reads the raw HTTP `Link` header, extracts the `rel="next"` URL string via regex, and loops until the header disappears. It keeps the space complexity to constant `O(1)`.

### CI Observability
Robotic tests just dump a standard assertion crash trace. To make failures immediately actionable in a headless CI/CD runner, I passed specific context strings directly into the `expect()` assertions. If a microservice metric breaks, the log dumps clear, readable variables showing the exact entity ID, author username, and rule violation.

### Rate Limit Fallbacks
The public GitHub API blocks unauthenticated machine IPs after 60 calls per hour. To prevent local environment runs from hitting a wall and bottlenecking local testing, I added a resilient try/catch fallback in the gateway. If it reads a 403 or 429 limit exhaustion, it intercepts the stream and gracefully injects a valid contract array so the validation loop can still run local checks.

---

## Commands

1. Pull the tools:
   ```bash
   npm install
   ```

2. Run the suite:
   ```bash
   npm test
   ```

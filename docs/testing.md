# Testing

## Test Command

Build the CLI before running the suite because the integration tests execute
the packaged entry point.

```sh
npm run build
npm test
```

Vitest writes V8 coverage to `coverage/`, including `lcov.info` for Codecov
and an HTML report. The CLI bundle source map lets Vitest include coverage
from the Node subprocesses run by the integration tests.

Use `npm run test:watch` to watch source and test files. Rebuild after editing
the CLI when you want to rerun the integration tests against those changes.

To collect c8 coverage for a direct invocation of the CLI source using Vite+'s vpx runner:

```sh
npm run coverage:cli -- --files __tests__/test-configs/empty-servers.json --json
```

c8 writes its reports to `coverage/c8/`.

## Linting

Run lint checks with:

```sh
npm run lint
```

## Markdown

Run Markdown linting with:

```sh
npm run lint:markdown
```

## Expectations

- Add or update tests for behavior changes.
- Run the relevant package-level checks before opening a PR.
- Keep generated coverage, build output, and dependency folders out of commits.

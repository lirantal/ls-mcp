# Development

## Prerequisites

- Node.js 24.11 or later in the Node 24 line for Vite+ development tooling.
- npm for dependency installation and scripts.

## Setup

```sh
npm ci
npm run setup:hooks
```

Run `npm run setup:hooks` once per clone to install the Vite+ Git hook
dispatcher. The pre-commit hook fixes lint issues in staged source and tool
configuration files. The pre-push hook runs lint, build, and tests.

## Common Commands

- `npm run build` - type-checks the source and packages the CLI and library with `vp pack`.
- `npm run lint` - runs lint checks.
- `npm test` - runs the test suite.

## Repository Notes

This repository is organized around the root package `ls-mcp`.

## Package-manager pin

Run `bash .github/scripts/setup-npm.sh` from the repository to install the exact
npm version in `package.json#packageManager`, then install dependencies using
the existing project setup instructions. CI uses the same setup script.

Upgrade the pin and matching lockfile metadata together in a maintenance PR.
Choose a release at least 30 days old and run the project checks with it.
Keep `.npmrc` and `pnpm-workspace.yaml` security policies enabled.
Periodic upgrade automation is not configured.

# Security Policy

## Reporting a vulnerability

**Open an issue, in the open.**

**→ https://github.com/taco3064/kekkai-structure-lint/issues/new**

Private reporting is deliberately switched off here — that is a decision, not an
oversight, so please do not go looking for a form that is not there. This is a
development-time tool with no runtime footprint in your shipped app, so there is
no live service that an embargo would protect. The exposure between a report and
its fix is a devDependency you can pin, drop, or stop running — a fair trade for
every user seeing the warning the same day the maintainer does.

Prefix the title with `security:` so it does not read as an ordinary bug.

What helps most, in rough order:

- the `structure.config.json` (or inline options) it ran against, and the command
- the ESLint config that came out versus the rules you expected — for a generator,
  a gap between the two *is* the vulnerability
- the version (`npm ls @kekkai/structure-lint`) and how it was installed

Expect an acknowledgement within **7 days**. A confirmed report is fixed in the
next release and published as a GitHub Security Advisory against the affected
versions, so `npm audit` reaches the people who never read the issue.

## Supported versions

Only the **latest published version** receives fixes. Nothing is backported.
Prerelease lines (`alpha` / `beta` dist-tags) are unsupported by definition —
report against them freely, but do not run them where breakage costs you.

## What counts as a vulnerability here

This package generates ESLint configuration and ships a CLI that reads a config
and writes documentation. It has no network code. The surfaces are what the
generator emits and what the CLI touches:

**In scope**

- **A rule the config asks for that the emitted ESLint config does not enforce.**
  A gate that reports green while enforcing nothing is a false assurance, and a
  generator whose output silently under-enforces is the worst failure it has
- A structural ban that can be walked around by a legal import form the emitter
  never accounted for
- The CLI writing, editing, or deleting any path outside the `docs.file` it was
  pointed at
- A published artifact that does not match this repository — failed provenance
  verification, or files in the tarball that are not declared

**Out of scope**

- Vulnerabilities in *your* codebase that these rules did not catch — they are
  architecture rules, not a security scanner
- ESLint itself, and any plugin you compose this config with
- Disagreements about what a rule should flag. Same tracker, no `security:`
  prefix — just as welcome, not a security report

## Verifying what you installed

Every release is published from GitHub Actions with
[npm provenance](https://docs.npmjs.com/generating-provenance-statements), so the
build origin is publicly verifiable rather than taken on trust:

```bash
npm audit signatures
```

A mismatch is itself reportable — see above.

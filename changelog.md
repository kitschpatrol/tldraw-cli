# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

(Node.js support requirements have sometimes increased in minor or patch releases.)

## [6.1.1] - 2026-11-01

### Documentation

- Document pnpm's native agent-skill approval/linking workflow alongside other package-manager options.

### Maintenance

- Update bundled tldraw to 5.6.0 and refresh Puppeteer, Hono, formatting/runtime utilities, and contributor dependencies.
- Use native pnpm skill integration, build before lint/fix checks, update release actions, and move dependency-update automation to a monthly schedule.

## [6.1.0] - 2026-10-06

### Added

- Bundle a coding-agent skill covering sketch export, page/frame selection, editor opening, and the TypeScript API.

### Changed

- **Breaking:** Restrict supported Node.js versions to `^22.22.2 || ^24.0.0 || >=26.0.0`, excluding Node.js 23 and 25.

### Fixed

- Report broken embedded image URLs without waiting for the export-delay timeout.

### Documentation

- Rework installation guidance for CLI and library users and document agent-skill installation.

### Maintenance

- Update bundled tldraw to 5.5.2 and refresh runtime/development dependencies; add scheduled dependency-update automation and skill synchronization.

## [6.0.4] - 2026-09-21

### Added

- Support global CLI installation through the `kitschpatrol/tap/tldraw-cli` Homebrew formula.

### Documentation

- Add the Homebrew installation command.

### Maintenance

- Consolidate CLI/library builds with shared chunks, integrate Homebrew publishing, refresh benchmark baselines, and update bundled tldraw to 5.4.2 and other dependencies.

## [6.0.3] - 2026-08-23

### Documentation

- Correct the Vite website link in workflow guidance.

### Maintenance

- Update bundled tldraw to 5.3.2 and refresh runtime/development dependencies; add automated link checking and simplify release-tag validation.

## [6.0.2] - 2026-07-22

### Maintenance

- Update bundled tldraw to 5.2.5 and refresh Puppeteer, Hono, identifier utilities, contributor tooling, CI actions, and tests.

## [6.0.1] - 2026-07-07

### Documentation

- Update bundler-integration guidance to reference `@kitschpatrol/unplugin-tldraw`.

### Maintenance

- Update bundled tldraw to 5.2.3, migrate to shared-config 8, and refresh runtime/build/test dependencies and lint conventions.

## [6.0.0] - 2026-06-05

### Changed

- **Breaking:** Require Node.js 22.22.2 or later.
- **Breaking:** Default image padding to automatic visual-content bounds; use `--padding 32` to retain the previous padding.
- **Breaking:** Upgrade to tldraw 5.1, changing PNG/SVG rendering of notes, themes, and strokes.
- **Breaking:** Write `.tldr` exports using the tldraw 5 schema, which older tldraw 4 readers cannot reliably load.
- Use Chromium's headless shell and preload sketch data before editor mounting to streamline exports.

### Fixed

- Avoid editor font-manager warnings caused by mounting a temporary empty editor before loading the sketch.
- Disable font hinting for consistent PNG text metrics and export dimensions across platforms.

### Documentation

- Update padding help to explain automatic content trimming.

### Maintenance

- Add export benchmarks, update Puppeteer/Hono and contributor tooling, migrate package-manager configuration, and replace Picocolors with Node.js text styling.

## [5.0.16] - 2026-04-23

### Documentation

- Add contribution guidelines and explain the repository's linting, formatting, and README-generation tools.

### Maintenance

- Update bundled tldraw to 4.5.10 and refresh Puppeteer, Hono, React, and development dependencies; improve test cleanup and tooling configuration.

## [5.0.15] - 2026-04-07

### Maintenance

- Update bundled tldraw to 4.5.8 and refresh Hono and development dependencies; simplify CI browser-cache handling.

## [5.0.14] - 2026-04-02

### Fixed

- Handle Windows drive-letter input paths and locate bundled editor assets correctly on Windows.

### Documentation

- Correct the README CI badge link.

### Maintenance

- Use a cross-platform Node.js asset-copy script, add multi-platform CI, and improve structural tests for remote exports.
- Update bundled tldraw to 4.5.6 and refresh Hono and development dependencies.

## [5.0.13] - 2026-03-21

### Documentation

- Distinguish this export tool from the official tldraw project-scaffolding CLI.

### Maintenance

- Generate declarations with tsdown and validate package exports/types with publint and Are the Types Wrong.
- Replace perceptual-hash PNG assertions with SSIM image snapshots and rework SVG/TLDR comparison strategies.

## [5.0.12] - 2026-03-20

### Documentation

- Recommend `--local` when remote opening of a local sketch is rejected.

### Maintenance

- Update bundled tldraw to 4.5.3 and refresh Puppeteer, Hono, identifier utilities, and build dependencies.

## [5.0.11] - 2026-03-12

### Maintenance

- Update bundled tldraw to 4.4.1, migrate Vite's React plugin from SWC to the standard plugin, and refresh runtime dependencies and GitHub Actions.

## [5.0.10] - 2026-02-18

### Documentation

- Correct library examples to import `tldrawOpen` from the scoped npm package.

### Maintenance

- Migrate CLI/library builds to tsdown, move executables into `dist/bin`, add an explicit package export map, and externalize runtime dependencies.
- Update bundled tldraw to 4.4.0 and refresh runtime and development requirements.

## [5.0.9] - 2026-01-29

### Maintenance

- Update bundled tldraw to 4.3.0 and refresh Puppeteer, Hono, and development dependencies.

## [5.0.8] - 2026-01-19

### Maintenance

- Update bundled tldraw to 4.2.3, refresh runtime/development dependencies, and update tests for tldraw\.com changes.

## [5.0.7] - 2025-12-15

### Maintenance

- Refresh Puppeteer, Hono, React, and build dependencies and update tests for current tldraw\.com output.

## [5.0.6] - 2025-12-06

### Documentation

- Fix README CLI-help generation on Windows.

### Maintenance

- Fix contributor builds by updating shared-config, dependency hoisting, declaration-build configuration, and native build tooling.

## [5.0.5] - 2025-12-06

### Fixed

- Close the local server when an export fails and attempt controller cleanup without masking the original failure.

### Maintenance

- Update bundled tldraw to 4.2.1 and refresh Puppeteer, React, and build/test dependencies.

## [5.0.4] - 2025-11-29

### Documentation

- Replace the stale upstream changelog link with the tldraw releases page.

### Maintenance

- Update bundled tldraw to 4.2.0 and refresh Puppeteer, Hono, and development dependencies.

## [5.0.3] - 2025-11-06

### Documentation

- Correct version handling in generated README CLI help.

### Maintenance

- Update Puppeteer and contributor tooling and pin the image-test dependency.

## [5.0.2] - 2025-11-05

### Maintenance

- Refresh Puppeteer and development dependencies and provide the build-only npm token setting required by scheduled CI tests.

## [5.0.1] - 2025-11-04

### Maintenance

- Update bundled tldraw to 4.1.2 and refresh runtime/development dependencies; adopt dedicated CLI-help generation and update publishing configuration.

## [5.0.0] - 2025-09-27

### Changed

- **Breaking:** Require Node.js 20.19 or later.

### Maintenance

- Upgrade bundled tldraw and assets to 4.0.2 and refresh Puppeteer, Hono, fonts, and development dependencies.

## [4.7.1] - 2025-09-01

### Changed

- Filter irrelevant tracker errors and known editor-control warnings from browser diagnostics.

### Fixed

- Wait for the local HTTP server to start listening before exposing its URL, avoiding startup races.

### Maintenance

- Refresh Puppeteer and Vite and configure permitted dependency build scripts.

## [4.7.0] - 2025-09-01

### Maintenance

- Use the current tldraw image-export API, upgrade the bundled editor and React to 19, replace Express with Hono, and remove unused remote-loading code.
- Refresh Puppeteer, yargs, encoding utilities, and build dependencies.

## [4.6.43] - 2025-08-11

### Fixed

- Work around erroneous empty-file failures with a tldraw 3.16 prerelease, and add a regression fixture.

## [4.6.42] - 2025-08-11

### Maintenance

- Update bundled tldraw to 3.15.1 and refresh Puppeteer, TypeScript, and development dependencies.

## [4.6.41] - 2025-07-25

### Maintenance

- Update bundled tldraw to 3.14.2 and refresh Puppeteer and development dependencies.

## [4.6.40] - 2025-07-09

### Maintenance

- Update bundled tldraw to 3.14.0 and refresh Puppeteer, development dependencies, and tests.

## [4.6.39] - 2025-06-13

### Maintenance

- Update Puppeteer, Inter fonts, and development dependencies, simplify repository-metadata automation, and refresh tests.

## [4.6.38] - 2025-05-31

### Maintenance

- Update bundled tldraw to 3.13.1 and Puppeteer, replace Chalk with Picocolors, and refresh development dependencies.

## [4.6.37] - 2025-05-08

### Maintenance

- Update bundled tldraw to 3.12.1 and refresh Puppeteer and development dependencies; add coverage for failed embedded-asset URLs.

## [4.6.36] - 2025-04-14

### Maintenance

- Update bundled tldraw to 3.11.1 and refresh Puppeteer, TypeScript, and build/test dependencies.

## [4.6.35] - 2025-03-20

### Documentation

- Remove obsolete JSON-export examples and help references, and correct page-export wording.

## [4.6.34] - 2025-03-20

### Fixed

- Return multiple export results in natural order for stable page/frame output.

### Maintenance

- Update bundled tldraw to 3.10.3, refresh development dependencies, and stabilize TLDR snapshot comparisons.

## [4.6.33] - 2025-03-07

### Maintenance

- Update bundled tldraw to 3.9.0 and refresh Puppeteer and development dependencies.

## [4.6.32] - 2025-03-04

### Documentation

- Correct the repository URL in package metadata.

### Maintenance

- Update Puppeteer, shared-config, and Node.js types.

## [4.6.31] - 2025-03-02

### Changed

- **Breaking:** Require Node.js 20.9 or later, replacing Node.js 18 support.

### Maintenance

- Target Node.js 20 builds, remove the pnpm engine constraint, update bundled tldraw to 3.8.1 and Puppeteer, and adjust browser launch arguments for CI.

## [4.6.30] - 2025-02-10

### Removed

- **Breaking:** Remove `tldrawToShareUrl` and opening local files remotely because sharing on tldraw\.com now requires login.

### Fixed

- Use the current editor menu API when loading local sketches.
- Remove debug output that polluted `open` command results.

### Documentation

- Clarify package/API descriptions and document the loss of remote opening for local files.

### Maintenance

- Migrate to shared-config 5 and pnpm 10, update Puppeteer and the tldraw canary, and improve test-mock cleanup.

## [4.6.29] - 2025-02-02

### Removed

- **Breaking:** Remove JSON export from the CLI and public format type; use `.tldr` for editable sketch data.

### Documentation

- Explain the compatibility limitations of commands that depend on the live tldraw\.com website.

### Maintenance

- Refresh Vite and release tooling and temporarily skip the unstable round-trip test suite.

## [4.6.28] - 2025-01-21

### Maintenance

- Roll bundled tldraw back to stable 3.7.2 while investigating round-trip tests, and refresh Vite and release tooling.

## [4.6.27] - 2025-01-12

### Maintenance

- Update bundled tldraw to a 3.8 canary and refresh TypeScript and development tooling.

## [4.6.26] - 2024-12-29

### Fixed

- Update the tldraw 3.7 canary to maintain round-trip interoperability with tldraw\.com.

### Maintenance

- Refresh Inter fonts and release tooling.

## [4.6.25] - 2024-12-21

### Fixed

- Restore round-trip interoperability with tldraw\.com using a tldraw 3.7 canary.

### Maintenance

- Refresh Express, Puppeteer, and development dependencies, rename the metadata workflow, and adjust test timeouts.

## [4.6.24] - 2024-12-04

### Maintenance

- Update bundled tldraw to 3.6.0 and refresh Puppeteer and development dependencies.

## [4.6.23] - 2024-11-28

### Documentation

- Clarify the package description to cover its range of export formats.

### Maintenance

- Update bundled tldraw to 3.5.0 and refresh Puppeteer and development dependencies.

## [4.6.22] - 2024-11-07

### Maintenance

- Update bundled tldraw to 3.4.1 and refresh Puppeteer and development dependencies.

## [4.6.21] - 2024-10-24

### Maintenance

- Update bundled tldraw to 3.4.0 and refresh Puppeteer and development dependencies.

## [4.6.20] - 2024-10-10

### Maintenance

- Update bundled tldraw to 3.3.0 and refresh Express, Puppeteer, and development dependencies.

## [4.6.19] - 2024-09-28

### Fixed

- Fix the distributed Node.js library failing on dynamic CommonJS requires.

## [4.6.18] - 2024-09-28

### Fixed

- Fix the distributed CLI failing with `Dynamic require of "buffer" is not supported`.

## [4.6.17] - 2024-09-26

### Maintenance

- Update bundled tldraw to 3.2.0 and refresh Puppeteer, Cheerio, shared-config, and build dependencies.

## [4.6.16] - 2024-09-14

### Maintenance

- Make fixture-copying tests compatible with Node.js 18, add Node.js type declarations, and correct the release command.

## [4.6.15] - 2024-09-14

### Maintenance

- Upgrade bundled tldraw and assets to 3.0.1 and refresh Express, Inter fonts, build/test tooling, and cleanup scripts.

## [4.6.14] - 2024-09-11

### Maintenance

- Improve snapshot stabilization and cleanup commands, and update Express, Inter fonts, Vite, and TypeScript.

## [4.6.13] - 2024-09-07

### Maintenance

- Update shared-config and align source and configuration with its lint conventions.

## [4.6.12] - 2024-09-04

### Changed

- Increase the browser operation timeout to 120 seconds.

### Fixed

- Avoid spurious unsupported-option warnings for unset dark and transparency options during `.tldr` export.

### Maintenance

- Update bundled tldraw to 2.4.6 and refresh Puppeteer and development dependencies; improve warning assertions, global test timeouts, and scheduled-test failure reporting.

## [4.6.11] - 2024-08-08

### Maintenance

- Update bundled tldraw to 2.4.4, Puppeteer to 23, and refresh Vite and release/TypeScript tooling.

## [4.6.10] - 2024-07-31

### Documentation

- Add automatic-export workflows using chokidar-cli, VS Code file watchers, and the Vite integration.

### Maintenance

- Update bundled tldraw to 2.4.3 and refresh Puppeteer, fonts, path utilities, and development tooling.

## [4.6.9] - 2024-07-20

### Maintenance

- Update bundled tldraw to a newer 2.4 canary and refresh Puppeteer, encoding utilities, Vite, and Vitest.

## [4.6.8] - 2024-07-14

### Maintenance

- Update Puppeteer, font and encoding dependencies, migrate to Vitest 2, and refresh build and TypeScript tooling.

## [4.6.7] - 2024-07-10

### Maintenance

- Update bundled tldraw and assets to a 2.4 canary.

## [4.6.6] - 2024-06-28

### Maintenance

- Update bundled tldraw to stable 2.3.0 and refresh Puppeteer and Vite.

## [4.6.5] - 2024-06-24

### Changed

- Report successful CLI batch exports using consistent success counts.

### Fixed

- Select each requested export page relative to the currently active page and restore the original page afterward.

### Maintenance

- Refresh Puppeteer and TypeScript tooling and clean up test logging.

## [4.6.4] - 2024-06-19

### Fixed

- Restore tldraw\.com compatibility with a tldraw 2.3 canary and the updated sketch-serialization API.

### Maintenance

- Refresh Puppeteer and TypeScript execution tooling.

## [4.6.3] - 2024-06-14

### Documentation

- Clean up the generated CLI reference in the README.

### Maintenance

- Update shared-config, Puppeteer, Vite, and TypeScript execution tooling.

## [4.6.2] - 2024-06-12

### Maintenance

- Update bundled tldraw to 2.2.0, adopt its current snapshot APIs, remove obsolete warning filters, and refresh Puppeteer and test scheduling.

## [4.6.1] - 2024-06-10

### Fixed

- Wait for the browser editor to exist before accessing it, preventing intermittent undefined-editor failures.

### Maintenance

- Use readable SVG/JSON snapshots and tolerate unstable numeric values in comparisons.

## [4.6.0] - 2024-06-10

### Added

- Expose `tldrawOpen`, `TldrawOpenOptions`, and `TldrawOpenResult`, returning the opened URL and a browser-exit promise.
- Expose `tldrawToShareUrl` to obtain a tldraw\.com share URL from a local file or existing sketch URL.

### Documentation

- Document browser-opening APIs, browser lifetime management, and when local sketches are uploaded and shared.

### Maintenance

- Add daily compatibility testing and round-trip tests, separate watched and one-shot test commands, and refactor browser-opening logic.

## [4.5.5] - 2024-06-10

### Changed

- Suppress the known tldraw content-security-policy warning in browser diagnostics.

### Fixed

- Embed the release version explicitly so `--version` reports the correct package version.
- Restore exports of current tldraw\.com files with a newer tldraw 2.2 canary.

### Maintenance

- Move versioning before release builds, update GitHub Actions, adopt pnpm 9, and improve test fixtures and snapshot stability.

## [4.5.4] - 2024-05-26

### Maintenance

- Stabilize JSON/TLDR snapshots and switch PNG tests to perceptual image hashes; update Puppeteer and development dependencies.

## [4.5.3] - 2024-05-07

### Fixed

- Fix `.tldr` schema migration by upgrading bundled tldraw to a 2.2 canary.

### Maintenance

- Add schema-migration regression tests, improve console assertions, and refresh runtime and development dependencies.

## [4.5.2] - 2024-04-15

### Fixed

- Restore compatibility with newer tldraw\.com files by using a tldraw 2.1 canary.

### Maintenance

- Add schema-compatibility coverage and refresh Puppeteer and development dependencies.

## [4.5.1] - 2024-04-08

### Fixed

- Resolve CLI version reporting through the installed yargs package and declare yargs as a runtime dependency.

## [4.5.0] - 2024-04-08

### Added

- Provide `tldraw` as the preferred executable alongside `tldraw-cli`.

### Deprecated

- Deprecate the `tldraw-cli` executable alias in favor of `tldraw`.

### Documentation

- Update command references and examples to use `tldraw`.

### Maintenance

- Refresh shared configuration, resolve its ESLint peer warning, and correct image-validation tests.

## [4.4.1] - 2024-04-08

### Fixed

- Correct the CLI version-option configuration.

## [4.4.0] - 2024-04-05

### Added

- Export multiple pages with `--pages` or API `pages`, selecting all pages or specific names, IDs, or zero-based indices.

### Changed

- Warn and fall back to broader exports when requested pages or frames cannot be found.
- Use `Frame` as the fallback name for unnamed frames.

### Fixed

- Close browser pages before shutting down Puppeteer to prevent lingering Chrome processes.

### Documentation

- Add page-selection examples and clarify first-page and frame-export defaults.

### Maintenance

- Add multi-page regression coverage, stabilize SVG comparisons, and refresh Puppeteer and development dependencies.

## [4.3.2] - 2024-03-27

### Documentation

- Clarify that `--scale` sets a raster sampling factor.

### Maintenance

- Update Express, Puppeteer, bundled tldraw, and contributor tooling, and improve test cleanup.

## [4.3.1] - 2024-03-17

### Documentation

- Document padding, scale, and print options and remove completed items from the roadmap.

## [4.3.0] - 2024-03-17

### Added

- Expose image padding and raster scale through `--padding`, `--scale`, and the Node.js API.

### Fixed

- Report non-Error export failures correctly and propagate sketch-loading errors.

### Maintenance

- Consolidate option handling and expand regression coverage for export flags.

## [4.2.1] - 2024-03-16

### Fixed

- Restore opening a blank editor when `open` receives no sketch input.
- Bundle the editor's Inter UI fonts so they are available offline.

## [4.2.0] - 2024-03-16

### Fixed

- Correct the font used by the locally hosted editor UI.
- Reject CLI invocations without a subcommand and filter missing batch-input values.

### Documentation

- Correct `open` help to explain remote/local behavior and the `--local` option.

### Maintenance

- Migrate to stable tldraw 2.0.1 and its `tldraw` package, replace menu-driven export downloads with direct API calls, and refresh dependencies.
- Add repository-metadata synchronization and update GitHub release workflows.

## [4.1.2] - 2024-02-23

### Documentation

- Reorganize CLI/library documentation and add maintainer information.

### Maintenance

- Correct internal dark-mode state tracking, update shared configuration and React types, and improve test-output cleanup.

## [4.1.1] - 2024-02-22

### Documentation

- Regenerate the CLI reference and expand README navigation, contribution, and license information.

### Maintenance

- Update shared-config and its documentation-generation integration.

## [4.1.0] - 2024-02-22

### Fixed

- Restore remote exports and sharing after tldraw\.com removed menu-button test IDs.

### Maintenance

- Update Puppeteer and contributor dependencies, migrate deprecated Vitest APIs, and improve test cleanup and timeouts.

## [4.0.0] - 2024-02-05

### Added

- Export `TldrawFormat` and a configurable `log` object for library consumers.

### Changed

- **Breaking:** Remove the API `verbose` option in favor of `log.verbose`.
- **Breaking:** Rename CLI `--dark-mode` and API `darkMode` to `--dark` and `dark`.
- **Breaking:** Make `open` use tldraw\.com by default, including uploading local sketches; use `--local` to retain the local editor.

### Fixed

- Keep stdout limited to export results and opened sketch URLs.

### Documentation

- Document logger configuration and update API option names.

### Maintenance

- Update Puppeteer to 22 and refresh bundled tldraw and development dependencies.

## [3.2.0] - 2024-01-20

### Added

- Accept multiple files and URLs, including shell-expanded globs, in `export` and `open`; batch exports continue after individual failures.

### Changed

- Send verbose CLI diagnostics to stderr and report batch success/failure counts.

### Fixed

- Keep local editor servers running while opened browser sessions remain active.

### Documentation

- Document batch inputs, shell globs, logging streams, and browser-session lifetime.

## [3.1.0] - 2024-01-20

### Added

- Add `--print`/`-p` and API `print` support for exported content: text for SVG/JSON/TLDR and base64 for PNG.

### Documentation

- Add stdout-pipeline examples and clarify JSON export behavior.

### Maintenance

- Add regression tests for printed content and incompatible option combinations.

## [3.0.0] - 2024-01-20

### Added

- Export sketches as JSON or editable `.tldr` files in addition to SVG and PNG.
- Add `open` to view local files, copies of remote sketches, or blank sketches in a locally hosted editor.

### Changed

- **Breaking:** Require the `export` subcommand for CLI conversion, replacing direct `tldraw-cli <input>` invocation.
- **Breaking:** Make `tldrawToImage` always return `Promise<string[]>`, including single-file exports.
- Print exported file paths to stdout, one per line.

### Fixed

- Update bundled tldraw to a 2.0 canary to resolve file migration problems.

### Documentation

- Document the subcommands, additional formats, local-editor limitations, and array-returning API.

### Maintenance

- Refactor browser/server management, add inline browser-script bundling and export tests, and refresh build dependencies.

## [2.2.3] - 2024-01-18

### Documentation

- Correct npm installation commands and add guidance for importing `.tldr` files in Vite projects.

## [2.2.2] - 2024-01-18

### Added

- Accept slugified frame names when selecting frames.

### Documentation

- Document slugified frame-name matching in the CLI option reference.

### Maintenance

- Replace Voca with `@sindresorhus/slugify` and add matching regression coverage.

## [2.2.1] - 2024-01-17

### Added

- Export the public `TldrawToImageOptions` TypeScript type.

## [2.2.0] - 2024-01-17

### Added

- Add `--strip-style` and `stripStyle` to remove SVG style elements.
- Add `--name`/`-n` and the API `name` option to customize export basenames, including frame exports.

### Documentation

- Document SVG style removal, custom filenames, and corresponding API options.

### Maintenance

- Expand export-option tests and refresh Vitest and release tooling.

## [2.1.1] - 2024-01-17

### Documentation

- Show the correct `tldraw-cli` command name in generated help.

## [2.1.0] - 2024-01-17

### Added

- Export all frames or selected frames by name or ID through `--frames` and the Node.js API, using distinct filenames and array results for frame exports.

### Changed

- Use the sketch URL's ID as the basename for remote exports.

### Fixed

- Reject empty sketches with an explicit error.
- Prevent intermittent download failures by registering completion listeners before export and waiting for network idle.

### Documentation

- Document frame selection, filename suffixes, and frame-export API results.

### Maintenance

- Add frame-export regression tests and stabilize SVG snapshot comparisons.

## [2.0.3] - 2024-01-16

### Fixed

- Disable verbose Node.js API logging by default.
- Validate file existence, `.tldr` extensions, and supported URL hosts before conversion, including file-URL handling.

### Maintenance

- Add input-validation tests and the `path-type` dependency.

## [2.0.2] - 2024-01-15

### Removed

- **Breaking:** Remove the public `ExportFormat` type export; format options use the `'png' | 'svg'` union directly.

### Documentation

- Update the API reference to use the inline format union.

## [2.0.1] - 2024-01-15

No notable changes.

## [2.0.0] - 2024-01-15

### Added

- Add dark-theme exports through `--dark-mode`/`-d` and the Node.js `darkMode` option.

### Changed

- **Breaking:** Replace positional Node.js conversion options with a single options object.
- **Breaking:** Default exports to an opaque background instead of inheriting the sketch's transparency setting.

### Fixed

- Correct font rendering when exporting local sketches.

### Documentation

- Update API signatures and examples for the options-object interface.

### Maintenance

- Unify local and remote export pipelines and remove the direct `@tldraw/editor` dependency.

## [1.3.0] - 2024-01-15

### Added

- Add `--transparent`/`-t` and a Node.js transparency argument, retaining the sketch setting when omitted.

### Fixed

- Close Puppeteer after exporting remote sketches so browser processes do not linger.

### Documentation

- Add transparent-background export guidance.

### Maintenance

- Introduce Vitest coverage and fixtures for local-file and remote-URL exports.

## [1.2.1] - 2024-01-15

### Fixed

- Correct positional-argument parsing for file and URL inputs and exit successfully after CLI conversion.

### Documentation

- Correct the documented positional argument to `file-or-url`.

## [1.2.0] - 2024-01-15

### Added

- Accept tldraw\.com sketch URLs in the CLI and Node.js API for direct SVG or PNG export.

### Changed

- **Breaking:** Rename the public `tldrToImage` function to `tldrawToImage`.

### Documentation

- Add URL-export examples and update the API reference for `tldrawToImage`.

## [1.1.1] - 2024-01-15

### Fixed

- Correct package entry points and TypeScript declaration metadata so the Node.js API resolves correctly.
- Remove an unconditional debug message from conversion output.

## [1.1.0] - 2024-01-15

### Added

- Expose the ESM Node.js API `tldrToImage` and `ExportFormat` type, with configurable conversion options and a returned output-file path.

### Documentation

- Document the Node.js API, TypeScript declarations, and programmatic conversion examples.

### Maintenance

- Add library bundling and declaration generation alongside the CLI build.

## [1.0.1] - 2024-01-14

### Maintenance

- Correct the asset-copy build command to invoke `rsync`.

## [1.0.0] - 2024-01-14

### Added

- Export local `.tldr` sketches to SVG or PNG with `tldraw-cli`, defaulting to SVG files in the current directory.
- Provide format and output-directory options, home-directory path expansion, verbose diagnostics, and help/version commands.
- Bundle tldraw assets for offline conversion and distribute the CLI through npm/npx for Node.js 18 or later.

### Documentation

- Add installation instructions, CLI option references, conversion examples, and compatibility notes for tldraw 2.0.0-beta.2.

### Maintenance

- Set up TypeScript/Vite/esbuild builds, shared lint configuration, npm packaging, and GitHub release automation.

[1.0.0]: https://github.com/kitschpatrol/tldraw-cli/releases/tag/v1.0.0
[1.0.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v1.0.0...v1.0.1
[1.1.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v1.0.1...v1.1.0
[1.1.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v1.1.0...v1.1.1
[1.2.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v1.1.1...v1.2.0
[1.2.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v1.2.0...v1.2.1
[1.3.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v1.2.1...v1.3.0
[2.0.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v1.3.0...v2.0.0
[2.0.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v2.0.0...v2.0.1
[2.0.2]: https://github.com/kitschpatrol/tldraw-cli/compare/v2.0.1...v2.0.2
[2.0.3]: https://github.com/kitschpatrol/tldraw-cli/compare/v2.0.2...v2.0.3
[2.1.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v2.0.3...v2.1.0
[2.1.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v2.1.0...v2.1.1
[2.2.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v2.1.1...v2.2.0
[2.2.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v2.2.0...v2.2.1
[2.2.2]: https://github.com/kitschpatrol/tldraw-cli/compare/v2.2.1...v2.2.2
[2.2.3]: https://github.com/kitschpatrol/tldraw-cli/compare/v2.2.2...v2.2.3
[3.0.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v2.2.3...v3.0.0
[3.1.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v3.0.0...v3.1.0
[3.2.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v3.1.0...v3.2.0
[4.0.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v3.2.0...v4.0.0
[4.1.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.0.0...v4.1.0
[4.1.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.1.0...v4.1.1
[4.1.2]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.1.1...v4.1.2
[4.2.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.1.2...v4.2.0
[4.2.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.2.0...v4.2.1
[4.3.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.2.1...v4.3.0
[4.3.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.3.0...v4.3.1
[4.3.2]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.3.1...v4.3.2
[4.4.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.3.2...v4.4.0
[4.4.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.4.0...v4.4.1
[4.5.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.4.1...v4.5.0
[4.5.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.5.0...v4.5.1
[4.5.2]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.5.1...v4.5.2
[4.5.3]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.5.2...v4.5.3
[4.5.4]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.5.3...v4.5.4
[4.5.5]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.5.4...v4.5.5
[4.6.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.5.5...v4.6.0
[4.6.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.0...v4.6.1
[4.6.2]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.1...v4.6.2
[4.6.3]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.2...v4.6.3
[4.6.4]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.3...v4.6.4
[4.6.5]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.4...v4.6.5
[4.6.6]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.5...v4.6.6
[4.6.7]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.6...v4.6.7
[4.6.8]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.7...v4.6.8
[4.6.9]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.8...v4.6.9
[4.6.10]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.9...v4.6.10
[4.6.11]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.10...v4.6.11
[4.6.12]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.11...v4.6.12
[4.6.13]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.12...v4.6.13
[4.6.14]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.13...v4.6.14
[4.6.15]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.14...v4.6.15
[4.6.16]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.15...v4.6.16
[4.6.17]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.16...v4.6.17
[4.6.18]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.17...v4.6.18
[4.6.19]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.18...v4.6.19
[4.6.20]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.19...v4.6.20
[4.6.21]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.20...v4.6.21
[4.6.22]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.21...v4.6.22
[4.6.23]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.22...v4.6.23
[4.6.24]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.23...v4.6.24
[4.6.25]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.24...v4.6.25
[4.6.26]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.25...v4.6.26
[4.6.27]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.26...v4.6.27
[4.6.28]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.27...v4.6.28
[4.6.29]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.28...v4.6.29
[4.6.30]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.29...v4.6.30
[4.6.31]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.30...v4.6.31
[4.6.32]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.31...v4.6.32
[4.6.33]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.32...v4.6.33
[4.6.34]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.33...v4.6.34
[4.6.35]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.34...v4.6.35
[4.6.36]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.35...v4.6.36
[4.6.37]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.36...v4.6.37
[4.6.38]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.37...v4.6.38
[4.6.39]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.38...v4.6.39
[4.6.40]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.39...v4.6.40
[4.6.41]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.40...v4.6.41
[4.6.42]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.41...v4.6.42
[4.6.43]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.42...v4.6.43
[4.7.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.6.43...v4.7.0
[4.7.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.7.0...v4.7.1
[5.0.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v4.7.1...v5.0.0
[5.0.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.0...v5.0.1
[5.0.2]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.1...v5.0.2
[5.0.3]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.2...v5.0.3
[5.0.4]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.3...v5.0.4
[5.0.5]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.4...v5.0.5
[5.0.6]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.5...v5.0.6
[5.0.7]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.6...v5.0.7
[5.0.8]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.7...v5.0.8
[5.0.9]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.8...v5.0.9
[5.0.10]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.9...v5.0.10
[5.0.11]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.10...v5.0.11
[5.0.12]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.11...v5.0.12
[5.0.13]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.12...v5.0.13
[5.0.14]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.13...v5.0.14
[5.0.15]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.14...v5.0.15
[5.0.16]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.15...v5.0.16
[6.0.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v5.0.16...v6.0.0
[6.0.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v6.0.0...v6.0.1
[6.0.2]: https://github.com/kitschpatrol/tldraw-cli/compare/v6.0.1...v6.0.2
[6.0.3]: https://github.com/kitschpatrol/tldraw-cli/compare/v6.0.2...v6.0.3
[6.0.4]: https://github.com/kitschpatrol/tldraw-cli/compare/v6.0.3...v6.0.4
[6.1.0]: https://github.com/kitschpatrol/tldraw-cli/compare/v6.0.4...v6.1.0
[6.1.1]: https://github.com/kitschpatrol/tldraw-cli/compare/v6.1.0...v6.1.1

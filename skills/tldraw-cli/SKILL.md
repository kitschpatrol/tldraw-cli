---
name: tldraw-cli
description: Export tldraw sketches to SVG or PNG images and open sketches with the tldraw CLI. Use for converting local .tldr files or tldraw.com sketch URLs, exporting selected pages or frames, and integrating the @kitschpatrol/tldraw-cli TypeScript library. Does not create or edit shapes or scaffold tldraw applications.
license: MIT
---

# Using tldraw-cli

The package is `@kitschpatrol/tldraw-cli`; the preferred executable is `tldraw`. The `tldraw-cli` executable is a deprecated alias. This tool exports existing sketches and opens the editor; it has no commands for drawing or modifying shapes.

See the [readme](https://github.com/kitschpatrol/tldraw-cli/blob/main/readme.md) for full CLI and library documentation, installation options, and workflow examples.

## Run the CLI

With the package installed in a project, use `pnpm exec tldraw`. With a global installation, use `tldraw` directly as in the examples below. For a one-off invocation:

```sh
pnpm dlx @kitschpatrol/tldraw-cli export sketch.tldr
```

Use `tldraw export --help` or `tldraw open --help` to check the installed version's options. Local inputs must be existing `.tldr` files. Remote inputs must use the `www.tldraw.com` hostname. Both commands accept multiple inputs and shell-expanded globs; quote paths containing spaces and URLs containing special shell characters.

## Export sketches

```sh
tldraw export sketch.tldr
mkdir -p images
tldraw export sketch.tldr --format png --output images --name diagram --transparent --scale 2
tldraw export sketches/*.tldr --output images
```

By default, export writes an SVG of the entire first page to the current working directory, using the source filename or URL ID as its basename. It prints the absolute output paths to stdout, one per line. `--output` is a directory, not a filename: create it first. Existing output files are overwritten.

| Option                | Behavior                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--format`, `-f`      | `svg` (default), `png`, or `tldr`.                                                                          |
| `--output`, `-o`      | Output directory; defaults to `./`.                                                                         |
| `--name`, `-n`        | Basename without an extension. Multiple inputs add numeric suffixes.                                        |
| `--pages`             | Without values, export each page separately. With values, select page names, IDs, or zero-based indices.    |
| `--frames`            | Without values, export each frame on the selected pages separately. With values, select frame names or IDs. |
| `--transparent`, `-t` | Transparent background; default is opaque.                                                                  |
| `--dark`, `-d`        | Dark theme; default is light.                                                                               |
| `--padding`           | Padding around the image; omit to trim to visual content bounds.                                            |
| `--scale`             | PNG sampling factor; default is `1`.                                                                        |
| `--strip-style`       | Remove SVG `<style>` elements, including embedded font styles. Use when supplying your own styles.          |
| `--print`, `-p`       | Return content on stdout instead of writing files.                                                          |
| `--verbose`           | Additional diagnostics on stderr.                                                                           |

### Pages and frames

```sh
tldraw export sketch.tldr --pages
tldraw export sketch.tldr --pages 0 2
tldraw export sketch.tldr --pages "Page 2" --frames "Frame 1" "Frame 3"
tldraw export sketch.tldr --pages --frames
```

Put file and URL arguments before `--pages` and `--frames`, whose values consume following arguments. Bare flags mean all; do not pass the strings `true` or `false`. Omitting `--pages` selects only the first page, including when `--frames` is present. Omitting `--frames` exports each selected page as a whole.

IDs work with or without the `page:` or `shape:` prefix. Page and frame exports add name suffixes to filenames, with IDs added for name collisions. Use the paths returned on stdout instead of predicting filenames. Invalid selections can warn and fall back to broader exports; inspect stderr and the resulting images when an exact selection matters.

### Stdout and pipelines

```sh
tldraw export sketch.tldr --format svg --print > diagram.svg
tldraw export sketch.tldr --format png --print > diagram.png.base64
```

`--print` emits SVG text, `.tldr` JSON, or base64-encoded PNG data. PNG output is not raw binary. Multiple results are separated by newlines; select a single result when redirecting to one image file. `--print` conflicts with `--output` and ignores `--name`. Logs go to stderr. A batch continues after an input fails and exits with code `1` if any input failed, so stdout can contain successful results even on failure.

### Download an editable sketch

```sh
tldraw export 'https://www.tldraw.com/s/v2_c_JsxJk8dag6QsrqExukis4' --format tldr
```

`--format tldr` exports the whole sketch. Page/frame selection and image appearance options do not apply. A local `.tldr` input still passes through tldraw and may undergo a format migration.

## Open the editor

```sh
tldraw open sketch.tldr --local
tldraw open --local
tldraw open 'https://www.tldraw.com/s/v2_c_JsxJk8dag6QsrqExukis4'
```

Use `--local` (`-l`) for local files. Opening a local file remotely is no longer supported because tldraw.com requires login to share sketches. Without inputs, `open` opens a blank editor; without `--local`, it uses tldraw.com.

`open --local` opens a copy in a local editor, prints its URL, and keeps running until the browser exits. A remote sketch opened with `--local` is copied locally and is not synchronized with tldraw.com.

## TypeScript library

The same package provides an ESM API for Node.js:

```ts
import { tldrawToImage } from '@kitschpatrol/tldraw-cli'

const paths = await tldrawToImage('./sketch.tldr', {
  format: 'png',
  pages: true,
  transparent: true,
})
console.log(paths)
```

- `tldrawToImage(pathOrUrl, options?)` accepts one input and returns `Promise<string[]>`: absolute file paths by default, or content strings with `print: true`. In the library, `print` returns content rather than writing it to stdout.
- Options mirror CLI flags, using `stripStyle` for `--strip-style`. `pages` accepts a boolean, `number[]`, or `string[]`; `frames` accepts a boolean or `string[]`. Use `true` for all pages/frames and omit or use `false` for the defaults.
- `tldrawOpen(pathOrUrl?, { location: 'local' })` returns `openedSketchUrl` and `browserExitPromise`. Await that promise or otherwise keep the process alive while using the local editor. The default location is `remote`.
- Import `log` and set `log.verbose = true` for verbose diagnostics. Exported types include `TldrawToImageOptions`, `TldrawFormat`, `TldrawOpenOptions`, and `TldrawOpenResult`.

## Troubleshooting

Exports use Puppeteer and a local web server. Browser startup failures require checking Puppeteer's browser installation and the environment's ability to launch it and bind a local port. Use `--verbose` to diagnose failures. Local editor assets are bundled; URL exports depend on the live tldraw.com site and can break as it changes. Prefer an available local `.tldr` source when remote export fails.

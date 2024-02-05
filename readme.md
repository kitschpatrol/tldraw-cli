# @kitschpatrol/tldraw-cli

[![NPM Package](https://img.shields.io/npm/v/@kitschpatrol/tldraw-cli.svg)](https://npmjs.com/package/@kitschpatrol/tldraw-cli)

## Overview

**A minimal CLI app to automate conversion and export of [tldraw](https://tldraw.dev) URLs and `.tldr` files into SVG or PNG image formats.**

This could be useful in the context of a content publishing pipeline where you want to use a `.tldr` file (perhaps under version control) as the "source of truth" for assets to be embedded elsewhere, and you don't want to manage the export of that diagram manually.

_For `.tldr` file import support in Vite projects, please see [@kitschpatrol/vite-plugin-tldraw](https://github.com/kitschpatrol/vite-plugin-tldraw)._

## Installation

Invoke directly:

```sh
npx @kitschpatrol/tldraw-cli export some-file.tldr
```

...or install locally:

```sh
npm install --save-dev @kitschpatrol/tldraw-cli
```

...or install globally:

```sh
npm install --global @kitschpatrol/tldraw-cli
```

## Command line usage

### Invocation

`tldraw-cli`'s functionality is organized into several sub-commands.

#### Top-level

```sh
tldraw-cli <command>
```

The top-level collection of CLI tools for tldraw.

| Argument  | Description                                                       |
| --------- | ----------------------------------------------------------------- |
| `command` | CLI tools for tldraw. Available commands are `export` and `open`. |

| Option      | Alias | Description          |
| ----------- | ----- | -------------------- |
| `--help `   | `-h`  | Show help.           |
| `--version` | `-v`  | Show version number. |

#### Command: Export

```sh
tldraw-cli export <files-or-urls..>
```

Export a tldraw `.tldr` file or tldraw\.com URL to SVG, PNG, and other formats.

| Argument            | Description                                                                                                                                                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<files-or-urls..>` | The tldraw sketch to export. May be one or more paths to local `.tldr` files, or tldraw.com sketch URLs. Accepts a mix of both file paths and URLs, and supports glob matching via your shell. Prints the absolute path(s) to the exported image(s) to `stdout`. |

| Option              | Alias | Description                                                                                                                                                        | Default Value |
| ------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `--format [string]` | `-f`  | Output image format, one of `svg`, `png`, `json`, or `tldr`.                                                                                                       | `svg`         |
| `--output <string>` | `-o`  | Output image directory.                                                                                                                                            | `./`          |
| `--name <string>`   | `-n`  | Output image name (without extension). By default the original file name or URL id is used.                                                                        |               |
| `--frames [array]`  |       | Export each sketch "frame" as a separate image. Pass one or more frame names or IDs to export specific frames, or skip the arguments to export all frames.         | `false`       |
| `--transparent `    | `-t`  | Export an image with a transparent background.                                                                                                                     | `false`       |
| `--dark `           | `-d`  | Export a dark theme version of the image.                                                                                                                          | `false`       |
| `--strip-style`     |       | Remove `<style>` elements from SVG output, useful to lighten the load of embedded fonts if you intend to provide your own stylesheets. Applies to SVG output only. | `false`       |
| `--print`           | `-p`  | Print the exported image(s) to stdout instead of saving to a file. Incompatible with `--output`, and ignores `--name`. PNGs are printed as base64-encoded strings. | `false`       |
| `--verbose`         |       | Enable verbose logging. All verbose logs and prefixed with their log level and are printed to `stderr` for ease of redirection.                                    | `false`       |

#### Command: Open

```sh
tldraw-cli open [files-or-urls..]
```

Open a tldraw `.tldr` file or tldraw\.com URL your default browser. Uses a locally-hosted instance of tldraw. Call `open` without an argument to open a blank sketch. Sketches opened via URL are temporarily copied to the local system, and will not be kept in sync with tldraw.com. This command does not exit until the browser is closed.

_"Save as" support is not yet implemented in the local tldraw instance, so the `open` command is only recommended for viewing purposes at the moment._

| Argument            | Description                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `[files-or-urls..]` | The `.tldr` file(s) or tldraw\.com sketch URL(s) to open. Omit the argument to open a blank sketch. Supports glob matching via your shell. Prints the URL of the local server to `stdout`. |

No options.

## Examples

### Basic `.tldr` file image export

To export the file `your-drawing.tldr` to an SVG named `your-drawing.svg` in the current working directory, run the following command. Note that the default output format is SVG, and the default export location is the current working directory.

```sh
tldraw-cli export your-drawing.tldr
```

The file will retain its original name, e.g. `your-drawing.svg`

### Basic tldraw\.com image download

```sh
tldraw-cli export https://www.tldraw.com/s/v2_c_JsxJk8dag6QsrqExukis4
```

The tldraw.com URL's id (e.g. `v2_c_JsxJk8dag6QsrqExukis4`) will be used for the file name.

This is approximately equivalent to clicking the tldraw\.com "☰ → Edit → Export As → SVG" menu item.

### Export a remote tldraw\.com image to a local .tldr file

```sh
tldraw-cli export https://www.tldraw.com/s/v2_c_JsxJk8dag6QsrqExukis4 --format tldr
```

This is approximately equivalent to clicking the tldraw\.com "☰ → File → Save a copy" menu item.

Note that using `--format tldr` with a _file path_ instead of a _URL_ will still send the file through the pipeline, but it's effectively a no-op. (Except perhaps in rare edge cases where tldraw performs a file format version migration).

### Export to a specific image / file format

```sh
tldraw-cli export your-drawing.tldr --format png
```

This is approximately equivalent to clicking the tldraw\.com "☰ → Edit → Export As → PNG" menu item.

### Export with a transparent background

```sh
tldraw-cli export your-drawing.tldr --transparent --format png
```

This is approximately equivalent to checking the tldraw\.com "☰ → Edit → Export As → ☐ Transparent" menu item.

### Export to a specific destination

```sh
tldraw-cli export your-drawing.tldr --output ~/Desktop
```

Exports to `~/Desktop/your-drawing.svg`

### Export to a specific destination and filename

```sh
tldraw-cli export your-drawing.tldr --output ~/Desktop --name not-your-drawing
```

Exports to `~/Desktop/not-your-drawing.svg`

### Export all frames from a tldraw.com URL

```sh
tldraw-cli export https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw --frames
```

The exported files will be suffixed with their frame name, e.g.:

`v2_c_FI5RYWbdpAtjsy4OIKrKw-frame-1.png`
`v2_c_FI5RYWbdpAtjsy4OIKrKw-frame-2.png`
`v2_c_FI5RYWbdpAtjsy4OIKrKw-frame-3.png`

The frame name will be slugified.

It's possible in tldraw to give multiple frames in a single sketch the same name. In these cases, the frame ID is used in addition to the name to ensure unique output file names.

### Export a specific frame from a tldraw.com URL

```sh
tldraw-cli export https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw --frames "Frame 3"
```

### Export multiple frames from a tldraw.com URL

```sh
tldraw-cli export https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw --frames "Frame 1" "Frame 3"
```

### Export to JSON

```sh
tldraw-cli export https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw --format "json"
```

The `.tldr` file format is also JSON under the covers, but the `--format json` flag will yield a slightly different format than `--format tldr`. `--format json` is equivalent to what's produced via the tldraw\.com "☰ → Edit → Export As → JSON" menu item.

I'm not completely clear on the use-case for this format, but since tldr.com supports it, so too shall `tldraw-cli`.

### Write an SVG to stdout

```sh
tldraw-cli export https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw --print
```

### Open a tldraw.com URL

```sh
tldraw-cli open https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw
```

The remote sketch is copied to a locally-hosted instance of tldraw, which is then opened in your default browser.

## API usage

The `export` command's functionality is also provided in module form for use in TypeScript or JavaScript Node projects.

The library exports a single async function, `tldrawToImage`, which takes an options argument mirroring the arguments available via the command line. The same default values apply:

```ts
 async function tldrawToImage(
  tldrPathOrUrl: string,
  {
    dark?: boolean
    format?: 'svg' | 'png' | 'json' | 'tldr'
    frames?: boolean | string[]
    name?: string
    output?: string
    stripStyle?: boolean
    transparent?: boolean
 }): Promise<string[]>;
```

The function exports the image in the requested format and returns an array of the output image(s) or file(s).

Generally, a single file is returned — but the `string[]` return type also accommodates invocations with `frame: true` where multiple images will be generated.

Assuming you've installed `@kitschpatrol/tldraw-cli` locally in your project, it may be used as follows:

```ts
// tldraw-cli-api-test.ts

import { tldrawToImage } from '@kitschpatrol/tldraw-cli'

// Convert a local file to PNG
const [imagePath] = await tldrawToImage('./some-file.tldr', { format: 'png', output: './' })
console.log(`Wrote image to: "${imagePath}"`)

// Convert a remote tldraw.com URL to SVG
await tldrawToImage('https://www.tldraw.com/s/v2_c_JsxJk8dag6QsrqExukis4')

// Convert all frames from a single tldraw.com URL to separate SVGs
// When the `frames` option is set, the function returns an array
// of resulting file paths, instead of a solitary string
const framePathsArray = await tldrawToImage('https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw', {
  frames: true,
})
console.log(`Wrote frames to: "${framePathsArray}"`)

// Convert a specific frame from a tldraw.com URL to a PNG
await tldrawToImage('https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw', {
  frames: ['Frame 3'],
  format: 'png',
})

// You can also use the frame id instead of the frame name, if you're into that sort of thing
// It will work with or without the `shape:` prefix
await tldrawToImage('https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw', {
  frames: ['shape:x8z3Qf7Hgw4Qqp2AC-eet'],
})
```

By default, the Node API only logs warnings and errors. If you want to log the equivalent of the `--verbose` flag from the command line version, then you can set a flag on a logging object exported from the library:

```ts
// tldraw-cli-api-verbose-test.ts

import { tldrawToImage, log } from '@kitschpatrol/tldraw-cli'

// this will log extra info
log.verbose = true
await tldrawToImage('https://www.tldraw.com/s/v2_c_JsxJk8dag6QsrqExukis4')

// now we'll only log errors and warnings
log.verbose = false
await tldrawToImage('https://www.tldraw.com/s/v2_c_JsxJk8dag6QsrqExukis4')
```

_Note that the library provided is ESM-only, and requires a Node-compatible runtime. TypeScript type definitions are included._

## Background

The potential utility of a tldraw CLI app has received mention a few times.

On GitHub:

- [\[Feature\]: CLI export application #1491](https://github.com/tldraw/tldraw/issues/1491)
- [AWS Lambda-based approach](https://gist.github.com/steveruizok/c30fc99b9b3d95a14c82c59bdcc69201)
- [Added exporting of shapes and pages as images](https://github.com/tldraw/tldraw/pull/468)
- [\[feature\] Copy/Share as PNG](https://github.com/tldraw/tldraw-v1/issues/361)

On Discord:

- [@jorisjh in #ideas_old](https://discord.com/channels/859816885297741824/859816885801713730/1156880056501665802)
- [@Nitsuj in #ideas_old](https://discord.com/channels/859816885297741824/859816885801713730/1020352607920869406)

## Implementation notes

This tool is not a part of the official tldraw project, and it is currently only tested and known to be compatible with tldraw 2.0.0-beta.2.\_

Due to the current implementation of tldraw, export depends on functionality provided by a web browser. So, behind the scenes, this app serves a local instance of tldraw, then loads a `.tldr` and invokes the export download via the [Puppeteer](https://pptr.dev) headless browser automation tool.

This can be a bit slow, (exporting seems to take a second or two), but in the context of a statically-generated content pipeline it's not the end of the world.

In terms of Puppeteer vs. Playwright and other headless browser automation tools, it [looks like](https://www.checklyhq.com/blog/puppeteer-vs-selenium-vs-playwright-speed-comparison/) Puppeteer's performance likely compares favorably. (Though I have not tested and benchmarked the alternatives in the specific context of `tldraw-cli`.)

The local instance of tldraw includes its assets dependencies, so the tool should work correctly without internet access.

## The future

This is a very minimal implementation. Current plans for future improvements include the following:

- Add save button to local tldraw
- Accept globs and optimize batch processing with a single Puppeteer instance
- Add CLI tests
- Implement the ability to export specific pages as separate image files
- Add an option flag to set dpi when exporting to a bitmap format
- Additional commands beyond sketch conversion / export?
- There's room for optimization in how tldraw functions are passed to Puppeteer
- There's room for optimization in the `--print` option implementation

Any other suggestions are welcome.

Eventually, I think it would make sense for some kind of CLI tool like this one to be part of the core tldraw project. (Similar to how [tldraw-vscode](https://github.com/tldraw/tldraw/tree/main/apps/vscode) is currently integrated.)

I'm consciously releasing this tool under the `@kitschpatrol` namespace on NPM to leave the `tldraw-cli` package name available to the core tldraw project.

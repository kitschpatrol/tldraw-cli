# @kitschpatrol/tldraw-cli

[![NPM Package](https://img.shields.io/npm/v/@kitschpatrol/tldraw-cli.svg)](https://npmjs.com/package/@kitschpatrol/tldraw-cli)

## Overview

**A minimal CLI app to automate conversion and export of [tldraw](https://tldraw.dev) URLs and `.tldr` files into SVG or PNG image formats.**

This could be useful in the context of a content publishing pipeline where you want to use a `.tldr` file (perhaps under version control) as the "source of truth" for assets to be embedded elsewhere, and you don't want to manage the export of that diagram manually.

_Note: This tool is not a part of the official tldraw project, and it is currently only tested and compatible with tldraw 2.0.0-beta.2._

## Installation

Invoke directly:

```sh
npx @kitschpatrol/tldraw-cli some-file.tldr
```

...or install locally:

```sh
npm --install --save-dev @kitschpatrol/tldraw-cli
```

...or install globally:

```sh
npm --install --global @kitschpatrol/tldraw-cli
```

## Command line usage

### Invocation

```sh
tldraw-cli file-or-url {options}
```

| Argument      | Description                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `file-or-url` | The sketch to convert to an image — either a path to a local ".tldr" file, or a tldraw\.com sketch URL. |

| Option                | Alias | Description Value                                                                                                                                      | Default Value |
| --------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `--format <svg\|png>` | `-f`  | Output image format, one of `svg` or `png`                                                                                                             | `svg`         |
| `--dark-mode `        | `-d`  | Output a dark theme version of the image                                                                                                               | `false`       |
| `--transparent `      | `-t`  | Output an image with a transparent background                                                                                                          | `false`       |
| `--output <string>`   | `-o`  | Output directory                                                                                                                                       | `./`          |
| `--frames <array?>`   |       | Export each sketch "frame" as a separate image, use the option flag alone to export all frames, or pass one or more frame names or IDs                 | `false`       |
| `--strip-style`       |       | Remove `<style>` elements from SVG output, useful to lighten the load of embedded fonts or if you are going to provide your own stylesheet for the SVG | `false`       |
| `--help `             | `-h`  | Show help                                                                                                                                              |               |
| `--version`           | `-v`  | Show version number                                                                                                                                    |               |
| `--verbose`           |       | Enable verbose output                                                                                                                                  | `false`       |

## Examples

### Basic .tldr file conversion

To convert the file `your-drawing.tldr` to an svg named `your-drawing.svg` saved in the current working directory, run the following command. Note that the default output format is svg, and the default export location is the current working directory.

```sh
npx @kitschpatrol/tldraw-cli your-drawing.tldr
```

The file will retain its original name, e.g. `your-drawing.svg`

### Basic tldraw\.com image download

```sh
npx @kitschpatrol/tldraw-cli https://www.tldraw.com/s/v2_c_JsxJk8dag6QsrqExukis4
```

The tldraw URL's id (e.g. `v2_c_JsxJk8dag6QsrqExukis4`) will be used for the file name.

### Export to a specific format

```sh
npx @kitschpatrol/tldraw-cli your-drawing.tldr --format png
```

### Export with a transparent background

```sh
npx @kitschpatrol/tldraw-cli your-drawing.tldr --transparent --format png
```

### Export to a specific destination

```sh
npx @kitschpatrol/tldraw-cli your-drawing.tldr --output ~/Desktop
```

### Export all frames from a single tldraw URL

```sh
npx @kitschpatrol/tldraw-cli https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw --frames
```

The saved files will be suffixed with their frame name, e.g.: `v2_c_FI5RYWbdpAtjsy4OIKrKw-frame-1.png`

It's possible in tldraw to give multiple frames in a single sketch the same name. In these cases, the frame ID is used in addition to the name to ensure unique output file names.

### Export a specific frame from a tldraw URL

```sh
npx @kitschpatrol/tldraw-cli https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw --frames "Frame 1" "Frame 3"
```

## API usage

The conversion tool's functionality is also exposed as a module for use in TypeScript or JavaScript Node projects.

The library exports a single async function, `tldrawToImage`, which takes an options argument mirroring the arguments available via the command line. The same default values apply:

```ts
 tldrawToImage(
  tldrPathOrUrl: string,
  {
    darkMode?: boolean
    output?: string
    format?: 'png' | 'svg'
    frames?: boolean | string[]
    stripStyle?: boolean
    transparent?: boolean
    verbose?: boolean
 }): Promise<string | string[]>;
```

The function exports the image in the requested format returns the full path to the output image.

Assuming you've installed `@kitschpatrol/tldraw-cli` locally in your project, it may be used as follows:

```ts
// tldr-cli-api-test.ts

import { tldrawToImage } from '@kitschpatrol/tldraw-cli'

// Convert a local file to PNG
const imagePath = await tldrawToImage('./some-file.tldr', { format: 'png', output: './' })
console.log(`Wrote image to: "${imagePath}"`)

// Convert a remote tldraw URL to SVG
await tldrawToImage('https://www.tldraw.com/s/v2_c_JsxJk8dag6QsrqExukis4')

// Convert all frames from a single tldraw URL to separate SVGs
// When the `frames` option is set, the function returns an array
// of resulting file paths, instead of a solitary string
const framePathsArray = await tldrawToImage('https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw', {
  frames: true,
})
console.log(`Wrote frames to: "${framePathsArray}"`)

// Convert a specific frame from a tldraw URL to a PNG
await tldrawToImage('https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw', {
  frames: ['Frame 3'],
  format: 'png',
})

// You can also use the frame id instead of name, if you're into that sort of thing
// It will work with or without the `shape:` prefix
await tldrawToImage('https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw', {
  frames: ['shape:x8z3Qf7Hgw4Qqp2AC-eet'],
})
```

_Note that the library provided is ESM only, and requires a Node-compatible runtime. TypeScript type definitions are included._

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

Due to the current implementation of tldraw, export depends on functionality provided by a web browser. So, behind the scenes, this app serves a local instance of tldraw, then loads a `.tldr` and invokes the export download via [Puppeteer](https://pptr.dev).

This can be a bit slow, (exporting seems to take a second or two), but in the context of a content pipeline it's not the end of the world.

In terms of Puppeteer vs. Playwright and other headless browser automation tools, it [looks like](https://www.checklyhq.com/blog/puppeteer-vs-selenium-vs-playwright-speed-comparison/) Puppeteer's performance likely compares favorably. (Though I have not tested and benchmarked the alternatives in the specific context of `tldraw-cli`.)

The local instance of tldraw includes its assets dependencies, so the tool should work correctly without internet access.

## The future

This is a very minimal implementation. Current plans for future improvements include the following:

- Add CLI tests
- Implement the ability to export specific pages as separate image files
- Add an option flag to set dpi when exporting to a bitmap format
- Additional commands beyond sketch conversion / export?

Any other suggestions are welcome.

Eventually, I think it would make sense for some kind of CLI tool like this one to be part of the core tldraw project. (Similar to how [tldraw-vscode](https://github.com/tldraw/tldraw/tree/main/apps/vscode) is currently integrated.)

I'm consciously releasing this tool under the `@kitschpatrol` namespace on NPM to leave the `tldraw-cli` package name available to the core tldraw project.

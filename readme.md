# @kitschpatrol/tldraw-cli

[![NPM Package](https://img.shields.io/npm/v/@kitschpatrol/tldraw-cli.svg)](https://npmjs.com/package/@kitschpatrol/tldraw-cli)

## Overview

**A minimal CLI app to automate conversion and export of [tldraw](https://tldraw.dev) `.tldr` files into svg or png image formats.**

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

| Argument      | Description                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `file-or-url` | The sketch to convert to an image — either a path to a local ".tldr" file, or a tldraw\.com sketch URL |

| Option            | Description                                 | Default |
| ----------------- | ------------------------------------------- | ------- |
| `-f`, `--format`  | Output image format , one of "png" or "svg" | `svg`   |
| `-o`, `--output`  | Output image directory                      | `./`    |
| `-h`, `--help`    | Show help                                   |         |
| `-v`, `--version` | Show version number                         |         |
| `--verbose`       | Enable verbose output                       | `false` |

## Examples

### Basic .tldr file conversion

To convert the file `your-drawing.tldr` to an svg named `your-drawing.svg` saved in the current working directory, run the following command. Note that the default output format is svg, and the default export location is the current working directory.

```sh
npx @kitschpatrol/tldraw-cli your-drawing.tldr
```

### Basic tldraw\.com image download

```sh
npx @kitschpatrol/tldraw-cli https://www.tldraw.com/s/v2_c_JsxJk8dag6QsrqExukis4
```

### Export to a specific format

```sh
npx @kitschpatrol/tldraw-cli your-drawing.tldr --format png
```

### Export to a specific destination

```sh
npx @kitschpatrol/tldraw-cli your-drawing.tldr --output ~/Desktop
```

## API usage

The conversion tool's functionality is also exposed as a module for use in TypeScript or JavaScript Node projects.

The library exports a single async function, `tldrawToImage` with the following type signature, mirroring the arguments available via the command line. The same default values apply:

```ts
 tldrawToImage(tldrPathOrUrl: string, format?: ExportFormat, destination?: string, verbose?: boolean): Promise<string>;
```

The function exports the image in the requested format returns the full path to the output image.

Assuming you've installed `@kitschpatrol/tldraw-cli` locally in your project, it may be used as follows:

```ts
// tldr-cli-api-test.ts

import { tldrawToImage } from '@kitschpatrol/tldraw-cli'

// converting a local file
const imagePathFromLocal = await tldrawToImage('./some-file.tldr', 'png', './', false)

// Image saved to: "[...]/some-file.png"
console.log(`Image saved to: "${imagePathFromLocal}"`)

// Saving a remote tldraw url
await tldrawToImage('https://www.tldraw.com/s/v2_c_JsxJk8dag6QsrqExukis4')
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

The local instance of tldraw includes its assets dependencies, so the tool should work correctly without internet access.

## The future

This is a very minimal implementation. Current plans for future improvements include the following:

- Add automated tests
- Implement the ability to export specific frames or pages as separate image files
- Add an option flag to set dpi when exporting to a bitmap format
- Add option flag for transparent background

Any other suggestions are welcome.

Eventually, I think it would make sense for some kind of CLI tool like this one to be part of the core tldraw project. (Similar to how [tldraw-vscode](https://github.com/tldraw/tldraw/tree/main/apps/vscode) is currently integrated.)

I'm consciously releasing this tool under the `@kitschpatrol` namespace on NPM to leave the `tldraw-cli` package name available to the core tldraw project.

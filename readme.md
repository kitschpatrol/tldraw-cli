# @kitschpatrol/tldraw-cli

**A minimal CLI app to automate conversion and export of [tldraw](https://tldraw.dev) `.tldr` files into svg or png image formats.**

This could be useful in the context of a content publishing pipeline where you want to use a `.tldr` file (perhaps under version control) as the "source of truth" for assets to be embedded elsewhere, and you don't want to manage the export of that diagram manually.

This tool is only tested and compatible with tldraw 2.0.0-beta.2.

## Usage

TODO

## Examples

### Basic conversion

To convert the file `your-drawing.tldr` to an svg named `your-drawing.svg` saved in the current working directory, run the following command. The default output format is SVG, and the default export folder is the folder

```sh
npx @kitschpatrol/tldraw-cli your-drawing.tldr
```

### Export to a specific format

You can specify the output format with the `--format` (or `-f`) flag:

```sh
npx @kitschpatrol/tldraw-cli your-drawing.tldr --format png
```

### Export to a specific destination

You can specify a destination folder with the `--output` or (`-o`) flag:

```sh
npx @kitschpatrol/tldraw-cli your-drawing.tldr --format png --output ~/Desktop
```

### Exporting tldraw frames

```sh
npx @kitschpatrol/tldraw-cli your-drawing.tldr TODO
```

## Background

Discussion of a tldraw CLI app has come up a few times.

On GitHub:

- [[Feature]: CLI export application #1491](https://github.com/tldraw/tldraw/issues/1491)
- [AWS Lambda-based approach](https://gist.github.com/steveruizok/c30fc99b9b3d95a14c82c59bdcc69201)

On Discord:

- [@jorisjh in #ideas_old](https://discord.com/channels/859816885297741824/859816885801713730/1156880056501665802)
- [@Nitsuj in #ideas_old](https://discord.com/channels/859816885297741824/859816885801713730/1020352607920869406)

## Implementation notes

Due to the current implementation of tldraw, export depends on functionality provided by a web browser. So, behind the scenes, this app serves a local instance of tldraw, then loads a `.tldr` and invokes the export download via [Puppeteer](https://pptr.dev).

The tldraw instance is built with vite, the cli app is built with esbuild.

## The future

Eventually, I think it would make sense for some kind of CLI tool like this one to be part of the core tldraw project. (Similar to how [tldraw-vscode](https://github.com/tldraw/tldraw/tree/main/apps/vscode) is currently integrated.)

I'm consciously releasing this tool under the `@kitschpatrol` namespace on NPM to leave the `tldraw-cli` package name available to the core tldraw project.

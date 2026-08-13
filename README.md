### comark-toml

A [Comark](https://comark.dev/) plugin for TOML [frontmatter](https://comark.dev/plugins/defaults/frontmatter) and component [block props](https://comark.dev/syntax/components#properties-block-props).

### Install

```sh
# npm
npm install comark-toml

# pnpm
pnpm add comark-toml

# bun
bun add comark-toml
```

`comark` is a peer dependency and must be installed by the consuming project.

### Example

```ts
import { parseMarkdown } from 'comark'
import toml from 'comark-toml'

const document = await parseMarkdown(content, { plugins: [toml()] })
```

Component props also support fenced TOML blocks:

```md
::card
+++
title = "A component"
+++

Content
::
```

### Notes

- Document TOML frontmatter must start with `+++`; Comark's native `---` YAML frontmatter remains available.
- Use either TOML or YAML frontmatter for a document. They are not merged.
- Frontmatter-style TOML props (`+++`) must appear immediately after a component opener. Fenced props support both backticks and tildes.

### License

Copyright © 2026 Yu

Open sourced under [MIT license](./LICENSE).

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

```md
+++
title = "Hello, TOML"
published = true
tags = ["comark", "toml"]

[author]
name = "Ada"
+++

# Hello
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
- If TOML frontmatter is followed immediately by YAML frontmatter, Comark consumes the YAML block too, but `comark-toml` restores TOML as the final document frontmatter. The YAML block is removed rather than merged or rendered.

### License

Copyright © 2026 Yu

Open sourced under [MIT license](./LICENSE).

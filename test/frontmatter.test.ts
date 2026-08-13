import { parseMarkdown } from 'comark'
import { describe, expect, it } from 'vitest'

import frontmatter_plugin from '../src/index.ts'

describe('TOML frontmatter', () => {
  it('parses a leading TOML block into the document frontmatter', async () => {
    const toml_document = `+++
title = "Hello, TOML"
published = true
tags = ["comark", "toml"]

[author]
name = "Ada"
+++

# Hello`

    const parsed_document = await parseMarkdown(toml_document, {
      plugins: [frontmatter_plugin()],
    })

    expect(parsed_document.frontmatter).toEqual({
      author: { name: 'Ada' },
      published: true,
      tags: ['comark', 'toml'],
      title: 'Hello, TOML',
    })
    expect(parsed_document.nodes).toEqual([
      ['h1', { id: 'hello' }, 'Hello'],
    ])
  })

  it('preserves YAML frontmatter support', async () => {
    const yaml_document = `---
title: Hello, YAML
published: true
---

# Hello`

    const parsed_document = await parseMarkdown(yaml_document, {
      plugins: [frontmatter_plugin()],
    })

    expect(parsed_document.frontmatter).toEqual({
      published: true,
      title: 'Hello, YAML',
    })
    expect(parsed_document.nodes).toEqual([
      ['h1', { id: 'hello' }, 'Hello'],
    ])
  })

  it('accepts CRLF-delimited TOML frontmatter', async () => {
    const toml_document = '+++\r\ntitle = "Hello"\r\n+++\r\n\r\n# Hello'

    const parsed_document = await parseMarkdown(toml_document, {
      plugins: [frontmatter_plugin()],
    })

    expect(parsed_document.frontmatter).toEqual({ title: 'Hello' })
    expect(parsed_document.nodes).toEqual([
      ['h1', { id: 'hello' }, 'Hello'],
    ])
  })

  it('only recognizes TOML frontmatter at the start of a document', async () => {
    const markdown_document = `# Hello

+++
title = "Not frontmatter"
+++`

    const parsed_document = await parseMarkdown(markdown_document, {
      plugins: [frontmatter_plugin()],
    })

    expect(parsed_document.frontmatter).toEqual({})
  })

  it('reports invalid TOML syntax', async () => {
    const toml_document = `+++
title =
+++`

    await expect(
      parseMarkdown(toml_document, { plugins: [frontmatter_plugin()] }),
    ).rejects.toThrow('Invalid TOML document')
  })
})

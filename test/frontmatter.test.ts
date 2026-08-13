import closing_eof_document from '@test/fixtures/frontmatter/closing-eof.toml.md?raw'
import complex_toml_document from '@test/fixtures/frontmatter/complex.toml.md?raw'
import empty_body_document from '@test/fixtures/frontmatter/empty-body.toml.md?raw'
import invalid_duplicate_key_document from '@test/fixtures/frontmatter/invalid-duplicate-key.toml.md?raw'
import invalid_unterminated_array_document from '@test/fixtures/frontmatter/invalid-unterminated-array.toml.md?raw'
import invalid_toml_document from '@test/fixtures/frontmatter/invalid.toml.md?raw'
import missing_closing_delimiter_document from '@test/fixtures/frontmatter/missing-closing-delimiter.md?raw'
import non_leading_document from '@test/fixtures/frontmatter/non-leading.md?raw'
import crlf_toml_document from '@test/fixtures/frontmatter/toml.crlf.md?raw'
import toml_document from '@test/fixtures/frontmatter/toml.md?raw'
import yaml_document from '@test/fixtures/frontmatter/yaml.md?raw'
import { parseMarkdown } from 'comark'
import { TomlError } from 'smol-toml'
import { describe, expect, it } from 'vitest'

import frontmatter_plugin from '@/index'

describe('TOML frontmatter', () => {
  it('uses a dedicated plugin name', () => {
    expect(frontmatter_plugin().name).toBe('comark-toml')
  })

  it('parses a leading TOML block into the document frontmatter', async () => {
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

  it('preserves nested TOML values', async () => {
    const parsed_document = await parseMarkdown(complex_toml_document, {
      plugins: [frontmatter_plugin()],
    })

    expect(parsed_document.frontmatter).toEqual({
      build: { target: 'web' },
      description: 'The marker +++ remains part of this value',
      enabled: true,
      inline: { modes: ['safe', 'fast'], retry: 3 },
      metadata: {
        owner: { name: 'Ada' },
        reviewers: [
          { name: 'Grace', roles: ['editor'] },
          { name: 'Lin', roles: ['reviewer', 'maintainer'] },
        ],
      },
      threshold: 1.5,
      title: 'Complex TOML',
    })
  })

  it('defers YAML frontmatter to Comark', async () => {
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
    const parsed_document = await parseMarkdown(crlf_toml_document, {
      plugins: [frontmatter_plugin()],
    })

    expect(parsed_document.frontmatter).toEqual({ title: 'Hello' })
    expect(parsed_document.nodes).toEqual([
      ['h1', { id: 'hello' }, 'Hello'],
    ])
  })

  it('only recognizes TOML frontmatter at the start of a document', async () => {
    const parsed_document = await parseMarkdown(non_leading_document, {
      plugins: [frontmatter_plugin()],
    })

    expect(parsed_document.frontmatter).toEqual({})
  })

  it('requires a closing delimiter', async () => {
    const parsed_document = await parseMarkdown(
      missing_closing_delimiter_document,
      { plugins: [frontmatter_plugin()] },
    )

    expect(parsed_document.frontmatter).toEqual({})
  })

  it('parses TOML frontmatter without a markdown body', async () => {
    const parsed_document = await parseMarkdown(empty_body_document, {
      plugins: [frontmatter_plugin()],
    })

    expect(parsed_document.frontmatter).toEqual({
      title: 'Frontmatter only',
    })
    expect(parsed_document.nodes).toEqual([])
  })

  it('accepts a closing delimiter at end-of-file', async () => {
    const parsed_document = await parseMarkdown(closing_eof_document, {
      plugins: [frontmatter_plugin()],
    })

    expect(parsed_document.frontmatter).toEqual({
      title: 'Closing delimiter at EOF',
    })
    expect(parsed_document.nodes).toEqual([])
  })

  it.each([
    ['a missing value', invalid_toml_document, 1],
    ['a duplicate key', invalid_duplicate_key_document, 2],
    ['an unterminated array', invalid_unterminated_array_document, 1],
  ])('reports %s as a TOML error', async (_description, document, line) => {
    const parsing_document = parseMarkdown(document, {
      plugins: [frontmatter_plugin()],
    })

    await expect(parsing_document).rejects.toBeInstanceOf(TomlError)
    await expect(parsing_document).rejects.toMatchObject({ line })
  })
})

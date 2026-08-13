import fenced_document from '@test/fixtures/block-props/fenced.toml.md?raw'
import frontmatter_document from '@test/fixtures/block-props/frontmatter.toml.md?raw'
import invalid_fenced_document from '@test/fixtures/block-props/invalid-fenced.toml.md?raw'
import invalid_frontmatter_document from '@test/fixtures/block-props/invalid-frontmatter.toml.md?raw'
import nested_document from '@test/fixtures/block-props/nested.toml.md?raw'
import non_leading_delimiter_document from '@test/fixtures/block-props/non-leading-delimiter.toml.md?raw'
import outside_component_document from '@test/fixtures/block-props/outside-component.toml.md?raw'
import tilde_document from '@test/fixtures/block-props/tilde.toml.md?raw'
import unterminated_fence_document from '@test/fixtures/block-props/unterminated-fence.toml.md?raw'
import yaml_document from '@test/fixtures/block-props/yaml.md?raw'
import { parseMarkdown } from 'comark'
import { TomlError } from 'smol-toml'
import { describe, expect, it } from 'vitest'

import frontmatter_plugin from '@/index'

function parse_toml_document(document: string) {
  return parseMarkdown(document, { plugins: [frontmatter_plugin()] })
}

describe('TOML block props', () => {
  it('parses fenced props with nested values', async () => {
    const parsed_document = await parse_toml_document(fenced_document)

    expect(parsed_document.nodes).toEqual([
      [
        'card',
        {
          author: { name: 'Ada' },
          class: 'base toml',
          config: { modes: ['safe', 'fast'], retry: 3 },
          count: '2',
          published: 'true',
          reviewers: [
            { name: 'Grace', roles: ['editor'] },
            { name: 'Lin', roles: ['reviewer', 'maintainer'] },
          ],
          tags: ['comark', 'toml'],
          title: 'Hello, TOML',
        },
        'Body',
      ],
    ])
  })

  it('parses tilde-fenced props', async () => {
    const parsed_document = await parse_toml_document(tilde_document)

    expect(parsed_document.nodes).toEqual([
      ['notice', { level: '2', title: 'Tilde fence' }, 'Body'],
    ])
  })

  it('parses frontmatter-style props immediately after the opener', async () => {
    const parsed_document = await parse_toml_document(frontmatter_document)

    expect(parsed_document.nodes).toEqual([
      [
        'panel',
        {
          count: '3',
          display: { border: 'subtle', widths: [320, 640] },
          enabled: 'true',
          title: 'Frontmatter style',
        },
        'Body',
      ],
    ])
  })

  it('assigns props to the nearest nested component', async () => {
    const parsed_document = await parse_toml_document(nested_document)

    expect(parsed_document.nodes).toEqual([
      [
        'outer',
        { id: 'shell' },
        [
          'inner',
          {
            enabled: 'true',
            items: [{ label: 'One' }, { label: 'Two' }],
          },
          'Body',
        ],
      ],
    ])
  })

  it('preserves YAML block props', async () => {
    const parsed_document = await parse_toml_document(yaml_document)

    expect(parsed_document.nodes).toEqual([
      [
        'card',
        {
          class: 'base yaml',
          count: '2',
          tags: ['comark', 'yaml'],
          title: 'YAML props',
        },
        'Body',
      ],
    ])
  })

  it.each([
    ['fenced props', invalid_fenced_document],
    ['frontmatter-style props', invalid_frontmatter_document],
  ])('reports malformed %s', async (_description, document) => {
    await expect(parse_toml_document(document)).rejects.toBeInstanceOf(
      TomlError,
    )
  })

  it('does not treat a TOML fence outside a component as props', async () => {
    const parsed_document = await parse_toml_document(
      outside_component_document,
    )

    expect(parsed_document.nodes).toEqual([
      [
        'pre',
        { language: 'toml', filename: 'props' },
        ['code', { class: 'language-toml' }, 'title = "Code, not props"'],
      ],
    ])
  })

  it('does not treat a delayed delimiter as props', async () => {
    const parsed_document = await parse_toml_document(
      non_leading_delimiter_document,
    )

    expect(parsed_document.nodes).toEqual([
      ['card', {}, 'Body\n+++\ntitle = "Not props"\n+++'],
    ])
  })

  it('leaves an unterminated TOML fence as a code block', async () => {
    const parsed_document = await parse_toml_document(
      unterminated_fence_document,
    )

    expect(parsed_document.nodes).toEqual([
      [
        'card',
        {},
        [
          'pre',
          { language: 'toml', filename: 'props' },
          [
            'code',
            { class: 'language-toml' },
            'title = "Unterminated"\n::',
          ],
        ],
      ],
    ])
  })
})

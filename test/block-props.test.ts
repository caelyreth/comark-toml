import delayed_frontmatter_document from '@test/fixtures/block-props/delayed-frontmatter.toml.md?raw'
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
import type { MarkdownExit, RuleBlock, StateBlock } from 'markdown-exit'
import { TomlError } from 'smol-toml'
import { describe, expect, it } from 'vitest'

import toml_block_props from '@/block-props'
import frontmatter_plugin from '@/index'

interface _BlockRuleRegistrar {
  after: (
    after_rule_name: string,
    rule_name: string,
    rule: RuleBlock,
  ) => void
}

interface _MarkdownExitStub {
  block: { ruler: _BlockRuleRegistrar }
}

interface _ComponentBlockToken {
  attrJoin: (name: string, value: string) => void
  attrSet: (name: string, value: string) => void
  map: [number, number]
}

function get_toml_block_props_rule(): RuleBlock {
  let toml_block_props_rule: RuleBlock | undefined

  const markdown_exit: _MarkdownExitStub = {
    block: {
      ruler: {
        after(_after_rule_name, rule_name, rule) {
          if (rule_name === 'comark_toml_block_props') {
            toml_block_props_rule = rule
          }
        },
      },
    },
  }

  toml_block_props(markdown_exit as unknown as MarkdownExit)

  if (!toml_block_props_rule) {
    throw new Error('TOML block props rule was not registered')
  }

  return toml_block_props_rule
}

function create_block_state(
  lines: string[],
  environment: unknown,
): StateBlock {
  const b_marks: number[] = []
  const e_marks: number[] = []
  let character_offset = 0

  for (const line of lines) {
    b_marks.push(character_offset)
    e_marks.push(character_offset + line.length)
    character_offset += line.length + 1
  }

  return {
    bMarks: b_marks,
    eMarks: e_marks,
    env: environment,
    line: 0,
    src: lines.join('\n'),
    tShift: lines.map(() => 0),
  } as unknown as StateBlock
}

function parse_toml_document(
  document: string,
): ReturnType<typeof parseMarkdown> {
  return parseMarkdown(document, { plugins: [frontmatter_plugin()] })
}

const toml_block_props_rule = get_toml_block_props_rule()

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

  it('does not treat a delayed frontmatter delimiter as props', async () => {
    const parsed_document = await parse_toml_document(
      delayed_frontmatter_document,
    )

    expect(parsed_document.nodes).toEqual([
      [
        'card',
        {},
        ['h1', { id: 'body' }, 'Body'],
        ['p', {}, '+++\ntitle = "Not props"\n+++'],
      ],
    ])
  })

  it('rejects TOML fences without a component token', () => {
    const no_environment_state = create_block_state(['+++'], null)
    const invalid_token_state = create_block_state(['+++'], {
      comarkBlockTokens: [null],
    })

    expect(toml_block_props_rule(no_environment_state, 0, 1, false)).toBe(
      false,
    )
    expect(toml_block_props_rule(invalid_token_state, 0, 1, false)).toBe(
      false,
    )
  })

  it('does not mutate props while parsing silently', () => {
    const property_writes: string[] = []
    const component_token: _ComponentBlockToken = {
      attrJoin(name, value) {
        property_writes.push(`${name}=${value}`)
      },
      attrSet(name, value) {
        property_writes.push(`${name}=${value}`)
      },
      map: [0, 4],
    }
    const state = create_block_state(
      ['::card', '+++', 'title = "Silent"', '+++'],
      { comarkBlockTokens: [component_token] },
    )

    expect(toml_block_props_rule(state, 1, 4, true)).toBe(true)
    expect(property_writes).toEqual([])
    expect(state.line).toBe(4)
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

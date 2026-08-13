import type { ComarkPluginFactory, MarkdownItPlugin } from 'comark'
import {
  defineComarkPlugin as define_comark_plugin,
  parseFrontmatter as parse_comark_frontmatter,
} from 'comark/parse'
import { parse as parse_toml } from 'smol-toml'

import toml_block_props from '@/block-props'

const TOML_FRONTMATTER_DELIMITER = '+++'
const TOML_FRONTMATTER_OPENING = /^\+\+\+\r?\n/
const TOML_FRONTMATTER_CLOSING = /(?:^|\r?\n)\+\+\+(?=\r?\n|$)/m

// Comark currently types this hook for markdown-it despite using markdown-exit.
const comark_toml_block_props =
  toml_block_props as unknown as MarkdownItPlugin

interface _ParsedFrontmatter {
  content: string
  data: _Properties
  frontmatter_text: string
}

interface _Properties {
  [key: string]: unknown
}

function parse_toml_frontmatter(markdown: string) {
  if (!markdown.startsWith(TOML_FRONTMATTER_DELIMITER)) return

  const opening_match = TOML_FRONTMATTER_OPENING.exec(markdown)

  if (!opening_match) return

  const content_start = opening_match[0].length
  const remaining_markdown = markdown.slice(content_start)
  const closing_match = TOML_FRONTMATTER_CLOSING.exec(remaining_markdown)

  if (!closing_match) return

  const frontmatter_text = remaining_markdown.slice(0, closing_match.index)

  if (!frontmatter_text) return

  return {
    content: remaining_markdown.slice(
      closing_match.index + closing_match[0].length,
    ),
    data: parse_toml(frontmatter_text),
    frontmatter_text,
  }
}

function parse_yaml_frontmatter(markdown: string): _ParsedFrontmatter {
  const parsed_frontmatter = parse_comark_frontmatter(markdown)

  return {
    content: parsed_frontmatter.content,
    data: parsed_frontmatter.data,
    frontmatter_text: parsed_frontmatter.frontmatterText,
  }
}

const frontmatter_plugin: ComarkPluginFactory<unknown> =
  define_comark_plugin(() => ({
    name: 'frontmatter',
    markdownItPlugins: [comark_toml_block_props],
    pre(state) {
      const parsed_frontmatter =
        parse_toml_frontmatter(state.markdown) ??
        parse_yaml_frontmatter(state.markdown)

      state.markdown = parsed_frontmatter.content
      state.frontmatter = parsed_frontmatter.data
      state.frontmatterText = parsed_frontmatter.frontmatter_text

      if (
        parsed_frontmatter.content &&
        parsed_frontmatter.frontmatter_text
      ) {
        state.parsedLines =
          (state.parsedLines ?? 0) +
          parsed_frontmatter.frontmatter_text.split('\n').length +
          1
      }
    },
  }))

export default frontmatter_plugin

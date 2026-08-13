import type { ComarkPluginFactory, MarkdownItPlugin } from 'comark'
import { defineComarkPlugin as define_comark_plugin } from 'comark/parse'

import toml_block_props from '@/block-props'
import { parse_frontmatter } from '@/frontmatter'

// Comark currently types this hook for markdown-it despite using markdown-exit.
const comark_toml_block_props =
  toml_block_props as unknown as MarkdownItPlugin

const frontmatter_plugin: ComarkPluginFactory<unknown> =
  define_comark_plugin(() => ({
    name: 'frontmatter',
    markdownItPlugins: [comark_toml_block_props],
    pre(state) {
      const parsed_frontmatter = parse_frontmatter(state.markdown)

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

export { comark_toml_block_props as toml_block_props }
export default frontmatter_plugin

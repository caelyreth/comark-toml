import type { ComarkPluginFactory, MarkdownItPlugin } from 'comark'
import { defineComarkPlugin as define_comark_plugin } from 'comark/parse'

import toml_block_props from '@/block-props'
import { parse_toml_frontmatter } from '@/frontmatter'

// Comark currently types this hook for markdown-it despite using markdown-exit.
const comark_toml_block_props =
  toml_block_props as unknown as MarkdownItPlugin

const comark_toml_plugin: ComarkPluginFactory<unknown> =
  define_comark_plugin(() => ({
    name: 'comark-toml',
    markdownItPlugins: [comark_toml_block_props],
    pre(state) {
      const toml_frontmatter = parse_toml_frontmatter(state.markdown)

      if (!toml_frontmatter) return

      state.markdown = toml_frontmatter.content
      state.comark_toml_frontmatter = toml_frontmatter

      if (toml_frontmatter.content && toml_frontmatter.frontmatter_text) {
        state.parsedLines =
          (state.parsedLines ?? 0) +
          toml_frontmatter.frontmatter_text.split('\n').length +
          1
      }
    },
    post(state) {
      const toml_frontmatter = state.comark_toml_frontmatter

      if (!toml_frontmatter) return

      state.frontmatter = toml_frontmatter.data
      state.frontmatterText = toml_frontmatter.frontmatter_text
      state.tree.frontmatter = toml_frontmatter.data
    },
  }))

export { comark_toml_block_props as toml_block_props }
export default comark_toml_plugin

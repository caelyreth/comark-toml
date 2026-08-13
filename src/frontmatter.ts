import { parseFrontmatter as parse_comark_frontmatter } from 'comark/parse'
import { parse as parse_toml } from 'smol-toml'

const TOML_FRONTMATTER_DELIMITER = '+++'
const TOML_FRONTMATTER_OPENING = /^\+\+\+\r?\n/
const TOML_FRONTMATTER_CLOSING = /(?:^|\r?\n)\+\+\+(?=\r?\n|$)/m

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

export function parse_frontmatter(markdown: string) {
  return (
    parse_toml_frontmatter(markdown) ?? parse_yaml_frontmatter(markdown)
  )
}

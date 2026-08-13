import type { PluginSimple, StateBlock } from 'markdown-exit'
import { parse as parse_toml } from 'smol-toml'

import { TOML_DELIMITER } from '@/constants'

interface _Properties {
  [key: string]: unknown
}

interface _ComponentBlockToken {
  attrJoin: (name: string, value: string) => void
  attrSet: (name: string, value: string) => void
  map?: [number, number] | null
}

const TOML_BACKTICK_PROPS_FENCE = '```toml [props]'
const TOML_BACKTICK_PROPS_CLOSING_FENCE = '```'
const TOML_TILDE_PROPS_FENCE = '~~~toml [props]'
const TOML_TILDE_PROPS_CLOSING_FENCE = '~~~'

function is_record(value: unknown): value is _Properties {
  return typeof value === 'object' && value !== null
}

function is_component_block_token(
  value: unknown,
): value is _ComponentBlockToken {
  if (!is_record(value)) return false

  const { attrJoin: attr_join, attrSet: attr_set, map } = value

  return (
    typeof attr_join === 'function' &&
    typeof attr_set === 'function' &&
    (map === undefined ||
      map === null ||
      (Array.isArray(map) &&
        typeof map[0] === 'number' &&
        typeof map[1] === 'number'))
  )
}

function get_component_block_token(
  environment: unknown,
): _ComponentBlockToken | undefined {
  if (!is_record(environment)) return

  const block_tokens = environment.comarkBlockTokens

  if (!Array.isArray(block_tokens)) return

  const [component_token] = block_tokens

  if (is_component_block_token(component_token)) return component_token
}

function is_block_line(
  state: StateBlock,
  line: number,
  expected_line: string,
): boolean {
  const start = state.bMarks[line] + state.tShift[line]

  return (
    state.eMarks[line] - start === expected_line.length &&
    state.src.startsWith(expected_line, start)
  )
}

function get_toml_block_props_closing_fence(
  state: StateBlock,
  line: number,
): string | undefined {
  const start = state.bMarks[line] + state.tShift[line]
  const opening_character = state.src.charCodeAt(start)

  if (
    opening_character === 43 &&
    is_block_line(state, line, TOML_DELIMITER)
  ) {
    return TOML_DELIMITER
  }

  if (
    opening_character === 96 &&
    is_block_line(state, line, TOML_BACKTICK_PROPS_FENCE)
  ) {
    return TOML_BACKTICK_PROPS_CLOSING_FENCE
  }

  if (
    opening_character === 126 &&
    is_block_line(state, line, TOML_TILDE_PROPS_FENCE)
  ) {
    return TOML_TILDE_PROPS_CLOSING_FENCE
  }
}

function find_closing_fence(
  state: StateBlock,
  start_line: number,
  end_line: number,
  closing_fence: string,
): number | undefined {
  for (let line = start_line + 1; line < end_line; line += 1) {
    if (is_block_line(state, line, closing_fence)) return line
  }
}

function is_component_frontmatter_position(
  component_token: _ComponentBlockToken,
  start_line: number,
): boolean {
  const opening_line = component_token.map?.[0]

  return opening_line !== undefined && start_line === opening_line + 1
}

function encode_toml_prop_value(value: unknown): string {
  if (typeof value === 'string') return value

  return JSON.stringify(value) as string
}

function apply_toml_props(
  component_token: _ComponentBlockToken,
  props: _Properties,
): void {
  for (const [key, value] of Object.entries(props)) {
    const encoded_value = encode_toml_prop_value(value)

    if (key === 'class') component_token.attrJoin(key, encoded_value)
    else component_token.attrSet(key, encoded_value)
  }
}

const markdown_exit_toml_block_props: PluginSimple = (markdown_it) => {
  markdown_it.block.ruler.after(
    'code',
    'comark_toml_block_props',
    (state, start_line, end_line, silent) => {
      const closing_fence = get_toml_block_props_closing_fence(
        state,
        start_line,
      )

      if (!closing_fence) return false

      const component_token = get_component_block_token(state.env)

      if (!component_token) return false

      const is_frontmatter_style = closing_fence === TOML_DELIMITER

      if (
        is_frontmatter_style &&
        !is_component_frontmatter_position(component_token, start_line)
      ) {
        return false
      }

      const closing_line = find_closing_fence(
        state,
        start_line,
        end_line,
        closing_fence,
      )

      if (closing_line === undefined) return false

      if (!silent) {
        const toml = state.src.slice(
          state.bMarks[start_line + 1],
          state.eMarks[closing_line - 1],
        )

        apply_toml_props(component_token, parse_toml(toml))
      }

      state.line = closing_line + 1
      return true
    },
  )
}

export default markdown_exit_toml_block_props

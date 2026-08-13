import type { PluginSimple, StateBlock } from 'markdown-exit'
import { parse as parse_toml } from 'smol-toml'

const TOML_BLOCK_PROPS_DELIMITER = '+++'

interface _Properties {
  [key: string]: unknown
}

interface _BlockPropsFences {
  readonly [opening_fence: string]: string
}

interface _ComponentBlockToken {
  attrJoin: (name: string, value: string) => void
  attrSet: (name: string, value: string) => void
  map?: [number, number] | null
}

const TOML_BLOCK_PROPS_FENCES: _BlockPropsFences = {
  '```toml [props]': '```',
  '~~~toml [props]': '~~~',
}

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

function get_component_block_token(environment: unknown) {
  if (!is_record(environment)) return

  const block_tokens = environment.comarkBlockTokens

  if (!Array.isArray(block_tokens)) return

  const [component_token] = block_tokens

  if (is_component_block_token(component_token)) return component_token
}

function get_block_line(state: StateBlock, line: number): string {
  const start = state.bMarks[line] + state.tShift[line]

  return state.src.slice(start, state.eMarks[line])
}

function find_closing_fence(
  state: StateBlock,
  start_line: number,
  end_line: number,
  closing_fence: string,
) {
  for (let line = start_line + 1; line < end_line; line += 1) {
    if (get_block_line(state, line) === closing_fence) return line
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

  return JSON.stringify(value) ?? ''
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

const toml_block_props: PluginSimple = (markdown_it) => {
  markdown_it.block.ruler.after(
    'code',
    'comark_toml_block_props',
    (state, start_line, end_line, silent) => {
      const component_token = get_component_block_token(state.env)

      if (!component_token) return false

      const opening_fence = get_block_line(state, start_line)
      const is_frontmatter_style =
        opening_fence === TOML_BLOCK_PROPS_DELIMITER
      const closing_fence = is_frontmatter_style
        ? TOML_BLOCK_PROPS_DELIMITER
        : TOML_BLOCK_PROPS_FENCES[opening_fence]

      if (!closing_fence) return false

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

export default toml_block_props

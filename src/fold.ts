import {NodeProp, SyntaxNode} from "lezer-tree"
import {EditorState, Facet} from "@codemirror/next/state"
import {Language} from "./language"

/// A facet that registers a code folding service. When called with
/// the extent of a line, such a function should return a range
/// object when a foldable that starts on that line (but continues
/// beyond it), if one can be found.
export const foldable = Facet.define<(state: EditorState, lineStart: number, lineEnd: number) => ({from: number, to: number} | null)>()

/// This node prop is used to associate folding information with node
/// types. Given a syntax node, it should check whether that tree is
/// foldable and return the range that can be collapsed when it is.
export const foldNodeProp = new NodeProp<(node: SyntaxNode, state: EditorState) => ({from: number, to: number} | null)>()

export function syntaxFolding(language: Language) {
  return foldable.of((state: EditorState, start: number, end: number) => {
    let inner = language.getTree(state).resolve(end)
    let found: null | {from: number, to: number} = null
    for (let cur: SyntaxNode | null = inner; cur; cur = cur.parent) {
      if (cur.to <= end || cur.from > end) continue
      if (found && cur.from < start) break
      let prop = cur.type.prop(foldNodeProp)
      if (prop) {
        let value = prop(cur, state)
        if (value && value.from <= end && value.from >= start && value.to > end) found = value
      }
    }
    return found
  })
}

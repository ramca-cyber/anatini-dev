import { useRef, useEffect, useCallback, type MutableRefObject } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { basicSetup } from "codemirror";

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onInsertRef?: MutableRefObject<((text: string) => void) | null>;
}

export function SqlEditor({ value, onChange, onRun, onInsertRef }: SqlEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onRunRef = useRef(onRun);
  const onChangeRef = useRef(onChange);

  onRunRef.current = onRun;
  onChangeRef.current = onChange;

  // Expose insert function
  useEffect(() => {
    if (onInsertRef) {
      onInsertRef.current = (text: string) => {
        const view = viewRef.current;
        if (!view) return;
        const pos = view.state.selection.main.head;
        view.dispatch({ changes: { from: pos, insert: text } });
        view.focus();
      };
      return () => { onInsertRef.current = null; };
    }
  }, [onInsertRef]);

  useEffect(() => {
    if (!containerRef.current) return;

    const runKeymap = keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          onRunRef.current();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        sql(),
        oneDark,
        runKeymap,
        cmPlaceholder("-- Write SQL here (Ctrl+Enter to run)"),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": {
            fontSize: "13px",
            borderRadius: "8px",
            border: "1px solid hsl(220 18% 18%)",
            backgroundColor: "hsl(220 25% 10%)",
          },
          ".cm-content": {
            fontFamily: '"JetBrains Mono", monospace',
            padding: "12px 0",
          },
          ".cm-gutters": {
            backgroundColor: "hsl(220 25% 10%)",
            borderRight: "1px solid hsl(220 18% 18%)",
          },
          ".cm-scroller": {
            minHeight: "160px",
          },
          "&.cm-focused": {
            outline: "none",
            boxShadow: "0 0 0 1px hsl(187 80% 55%)",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={containerRef} />;
}

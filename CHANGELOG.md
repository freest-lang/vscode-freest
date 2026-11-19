# Changelog

## 0.0.0 (beta, pre-release)

First release. A new extension that supersedes *FreeST Syntax Highlighting*
(`diogofpbarros.freest-language`) and *FreeST* (`diogofpbarros.freest-lsp`).

- Syntax highlighting for FreeST 5, following the compiler's lexer.
- Diagnostics from the FreeST language server (`freest --lsp`), updated on open and save.
- Commands *FreeST: Run File* and *FreeST: Load File in REPL*, also in the editor's
  run button (▷) and context menu.
- Command *FreeST: Restart Language Server*.
- Setting `freest.path` for the location of the `freest` executable, with an
  error and install link when it cannot be found.
- Language id is now `freest` (was `FreeST`); rename `[FreeST]` blocks in your settings to `[freest]`.
- Only `.fst` files are associated with FreeST (`.freest` dropped).
- Requires VS Code 1.93 or later and a FreeST compiler with `--lsp` support.

# FreeST for Visual Studio Code

This extension adds language support for [FreeST](https://freest-lang.github.io/),
featuring syntax highlighting, error diagnostics from the FreeST language server,
and commands to run a program or load it into the REPL.

## Requirements

- VS Code 1.93 or later.
- A development version of FreeST with language server support (`freest --lsp`).
  Clone it from the [FreeST repository](https://github.com/freest-lang/freest).

## Install

1. Install the `.vsix` file: in the Extensions view, open the `…` menu and choose
   *Install from VSIX…*, or run `code --install-extension freest-0.0.0.vsix`.
2. If `freest` is not on your `PATH`, set **`freest.path`** in the settings to the
   full path of the `freest` executable.

## Use

Open a `.fst` file. Errors are shown when the file is opened and each time it is
saved (unsaved changes are not checked).

From the ▷ button at the top right of the editor, the editor's right-click menu,
or the Command Palette:

- **FreeST: Run File**: saves and runs the current file in a terminal.
- **FreeST: Load File in REPL**: saves the file and opens it in the FreeST REPL.
- **FreeST: Restart Language Server**: use it if diagnostics stop updating or
  after you reinstall FreeST.

## Feedback

Please report problems, with the `.fst` file if possible and the contents of the
*FreeST Language Server* output panel, to <freest-lang@listas.ciencias.ulisboa.pt>.

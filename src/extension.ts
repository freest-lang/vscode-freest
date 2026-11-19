import * as fs from "node:fs";
import * as path from "node:path";
import {
  commands,
  env,
  ExtensionContext,
  LogOutputChannel,
  Terminal,
  Uri,
  window,
  workspace,
} from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";

const LANGUAGE_ID = "freest";
const RUN_TERMINAL = "FreeST";
const REPL_TERMINAL = "FreeST REPL";
const INSTALL_URL = "https://freest-lang.github.io/install/";

let client: LanguageClient | undefined;
// Terminals running a command, as reported by shell integration
const busyTerminals = new Set<Terminal>();
// Shared across server restarts and never disposed: a stopped server may still
// write to stderr, even while the extension host shuts down
let outputChannel: LogOutputChannel;

export async function activate(context: ExtensionContext): Promise<void> {
  outputChannel = window.createOutputChannel("FreeST Language Server", {
    log: true,
  });

  context.subscriptions.push(
    // Menus pass the file's URI, which in a split editor need not be the
    // active one; the Command Palette and keybindings pass nothing
    commands.registerCommand("freest.run", (resource?: unknown) =>
      run(resource),
    ),
    commands.registerCommand("freest.load", (resource?: unknown) =>
      load(resource),
    ),
    commands.registerCommand("freest.restartServer", () => restartServer()),
    window.onDidStartTerminalShellExecution(({ terminal }) =>
      busyTerminals.add(terminal),
    ),
    window.onDidEndTerminalShellExecution(({ terminal }) =>
      busyTerminals.delete(terminal),
    ),
    window.onDidCloseTerminal((terminal) => busyTerminals.delete(terminal)),
    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("freest.path")) {
        void restartServer();
      }
    }),
  );

  await startServer();
}

export async function deactivate(): Promise<void> {
  await stopServer();
}

async function startServer(): Promise<void> {
  const executable = resolveFreest();
  if (!executable) {
    return;
  }

  const serverOptions: ServerOptions = {
    command: executable,
    args: ["--lsp"],
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: LANGUAGE_ID }],
    diagnosticCollectionName: "freest",
    outputChannel,
    middleware: {
      // The server's URI may differ from the document's (drive-letter case,
      // percent-encoding)
      handleDiagnostics: (uri, diagnostics, next) => {
        const document = workspace.textDocuments.find((candidate) =>
          pathsEqual(candidate.uri.fsPath, uri.fsPath),
        );
        next(document?.uri ?? uri, diagnostics);
      },
    },
  };

  client = new LanguageClient(
    "freest",
    "FreeST Language Server",
    serverOptions,
    clientOptions,
  );

  try {
    await client.start();
  } catch (error) {
    client = undefined;
    void window.showErrorMessage(
      `Failed to start the FreeST language server (${executable} --lsp): ${error}`,
    );
    return;
  }
}

async function stopServer(): Promise<void> {
  const running = client;
  client = undefined;
  try {
    await running?.stop();
  } catch {
    // The server may already have exited
  }
}

async function restartServer(): Promise<void> {
  await stopServer();
  await startServer();
}

// The saved FreeST file the command was invoked on (or else the one in the
// active editor), and the freest to run it with
async function freestFile(
  resource: unknown,
): Promise<{ file: string; executable: string } | undefined> {
  const document =
    resource instanceof Uri
      ? await workspace.openTextDocument(resource)
      : window.activeTextEditor?.document;
  if (!document || document.languageId !== LANGUAGE_ID) {
    void window.showErrorMessage(
      "Open a FreeST file before running this command.",
    );
    return undefined;
  }

  const executable = resolveFreest();
  if (!executable) {
    return undefined;
  }

  if (document.isUntitled) {
    void window.showErrorMessage("Save the file before running it.");
    return undefined;
  }
  if (document.isDirty) {
    await document.save();
  }
  return { file: document.uri.fsPath, executable };
}

// Runs in a shell terminal, reused across runs, which keeps the output visible
// after the program exits
async function run(resource: unknown): Promise<void> {
  const target = await freestFile(resource);
  if (!target) {
    return;
  }

  // A bare command name such as `freest` reads better in the terminal than its
  // resolved path
  const configured = configuredPath();
  const program = /[\\/~]/.test(configured) ? target.executable : configured;

  let terminal = window.terminals.find(
    (candidate) =>
      candidate.name === RUN_TERMINAL && candidate.exitStatus === undefined,
  );
  // A program still running there (deadlocked, or waiting for input) would
  // get the command as input; end it instead. Without shell integration
  // (cmd.exe, sh) this cannot be known.
  if (terminal && busyTerminals.has(terminal)) {
    terminal.dispose();
    terminal = undefined;
  }
  terminal ??= window.createTerminal(RUN_TERMINAL);
  terminal.sendText(shellCommandLine([program, target.file]));
  terminal.show(true);
}

// The REPL gets a terminal of its own, replacing any previous one
async function load(resource: unknown): Promise<void> {
  const target = await freestFile(resource);
  if (!target) {
    return;
  }

  for (const terminal of window.terminals) {
    if (terminal.name === REPL_TERMINAL) {
      terminal.dispose();
    }
  }
  const terminal = window.createTerminal({
    name: REPL_TERMINAL,
    shellPath: target.executable,
    shellArgs: [target.file, "--interactive"],
  });
  terminal.show(false);
}

function shellCommandLine([program, ...args]: string[]): string {
  if (process.platform !== "win32") {
    const quote = (s: string) =>
      /^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`;
    return [program, ...args].map(quote).join(" ");
  }

  const quote = (s: string) => (/[\s"&|<>^()]/.test(s) ? `"${s}"` : s);
  const line = [program, ...args].map(quote).join(" ");
  const isPowerShell = /pwsh|powershell/i.test(path.basename(env.shell));
  return isPowerShell && line.startsWith('"') ? `& ${line}` : line;
}

function configuredPath(): string {
  const value = workspace
    .getConfiguration("freest")
    .get<string>("path", "freest")
    .trim();
  return value === "" ? "freest" : value;
}

function resolveFreest(): string | undefined {
  const configured = configuredPath();
  const found = findExecutable(configured);
  if (!found) {
    void showMissingFreest(configured);
  }
  return found;
}

function findExecutable(command: string): string | undefined {
  const expanded = command.replace(/^~(?=$|[\\/])/, process.env.HOME ?? "~");
  const extensions =
    process.platform === "win32"
      ? ["", ...(process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";")]
      : [""];

  const candidates =
    path.isAbsolute(expanded) || /[\\/]/.test(expanded)
      ? [path.resolve(expanded)]
      : (process.env.PATH ?? "")
          .split(path.delimiter)
          .filter((dir) => dir !== "")
          .map((dir) => path.join(dir, expanded));

  for (const candidate of candidates) {
    for (const extension of extensions) {
      const file = candidate + extension;
      if (isExecutableFile(file)) {
        return file;
      }
    }
  }
  return undefined;
}

function isExecutableFile(file: string): boolean {
  try {
    if (!fs.statSync(file).isFile()) {
      return false;
    }
    fs.accessSync(file, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

let missingFreestShown = false;

async function showMissingFreest(configured: string): Promise<void> {
  if (missingFreestShown) {
    return;
  }
  missingFreestShown = true;

  const install = "Install FreeST";
  const settings = "Open Settings";
  const choice = await window.showErrorMessage(
    `Cannot find the FreeST compiler ('${configured}'). ` +
      "Install FreeST, or set 'freest.path' to the location of the freest executable.",
    install,
    settings,
  );
  missingFreestShown = false;

  if (choice === install) {
    void env.openExternal(Uri.parse(INSTALL_URL));
  } else if (choice === settings) {
    void commands.executeCommand(
      "workbench.action.openSettings",
      "freest.path",
    );
  }
}

function pathsEqual(first: string, second: string): boolean {
  return process.platform === "win32"
    ? first.toLowerCase() === second.toLowerCase()
    : first === second;
}

// @ts-check
const assert = require("node:assert");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vscode = require("vscode");

function freestHasLsp() {
  try {
    return execFileSync("freest", ["--help"], { encoding: "utf8" }).includes("--lsp");
  } catch {
    return false;
  }
}

/**
 * @param {() => boolean} condition
 * @param {string} what
 */
async function waitFor(condition, what, timeout = 30_000) {
  for (const start = Date.now(); Date.now() - start < timeout; ) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`timed out waiting for ${what}`);
}

/** @param {string | undefined} value */
async function setFreestPath(value) {
  await vscode.workspace
    .getConfiguration("freest")
    .update("path", value, vscode.ConfigurationTarget.Global);
}

/**
 * Runs `body` with the extension's error messages collected in `messages`
 * instead of shown. The extension and the tests share the `vscode` API
 * object, so replacing the function intercepts its messages.
 * @param {(messages: string[]) => Promise<void>} body
 */
async function withErrorMessages(body) {
  /** @type {string[]} */
  const messages = [];
  const window = /** @type {any} */ (vscode.window);
  const original = window.showErrorMessage;
  window.showErrorMessage = (/** @type {string} */ message) => {
    messages.push(message);
    return Promise.resolve(undefined);
  };
  try {
    await body(messages);
  } finally {
    window.showErrorMessage = original;
  }
}

suite("FreeST extension", function () {
  /** @type {string} */
  let dir;

  /** @param {string} name @param {string} content */
  function writeFile(name, content) {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    return file;
  }

  /** @param {string} file */
  async function open(file) {
    const document = await vscode.workspace.openTextDocument(file);
    const editor = await vscode.window.showTextDocument(document);
    return { document, editor };
  }

  /** @param {vscode.TextDocument} document */
  const diagnostics = (document) => vscode.languages.getDiagnostics(document.uri);

  // Sets freest.path to a freest that records its arguments, and returns the
  // recorded invocations, apart from the language server's
  async function recordFreestInvocations() {
    const log = path.join(dir, "arguments.log");
    const recorder = writeFile(
      "freest-recorder",
      `#!/bin/sh\nprintf '%s\\n' "$@" --- >> '${log}'\nexec freest "$@"\n`,
    );
    fs.chmodSync(recorder, 0o755);
    fs.rmSync(log, { force: true });
    await setFreestPath(recorder);
    return () =>
      (fs.existsSync(log) ? fs.readFileSync(log, "utf8") : "")
        .split("---\n")
        .filter((entry) => entry !== "" && entry !== "--lsp\n");
  }

  suiteSetup(function () {
    if (!freestHasLsp()) this.skip();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "freest-vscode-"));
  });

  teardown(async () => {
    await setFreestPath(undefined);
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    vscode.window.terminals.forEach((terminal) => terminal.dispose());
    // Disposal completes asynchronously; the next test must not see these
    await waitFor(() => vscode.window.terminals.length === 0, "the terminals to close");
  });

  suiteTeardown(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  test("reports a type error and clears it once fixed", async () => {
    const { document, editor } = await open(
      writeFile("bad.fst", "main : Int\nmain = 1 + True\n"),
    );
    assert.strictEqual(document.languageId, "freest");

    await waitFor(() => diagnostics(document).length > 0, "a diagnostic");
    const { start, end } = diagnostics(document)[0].range;
    assert.deepStrictEqual([start.line, start.character, end.character], [1, 11, 15]);

    await editor.edit((edit) => edit.replace(new vscode.Range(1, 11, 1, 15), "2"));
    await document.save();
    await waitFor(() => diagnostics(document).length === 0, "the diagnostic to clear");
  });

  test("checks unsaved edits", async () => {
    const file = writeFile("unsaved.fst", "main : Int\nmain = 1\n");
    const { document, editor } = await open(file);

    // The file on disk type checks, so a diagnostic can only come from the
    // edited buffer
    await editor.edit((edit) => edit.replace(new vscode.Range(1, 7, 1, 8), "1 + True"));
    await waitFor(() => diagnostics(document).length > 0, "a diagnostic before saving");
    const { start, end } = diagnostics(document)[0].range;
    assert.deepStrictEqual([start.line, start.character, end.character], [1, 11, 15]);
    assert.strictEqual(document.isDirty, true);
    assert.strictEqual(fs.readFileSync(file, "utf8"), "main : Int\nmain = 1\n");

    await editor.edit((edit) => edit.replace(new vscode.Range(1, 11, 1, 15), "2"));
    await waitFor(() => diagnostics(document).length === 0, "the diagnostic to clear before saving");
    assert.strictEqual(document.isDirty, true);
  });

  test("checks the open files again after a restart", async () => {
    const { document } = await open(writeFile("restart.fst", "main : Int\nmain = 'a'\n"));
    await waitFor(() => diagnostics(document).length > 0, "a diagnostic");

    await vscode.commands.executeCommand("freest.restartServer");
    await waitFor(() => diagnostics(document).length > 0, "a diagnostic after the restart");

    // Changing freest.path restarts the server too
    const freest = execFileSync("sh", ["-c", "command -v freest"], { encoding: "utf8" }).trim();
    await setFreestPath(freest);
    await waitFor(() => diagnostics(document).length > 0, "a diagnostic after the path change");
  });

  test("reports a missing freest", async () => {
    await withErrorMessages(async (messages) => {
      await setFreestPath(path.join(dir, "no-such-freest"));
      await waitFor(() => messages.length > 0, "an error message");
      assert.match(messages[0], /^Cannot find the FreeST compiler/);
    });
  });

  test("Load and Run save the file and pass it to freest unchanged", async function () {
    if (process.platform === "win32") this.skip();

    const invocations = await recordFreestInvocations();
    const file = writeFile(path.join("dir with 'quote", "odd $name.fst"), "main : Int\nmain = 1\n");
    const { document, editor } = await open(file);
    await editor.edit((edit) => edit.insert(new vscode.Position(2, 0), "-- edited\n"));

    const load = `${file}\n--interactive\n`;
    const run = `${file}\n`;
    const terminalsNamed = (/** @type {string} */ name) =>
      vscode.window.terminals.filter((terminal) => terminal.name === name);

    await vscode.commands.executeCommand("freest.load");
    assert.strictEqual(document.isDirty, false);
    await waitFor(() => invocations().length === 1, "Load");

    // Run has a terminal of its own, so the REPL does not get its input
    await vscode.commands.executeCommand("freest.run");
    await waitFor(() => invocations().length === 2, "Run");
    await vscode.commands.executeCommand("freest.run");
    await waitFor(() => invocations().length === 3, "a second Run");
    await vscode.commands.executeCommand("freest.load");
    await waitFor(() => invocations().length === 4, "a second Load");
    assert.deepStrictEqual(invocations(), [load, run, run, load]);

    // One terminal each: Run reuses its terminal, Load replaces the REPL. Both
    // stay open, so the output remains visible after the program exits.
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    for (const name of ["FreeST", "FreeST REPL"]) {
      const terminals = terminalsNamed(name);
      assert.strictEqual(terminals.length, 1, name);
      assert.strictEqual(terminals[0].exitStatus, undefined, name);
    }
  });

  test("Run ends a program that is still running", async function () {
    if (process.platform === "win32") this.skip();

    const invocations = await recordFreestInvocations();
    await open(writeFile("waits.fst", "main : String\nmain = getLine ()\n"));

    await vscode.commands.executeCommand("freest.run");
    await waitFor(() => invocations().length === 1, "Run");
    // Shell integration reports the program as running a moment later
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    // Typed into the waiting program, this would be read as its input line
    await vscode.commands.executeCommand("freest.run");
    await waitFor(() => invocations().length === 2, "a second Run");
  });

  test("Run and Load from a menu use that file, not the active editor's", async function () {
    if (process.platform === "win32") this.skip();

    const invocations = await recordFreestInvocations();
    // The run button and context menu pass the file's URI; in a split editor,
    // the active editor can be another file
    const clicked = writeFile("clicked.fst", "main : Int\nmain = 1\n");
    const { document, editor } = await open(clicked);
    await editor.edit((edit) => edit.insert(new vscode.Position(2, 0), "-- edited\n"));
    await vscode.window.showTextDocument(
      await vscode.workspace.openTextDocument(writeFile("active.fst", "main : Int\nmain = 2\n")),
      vscode.ViewColumn.Beside,
    );

    await vscode.commands.executeCommand("freest.run", document.uri);
    assert.strictEqual(document.isDirty, false);
    await waitFor(() => invocations().length === 1, "Run");
    await vscode.commands.executeCommand("freest.load", document.uri);
    await waitFor(() => invocations().length === 2, "Load");
    assert.deepStrictEqual(invocations(), [`${clicked}\n`, `${clicked}\n--interactive\n`]);
  });

  test("Run refuses untitled and non-FreeST files", async () => {
    await vscode.window.showTextDocument(
      await vscode.workspace.openTextDocument({ language: "freest", content: "main : Int\nmain = 1\n" }),
    );
    await withErrorMessages(async (messages) => {
      await vscode.commands.executeCommand("freest.run");
      assert.deepStrictEqual(messages, ["Save the file before running it."]);
    });

    await open(writeFile("notes.txt", "not FreeST\n"));
    await withErrorMessages(async (messages) => {
      await vscode.commands.executeCommand("freest.run");
      assert.deepStrictEqual(messages, ["Open a FreeST file before running this command."]);
    });
  });
});

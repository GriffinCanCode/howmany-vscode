# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 2.1.x   | Yes       |
| < 2.1   | No        |

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Report privately through
[GitHub Security Advisories](https://github.com/GriffinCanCode/howmany-vscode/security/advisories/new),
or by email to griffin@griffin-code.com.

Include the extension version, your VS Code version and platform, and steps to
reproduce.

You can expect an acknowledgement within 72 hours and a status update within
seven days.

## Scope

This extension runs with full user privileges inside the editor and renders
analysis results in webviews. The areas most relevant to security are:

- **Webview content** — file names, paths, and analysis output are rendered
  into HTML. Anything not escaped is a scripting vector, since a webview can
  reach the extension host through its message channel.
- **Content Security Policy** — webviews should keep a strict CSP with a nonce
  and no remote script origins.
- **Message handling** — messages arriving from a webview are untrusted and
  must be validated before they reach the file system or a command.
- **Binary resolution** — the extension locates and executes the `howmany`
  CLI. Resolving it from a workspace-controlled path would let a repository
  execute code just by being opened.

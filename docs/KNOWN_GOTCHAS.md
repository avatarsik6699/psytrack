# Known Gotchas

> Project memory file. Capture recurring pitfalls that repeatedly waste time during coding,
> testing, or deploys.

## How To Use

- Add only issues that are likely to happen again.
- Prefer concrete symptoms, root cause, and the shortest reliable fix.
- Remove entries that are no longer relevant.

## Gotcha Log

### Docker-owned files break host operations (`EACCES` / `EPERM` / read-only)

- **Symptoms**: file operations fail with `EACCES`, `EPERM`, "Permission denied", or "Read-only file system". Most common paths: container-generated build/cache directories on the host (`.nuxt/`, `.output/`, `node_modules/.cache/`, `__pycache__/`).
- **Root cause**: a Docker container wrote to a bind-mounted host directory as root.
- **Fix (host)**:
  ```bash
  sudo chown -R $USER:$USER <path>   # reclaim ownership, keep files
  sudo rm -rf <path>                 # OR discard the generated artefact
  ```
- **Agent protocol**: agents MUST NOT run `sudo`, `chmod -R 777`, or loop the failing operation. Instead, stop and post this exact handoff to the user (substituting real `<path>` and `<cmd>`):

  > ⛔ **Permission denied.** I cannot modify `<path>` while running `<cmd>`.
  >
  > This usually happens when a Docker container wrote files to a bind-mounted host directory as root. Please run one of the following on the host:
  >
  > ```bash
  > sudo chown -R $USER:$USER <path>
  > sudo rm -rf <path>
  > ```
  >
  > When the fix is applied, reply with the single word **`continue`** and I will retry the failed operation from the same step.

  On receiving `continue` (case-insensitive), retry the failed operation once. If it fails a second time with the same error, stop again and ask the user to confirm the fix was actually applied — do not loop a third time.

- **Prevention**: run Docker with a matching host UID/GID or use named volumes for cache directories that containers own.

---

### WSL2 — Docker Desktop required for `docker compose`

- **Symptoms**: `docker compose up` hangs or fails with "Cannot connect to the Docker daemon at unix:///var/run/docker.sock".
- **Root cause**: Docker Engine is not running inside WSL2; it must be provided by Docker Desktop on the Windows host with the WSL2 integration enabled.
- **Fix**: start Docker Desktop on Windows and ensure the WSL2 backend integration is enabled for this distro (Docker Desktop → Settings → Resources → WSL Integration).
- **Prevention**: keep Docker Desktop running before opening a terminal session in WSL2.

<!--
### [Title — short, punchy, searchable]

- **Symptoms**: [what fails, what error message]
- **Root cause**: [why it happens]
- **Fix**: [shortest reliable fix]
- **Prevention**: [optional — how to avoid hitting it again]
- **Links**: [optional — docs / issue / PR]
-->

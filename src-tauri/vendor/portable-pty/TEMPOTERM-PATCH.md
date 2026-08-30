# TempoTerm patch

This directory vendors `portable-pty` 0.9.0 from crates.io.

TempoTerm changes the macOS Unix spawn path so open file descriptors are marked
`FD_CLOEXEC` in the parent process instead of enumerating and closing them from
the post-fork `pre_exec` callback. The latter runs in a multi-threaded Tauri app
and is not async-signal-safe. Code analysis says it can crash before `exec`, as
documented in wezterm/wezterm#7742, although TempoTerm has not reproduced that
crash in hardware testing.

Linux and Windows retain the upstream 0.9.0 behavior. Treat this as a long-term
patch: wezterm/wezterm#7743 still scans `/dev/fd` in the post-fork child, so its
merge alone would not be equivalent. Remove this patch only after an upstream
release moves descriptor enumeration and allocation out of the child, adopts
an equivalent parent-side `FD_CLOEXEC` strategy, and passes TempoTerm's macOS
PTY regression tests.

## Verify the vendored source

From the repository root, download the crates.io 0.9.0 package and compare it
with this directory:

```sh
tmp_dir="$(mktemp -d)"
curl -L https://crates.io/api/v1/crates/portable-pty/0.9.0/download \
  -o "$tmp_dir/portable-pty-0.9.0.crate"
tar -xzf "$tmp_dir/portable-pty-0.9.0.crate" -C "$tmp_dir"
diff -ru \
  --exclude=.cargo-ok \
  --exclude=.cargo_vcs_info.json \
  --exclude=.gitignore \
  --exclude=Cargo.lock \
  --exclude=Cargo.toml.orig \
  --exclude=examples \
  --exclude=target \
  --exclude=TEMPOTERM-PATCH.md \
  "$tmp_dir/portable-pty-0.9.0" src-tauri/vendor/portable-pty
```

The only expected source-code difference is `src/unix.rs`.

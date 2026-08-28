# DNA OFF macOS CI artifacts

This public repository contains only an authenticated, AES-256-GCM encrypted
build payload. The application source is not published here. Decryption is
available only to the GitHub Actions workflow through a repository secret.

The current workflow artifact is a locally signed, unnotarized Apple Silicon
(`arm64`) QA installer built and runtime-tested on macOS Tahoe. It contains a
native thin ARM application and sidecar for the requested MacBook Air M1. It is
not an Apple Developer ID/notarized production release.

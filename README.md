# DNA OFF macOS CI artifacts

This public repository contains only an authenticated, AES-256-GCM encrypted
build payload. The application source is not published here. Decryption is
available only to the GitHub Actions workflow through a repository secret.

The current workflow artifact is an unsigned, unnotarized Intel (`x64`) QA
installer targeting macOS 12 Monterey, specifically the requested 12.7.6 or
newer. It is not a production release.

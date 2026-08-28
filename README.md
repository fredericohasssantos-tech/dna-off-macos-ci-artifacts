# DNA OFF macOS CI artifacts

This public repository contains only an authenticated, AES-256-GCM encrypted
build payload. The application source is not published here. Decryption is
available only to the GitHub Actions workflow through a repository secret.

The personal workflow builds an unsigned DMG containing a locally/ad-hoc signed
Apple Silicon (`arm64`) app. The app, Electron helpers, native frameworks and
Python sidecar are runtime-tested as thin ARM64 code on macOS Tahoe, including
the supplied real photo and its embedded SVG export. This personal artifact
does not use Developer ID, notarization or a paid Apple account.

Because Safari and messaging apps add macOS quarantine after download, an
ad-hoc app requires one graphical owner approval on each Mac/build: try to open
it, then use **System Settings → Privacy & Security → Open Anyway**. The DMG
includes the same instructions in Portuguese. It should be downloaded directly
in Safari on the target M1 rather than forwarded through WhatsApp.

`build-macos-release.yml` is a separate, manually dispatched production path.
It decrypts the source only inside the ephemeral Apple Silicon runner, invokes
`npm run dist:mac:release:arm64`, and stages only a DMG that has passed the
source checks, runtime tests, Developer ID verification, Apple notarization,
ticket validation and Gatekeeper assessment. A failed or incomplete check
prevents artifact upload; the decrypted source and temporary notarization key
are removed in an `always()` cleanup step.

The protected GitHub environment `production-macos` must allow deployments only
from the `main` branch and must require a reviewer before the job can access its
secrets. The workflow independently rejects every ref other than
`refs/heads/main` before checkout, decryption, or secret use. The environment
must provide all of these encrypted secrets:

- `CSC_LINK`: base64-encoded PKCS#12 containing the Developer ID Application
  certificate and its private key.
- `CSC_KEY_PASSWORD`: password of that PKCS#12.
- `APPLE_API_KEY_P8`: raw contents of an App Store Connect **Team API Key**
  `.p8` file. Individual API keys cannot authenticate `notarytool`.
- `APPLE_API_KEY_ID`: App Store Connect API Key ID.
- `APPLE_API_ISSUER`: App Store Connect API Issuer ID.
- `SOURCE_PASSPHRASE`: passphrase for the authenticated encrypted source
  payload.

The workflow fails before decryption/build when any Apple production secret is
empty. Secret values are never written to the repository or intentionally
printed. The `.p8` is materialized only inside the signing/notarization step,
removed by that step's exit trap and removed again by the unconditional job
cleanup; `electron-builder` imports `CSC_LINK` into its disposable build
keychain.

The production workflow also pins the exact private-source commit and refuses
to decrypt or build when `SOURCE_COMMIT` is stale. The encrypted snapshot must
be refreshed to that commit before the first production dispatch.

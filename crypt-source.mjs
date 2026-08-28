#!/usr/bin/env node

import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes
} from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const MAGIC = Buffer.from('DNAOFFCI01', 'ascii')
const SALT_BYTES = 16
const IV_BYTES = 12
const TAG_BYTES = 16
const ITERATIONS = 600_000

function fail(message) {
  throw new Error(message)
}

async function readStandardInput() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

function deriveKey(passphrase, salt) {
  return pbkdf2Sync(passphrase, salt, ITERATIONS, 32, 'sha256')
}

async function encrypt(outputPath, passphrase) {
  const plaintext = await readStandardInput()
  if (plaintext.length === 0) fail('Refusing to encrypt an empty source archive.')
  const salt = randomBytes(SALT_BYTES)
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', deriveKey(passphrase, salt), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  await writeFile(outputPath, Buffer.concat([MAGIC, salt, iv, tag, ciphertext]), { mode: 0o600 })
}

async function decrypt(inputPath, outputPath, passphrase) {
  const payload = await readFile(inputPath)
  const headerBytes = MAGIC.length + SALT_BYTES + IV_BYTES + TAG_BYTES
  if (payload.length <= headerBytes || !payload.subarray(0, MAGIC.length).equals(MAGIC)) {
    fail('Encrypted source payload is invalid.')
  }
  let offset = MAGIC.length
  const salt = payload.subarray(offset, offset += SALT_BYTES)
  const iv = payload.subarray(offset, offset += IV_BYTES)
  const tag = payload.subarray(offset, offset += TAG_BYTES)
  const ciphertext = payload.subarray(offset)
  const decipher = createDecipheriv('aes-256-gcm', deriveKey(passphrase, salt), iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  await writeFile(outputPath, plaintext, { mode: 0o600 })
}

const [mode, inputPath, outputPath] = process.argv.slice(2)
const passphrase = process.env.SOURCE_PASSPHRASE
if (!passphrase || passphrase.length < 32) fail('SOURCE_PASSPHRASE is missing or too short.')

if (mode === 'encrypt' && inputPath === '-' && outputPath) {
  await encrypt(outputPath, passphrase)
} else if (mode === 'decrypt' && inputPath && outputPath) {
  await decrypt(inputPath, outputPath, passphrase)
} else {
  fail('Usage: crypt-source.mjs encrypt - <output> | decrypt <input> <output>')
}

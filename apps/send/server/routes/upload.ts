import fs from 'fs'
import os from 'os'
import path from 'path'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import JSZip from 'jszip'

import { importStudyFromDirectory } from '../services/import-study'

export const uploadRoute = new Hono()

uploadRoute.post('/studies/upload', async (c) => {
  const userId = c.req.header('X-User-Id')
  if (!userId) {
    throw new HTTPException(401, { message: 'Missing X-User-Id header' })
  }

  const body = await c.req.parseBody()
  const file = body['file']

  if (!(file instanceof File)) {
    throw new HTTPException(400, { message: 'Missing file in request body' })
  }

  if (!file.name.endsWith('.zip')) {
    throw new HTTPException(400, { message: 'File must be a .zip archive' })
  }

  // Extract zip to a temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'send-upload-'))

  try {
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    // Write all files to temp dir, preserving only the filename (flatten)
    const entries = Object.entries(zip.files)
    for (const [relativePath, zipEntry] of entries) {
      if (zipEntry.dir) continue

      const filename = path.basename(relativePath)
      if (!filename) continue

      const content = await zipEntry.async('nodebuffer')
      fs.writeFileSync(path.join(tempDir, filename), content)
    }

    // Some zips have XPTs inside a subdirectory — check if ts.xpt exists
    // at the top level. If not, look one level deeper.
    let dataDir = tempDir
    if (!fs.existsSync(path.join(dataDir, 'ts.xpt'))) {
      // Check for a single subdirectory containing ts.xpt
      const subdirs = fs
        .readdirSync(tempDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())

      for (const sub of subdirs) {
        const candidate = path.join(tempDir, sub.name)
        if (fs.existsSync(path.join(candidate, 'ts.xpt'))) {
          dataDir = candidate
          break
        }
      }
    }

    if (!fs.existsSync(path.join(dataDir, 'ts.xpt'))) {
      throw new HTTPException(400, {
        message: 'Zip does not contain ts.xpt (Trial Summary). This is required to create a study.',
      })
    }

    const result = await importStudyFromDirectory(dataDir, userId)

    return c.json(result, 201)
  } finally {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

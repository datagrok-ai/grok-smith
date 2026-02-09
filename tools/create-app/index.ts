import fs from 'fs'
import path from 'path'

const appName = process.argv[2]

if (!appName) {
  console.error('Usage: npx tsx tools/create-app/index.ts <app-name>')
  process.exit(1)
}

const templateDir = path.join(import.meta.dirname, 'template')
const targetDir = path.join(import.meta.dirname, '../../apps', appName)

if (fs.existsSync(targetDir)) {
  console.error(`Error: apps/${appName} already exists.`)
  process.exit(1)
}

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destName = entry.name.replace(/\.tmpl$/, '')
    const destPath = path.join(dest, destName)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      let content = fs.readFileSync(srcPath, 'utf-8')
      content = content.replaceAll('{{APP_NAME}}', appName)
      content = content.replaceAll('{{APP_NAME_PASCAL}}', appName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(''))
      fs.writeFileSync(destPath, content)
    }
  }
}

copyDir(templateDir, targetDir)

console.log(`Created apps/${appName}. Run:`)
console.log(`  npm install`)
console.log(`  npm run dev --workspace=apps/${appName}`)

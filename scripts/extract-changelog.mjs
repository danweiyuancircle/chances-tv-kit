// 从根 CHANGELOG.md 抽出指定版本的段落正文。
// 用法：node scripts/extract-changelog.mjs 0.1.1
// 找不到该版本段落 → 退出码 1（供 CI 校验 tag 与 changelog 一致）。
import { readFileSync } from 'node:fs'

const version = process.argv[2]
if (!version) {
  console.error('用法: node scripts/extract-changelog.mjs <version>')
  process.exit(1)
}

const md = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
const lines = md.split('\n')

// 匹配 "## [0.1.1] ..." 起始，到下一个 "## [" 之前
const start = lines.findIndex((l) => l.startsWith(`## [${version}]`))
if (start === -1) {
  console.error(`CHANGELOG.md 中找不到版本 [${version}] 的段落`)
  process.exit(1)
}
let end = lines.findIndex((l, i) => i > start && l.startsWith('## ['))
if (end === -1) end = lines.length

// 跳过标题行本身，去掉首尾空行
const body = lines
  .slice(start + 1, end)
  .join('\n')
  .replace(/^\n+/, '')
  .replace(/\n+$/, '')

if (!body.trim()) {
  console.error(`版本 [${version}] 段落为空`)
  process.exit(1)
}

process.stdout.write(body + '\n')

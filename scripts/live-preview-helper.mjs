import { spawn } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import { createReadStream, existsSync } from "node:fs"
import { promises as fs } from "node:fs"
import { createServer } from "node:http"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..")
const CACHE_DIR = path.join(ROOT_DIR, "output", "live-preview-helper")
const WORKSPACES_DIR = path.join(CACHE_DIR, "workspaces")
const HOST = "127.0.0.1"
const DEFAULT_PORT = 4312
const PORT = resolvePort(process.argv.slice(2)) || Number(process.env.PREVIEW_HELPER_PORT || DEFAULT_PORT)

const COMMON_PROJECT_DIRS = [
  "app",
  "web",
  "site",
  "demo",
  "docs",
  "client",
  "frontend",
  "apps/web",
  "apps/app",
  "apps/site",
  "packages/web",
  "packages/app",
  "packages/site",
]

const STATIC_OUTPUT_CANDIDATES = [
  "",
  "dist",
  "build",
  "out",
  "docs",
  "storybook-static",
  "public",
  ".vercel/output/static",
]

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".htm", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".cjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".ttf", "font/ttf"],
  [".otf", "font/otf"],
  [".txt", "text/plain; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
])

const activeJobs = new Map()
const activeProcesses = new Map()

function resolvePort(args) {
  for (const arg of args) {
    if (!arg.startsWith("--port=")) continue
    const value = Number(arg.slice("--port=".length))
    if (Number.isFinite(value) && value > 0) return value
  }

  return 0
}

function commandName(name) {
  return process.platform === "win32" && ["npm", "pnpm", "yarn", "bun"].includes(name) ? `${name}.cmd` : name
}

function trimOutput(text) {
  return text.length > 30000 ? text.slice(-30000) : text
}

function log(...parts) {
  console.log("[live-preview-helper]", ...parts)
}

function normalizePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "preview"
}

function isInside(parent, child) {
  const relative = path.relative(parent, child)
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function readJsonFile(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"))
  } catch {
    return null
  }
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
}

function sendJson(res, statusCode, payload) {
  setCorsHeaders(res)
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" })
  res.end(JSON.stringify(payload))
}

function sendText(res, statusCode, message) {
  setCorsHeaders(res)
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" })
  res.end(message)
}

async function readRequestJson(req) {
  let body = ""
  for await (const chunk of req) {
    body += chunk
    if (body.length > 1024 * 1024) {
      throw new Error("Request body is too large.")
    }
  }

  return body ? JSON.parse(body) : {}
}

function parseGitHubInput(raw) {
  const value = String(raw || "").trim().replace(/\.git$/i, "")
  if (!value) {
    throw new Error("Enter a GitHub repo URL or owner/repo first.")
  }

  if (path.isAbsolute(value)) {
    return {
      kind: "local",
      localPath: path.resolve(value),
      label: path.basename(value),
      openUrl: "",
    }
  }

  if (/^file:\/\//i.test(value)) {
    const localPath = fileURLToPath(new URL(value))
    return {
      kind: "local",
      localPath,
      label: path.basename(localPath),
      openUrl: "",
    }
  }

  if (/^https?:\/\/[\w.-]+\.github\.io(?:\/.*)?$/i.test(value)) {
    return {
      kind: "pages",
      pagesUrl: new URL(value).toString(),
      openUrl: new URL(value).toString(),
    }
  }

  const short = value.match(/^([\w.-]+)\/([\w.-]+)$/)
  if (short) {
    const owner = short[1]
    const repo = short[2]
    return {
      kind: "repo",
      owner,
      repo,
      cloneUrl: `https://github.com/${owner}/${repo}.git`,
      repoUrl: `https://github.com/${owner}/${repo}`,
      openUrl: `https://github.com/${owner}/${repo}`,
      label: `${owner}/${repo}`,
    }
  }

  let parsed
  try {
    parsed = new URL(value)
  } catch {
    throw new Error("Use a GitHub repo URL, a GitHub Pages URL, or owner/repo.")
  }

  if (parsed.hostname.endsWith("github.io")) {
    return {
      kind: "pages",
      pagesUrl: parsed.toString(),
      openUrl: parsed.toString(),
    }
  }

  if (parsed.hostname !== "github.com") {
    throw new Error("Use a GitHub repo URL, a GitHub Pages URL, or owner/repo.")
  }

  const parts = parsed.pathname.split("/").filter(Boolean)
  if (parts.length < 2) {
    throw new Error("GitHub repo URLs should look like github.com/owner/repo.")
  }

  const owner = parts[0]
  const repo = parts[1]
  const mode = parts[2]
  const base = {
    kind: "repo",
    owner,
    repo,
    cloneUrl: `https://github.com/${owner}/${repo}.git`,
    repoUrl: `https://github.com/${owner}/${repo}`,
    openUrl: `https://github.com/${owner}/${repo}`,
    label: `${owner}/${repo}`,
  }

  if (mode === "tree" && parts.length >= 4) {
    return {
      ...base,
      branch: decodeURIComponent(parts[3]),
      basePath: decodeURIComponent(parts.slice(4).join("/")),
    }
  }

  if (mode === "blob" && parts.length >= 5) {
    const filePath = decodeURIComponent(parts.slice(4).join("/"))
    const dirname = normalizePath(path.posix.dirname(filePath))
    return {
      ...base,
      branch: decodeURIComponent(parts[3]),
      basePath: dirname === "." ? "" : dirname,
    }
  }

  return base
}

function detectPackageManager(projectDir, packageJson) {
  const declared = String(packageJson?.packageManager || "").split("@")[0]
  if (declared) return declared
  if (existsSync(path.join(projectDir, "pnpm-lock.yaml"))) return "pnpm"
  if (existsSync(path.join(projectDir, "yarn.lock"))) return "yarn"
  if (existsSync(path.join(projectDir, "bun.lockb")) || existsSync(path.join(projectDir, "bun.lock"))) return "bun"
  return "npm"
}

function getInstallCommand(packageManager) {
  if (packageManager === "pnpm") return { command: commandName("pnpm"), args: ["install"] }
  if (packageManager === "yarn") return { command: commandName("yarn"), args: ["install"] }
  if (packageManager === "bun") return { command: commandName("bun"), args: ["install"] }
  return { command: commandName("npm"), args: ["install"] }
}

function getRunScriptCommand(packageManager, scriptName, extraArgs = []) {
  if (packageManager === "pnpm") return { command: commandName("pnpm"), args: ["run", scriptName, "--", ...extraArgs] }
  if (packageManager === "yarn") return { command: commandName("yarn"), args: [scriptName, ...extraArgs] }
  if (packageManager === "bun") return { command: commandName("bun"), args: ["run", scriptName, "--", ...extraArgs] }
  return { command: commandName("npm"), args: ["run", scriptName, "--", ...extraArgs] }
}

function getBuildScripts(packageJson) {
  const scripts = packageJson?.scripts || {}
  const order = ["build", "docs:build", "build:docs", "storybook:build", "build:static", "export"]
  return order.filter((name) => scripts[name])
}

function getServeScript(packageJson) {
  return packageJson?.scripts?.preview ? "preview" : ""
}

function formatCommand(command, args) {
  return [command, ...args].join(" ")
}

function needsShell(command) {
  return process.platform === "win32" && command.toLowerCase().endsWith(".cmd")
}

async function runCommand(label, command, args, cwd, env = {}, timeoutMs = 15 * 60 * 1000) {
  log(label, "->", formatCommand(command, args))

  return new Promise((resolve, reject) => {
    let output = ""
    let finished = false
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      shell: needsShell(command),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    })

    const timer = setTimeout(() => {
      if (finished) return
      finished = true
      child.kill()
      reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s.`))
    }, timeoutMs)

    const onChunk = (chunk) => {
      output = trimOutput(`${output}${chunk}`)
    }

    child.stdout.on("data", (chunk) => onChunk(chunk.toString()))
    child.stderr.on("data", (chunk) => onChunk(chunk.toString()))
    child.on("error", (error) => {
      clearTimeout(timer)
      if (finished) return
      finished = true
      if (error.code === "ENOENT") {
        reject(new Error(`${command} is not installed or is not on PATH.`))
        return
      }
      reject(error)
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      if (finished) return
      finished = true
      if (code === 0) {
        resolve({ output })
        return
      }

      reject(new Error(`${label} exited with code ${code}.\n${output.trim()}`.trim()))
    })
  })
}

async function collectCandidates(rootDir, basePath) {
  const candidates = []
  const seen = new Set()
  const directTargets = []
  const requested = normalizePath(basePath)

  if (requested) {
    const requestedPath = path.join(rootDir, requested)
    if (await pathExists(requestedPath)) {
      const stats = await fs.stat(requestedPath)
      directTargets.push(stats.isDirectory() ? requestedPath : path.dirname(requestedPath))
    }
  }

  directTargets.push(rootDir)

  for (const baseDir of directTargets) {
    if (!seen.has(baseDir)) {
      seen.add(baseDir)
      const candidate = await describeCandidate(rootDir, baseDir, baseDir === rootDir ? 80 : 120)
      if (candidate) candidates.push(candidate)
    }

    for (const relative of COMMON_PROJECT_DIRS) {
      const dir = path.join(baseDir, relative)
      if (seen.has(dir) || !(await pathExists(dir))) continue
      seen.add(dir)
      const candidate = await describeCandidate(rootDir, dir, 40)
      if (candidate) candidates.push(candidate)
    }
  }

  if (!candidates.length) {
    await scanForCandidates(rootDir, rootDir, 0, seen, candidates)
  }

  return candidates
}

async function scanForCandidates(rootDir, currentDir, depth, seen, candidates) {
  if (depth > 2) return
  let entries = []
  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if ([".git", "node_modules", "dist", "build", "out", "output", "coverage"].includes(entry.name)) continue
    const childDir = path.join(currentDir, entry.name)
    if (seen.has(childDir)) continue
    seen.add(childDir)
    const candidate = await describeCandidate(rootDir, childDir, 10)
    if (candidate) candidates.push(candidate)
    await scanForCandidates(rootDir, childDir, depth + 1, seen, candidates)
  }
}

async function describeCandidate(rootDir, dir, bonusScore) {
  const packageJsonPath = path.join(dir, "package.json")
  const hasPackageJson = await pathExists(packageJsonPath)
  const staticEntry = await findStaticEntry(dir)
  if (!hasPackageJson && !staticEntry) return null

  const packageJson = hasPackageJson ? await readJsonFile(packageJsonPath) : null
  const relativePath = normalizePath(path.relative(rootDir, dir))
  const lower = relativePath.toLowerCase()
  let score = bonusScore

  if (relativePath === "") score += 25
  if (packageJson?.scripts?.build) score += 30
  if (packageJson?.scripts?.preview) score += 15
  if (packageJson?.scripts?.dev) score += 10
  if (staticEntry) score += 20
  if (/(^|\/)(app|web|site|demo|docs|client|frontend)(\/|$)/.test(lower)) score += 15

  return {
    dir,
    relativePath,
    score,
    packageJson,
    staticEntry,
  }
}

async function findProjectRoot(rootDir, basePath) {
  const candidates = await collectCandidates(rootDir, basePath)
  if (!candidates.length) {
    throw new Error("Could not find a buildable project or static HTML entry in that repository.")
  }

  candidates.sort((left, right) => right.score - left.score)
  return candidates[0]
}

async function findStaticEntry(projectDir) {
  for (const relative of STATIC_OUTPUT_CANDIDATES) {
    const candidateDir = relative ? path.join(projectDir, relative) : projectDir
    const html = path.join(candidateDir, "index.html")
    const htm = path.join(candidateDir, "index.htm")
    if (await pathExists(html)) {
      return { dir: candidateDir, indexFile: "index.html", relative }
    }
    if (await pathExists(htm)) {
      return { dir: candidateDir, indexFile: "index.htm", relative }
    }
  }

  return null
}

async function waitForUrl(url, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status < 500) return
    } catch {
      // Retry until the timeout is reached.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(`Preview server did not become ready at ${url}.`)
}

async function startServeScript(projectDir, packageManager, packageJson) {
  const serveScript = getServeScript(packageJson)
  if (!serveScript) return null

  const port = await findAvailablePort(4410)
  const extraArgs = ["--host", HOST, "--port", String(port)]
  const { command, args } = getRunScriptCommand(packageManager, serveScript, extraArgs)
  const child = spawn(command, args, {
    cwd: projectDir,
    env: { ...process.env, HOST, PORT: String(port), BROWSER: "none" },
    shell: needsShell(command),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  })

  let output = ""
  const onChunk = (chunk) => {
    output = trimOutput(`${output}${chunk}`)
  }

  child.stdout.on("data", (chunk) => onChunk(chunk.toString()))
  child.stderr.on("data", (chunk) => onChunk(chunk.toString()))

  const processId = randomUUID()
  activeProcesses.set(processId, child)

  try {
    await waitForUrl(`http://${HOST}:${port}/`)
  } catch (error) {
    child.kill()
    activeProcesses.delete(processId)
    throw new Error(`${error.message}\n${output.trim()}`.trim())
  }

  child.on("exit", () => {
    activeProcesses.delete(processId)
  })

  return {
    previewUrl: `http://${HOST}:${port}/`,
    note: `Built the repo locally and started its preview server on ${HOST}:${port}.`,
  }
}

async function findAvailablePort(startPort) {
  let port = startPort
  while (port < startPort + 200) {
    const available = await new Promise((resolve) => {
      const server = createServer()
      server.once("error", () => resolve(false))
      server.listen(port, HOST, () => {
        server.close(() => resolve(true))
      })
    })

    if (available) return port
    port += 1
  }

  throw new Error("Could not find an open local port for the preview server.")
}

async function prepareWorkspace(target) {
  await fs.mkdir(WORKSPACES_DIR, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const hash = createHash("sha1").update(JSON.stringify(target)).digest("hex").slice(0, 8)
  const slug = slugify(target.label || target.repo || target.localPath || "preview")
  const jobId = `${slug}-${stamp}-${hash}`
  const jobDir = path.join(WORKSPACES_DIR, jobId)
  await fs.mkdir(jobDir, { recursive: true })
  return { jobId, jobDir }
}

async function resolveSourceDirectory(target, jobDir) {
  if (target.kind === "local") {
    if (!(await pathExists(target.localPath))) {
      throw new Error(`Local path was not found: ${target.localPath}`)
    }
    return target.localPath
  }

  if (target.kind === "pages") {
    return ""
  }

  const repoDir = path.join(jobDir, "repo")
  const cloneArgs = ["clone", "--depth", "1"]
  if (target.branch) cloneArgs.push("--branch", target.branch)
  cloneArgs.push(target.cloneUrl, repoDir)
  await runCommand(`clone ${target.label}`, "git", cloneArgs, ROOT_DIR, {}, 10 * 60 * 1000)
  return repoDir
}

async function createPreview(target) {
  if (target.kind === "pages") {
    return {
      mode: "url",
      previewUrl: target.pagesUrl,
      openUrl: target.openUrl,
      message: `Using ${target.pagesUrl} directly because it is already a GitHub Pages preview.`,
    }
  }

  const { jobId, jobDir } = await prepareWorkspace(target)
  const sourceDir = await resolveSourceDirectory(target, jobDir)
  const project = await findProjectRoot(sourceDir, target.basePath || "")
  const packageJson = project.packageJson
  const staticBeforeBuild = await findStaticEntry(project.dir)

  if (!packageJson) {
    if (!staticBeforeBuild) {
      throw new Error("No package.json or static HTML entry was found in that repository.")
    }

    activeJobs.set(jobId, {
      kind: "static",
      rootDir: staticBeforeBuild.dir,
      indexFile: staticBeforeBuild.indexFile,
      openUrl: target.openUrl || "",
    })

    return {
      mode: "url",
      previewUrl: `http://${HOST}:${PORT}/preview/${jobId}/`,
      openUrl: target.openUrl || "",
      message: `Loaded ${project.relativePath || "the repository root"} as a static HTML preview.`,
    }
  }

  const packageManager = detectPackageManager(project.dir, packageJson)
  const installCommand = getInstallCommand(packageManager)
  await runCommand(`install dependencies in ${project.relativePath || "."}`, installCommand.command, installCommand.args, project.dir)

  let staticEntry = staticBeforeBuild?.relative ? staticBeforeBuild : null
  const buildScripts = getBuildScripts(packageJson)
  for (const scriptName of buildScripts) {
    if (staticEntry) break
    const runCommandSpec = getRunScriptCommand(packageManager, scriptName)
    await runCommand(`run ${scriptName}`, runCommandSpec.command, runCommandSpec.args, project.dir)
    staticEntry = await findStaticEntry(project.dir)
  }

  if (staticEntry) {
    activeJobs.set(jobId, {
      kind: "static",
      rootDir: staticEntry.dir,
      indexFile: staticEntry.indexFile,
      openUrl: target.openUrl || "",
    })

    const builtMessage = buildScripts.length
      ? `Cloned ${target.label || "the repo"}, built ${project.relativePath || "."}, and served ${staticEntry.relative || "its root"} locally.`
      : `Served the checked-in static output from ${project.relativePath || "."}.`

    return {
      mode: "url",
      previewUrl: `http://${HOST}:${PORT}/preview/${jobId}/`,
      openUrl: target.openUrl || "",
      message: builtMessage,
    }
  }

  const served = await startServeScript(project.dir, packageManager, packageJson)
  if (served) {
    return {
      mode: "url",
      previewUrl: served.previewUrl,
      openUrl: target.openUrl || "",
      message: served.note,
    }
  }

  throw new Error("The repo installed successfully, but no static build output or preview script could be found.")
}

async function resolveStaticRequest(staticJob, pathname) {
  const rootDir = staticJob.rootDir
  const cleanPath = decodeURIComponent(pathname || "/").replace(/^\/+/, "")

  if (!cleanPath) {
    return path.join(rootDir, staticJob.indexFile)
  }

  const directPath = path.join(rootDir, cleanPath)
  if (!isInside(rootDir, directPath)) return ""

  if (await pathExists(directPath)) {
    const stats = await fs.stat(directPath)
    if (stats.isFile()) return directPath
    const indexHtml = path.join(directPath, "index.html")
    const indexHtm = path.join(directPath, "index.htm")
    if (await pathExists(indexHtml)) return indexHtml
    if (await pathExists(indexHtm)) return indexHtm
  }

  if (!path.extname(cleanPath)) {
    const spaFallback = path.join(rootDir, staticJob.indexFile)
    if (await pathExists(spaFallback)) return spaFallback
  }

  return ""
}

async function sweepOldWorkspaces() {
  if (!(await pathExists(WORKSPACES_DIR))) return

  const cutoff = Date.now() - 1000 * 60 * 60 * 24
  const entries = await fs.readdir(WORKSPACES_DIR, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const targetDir = path.join(WORKSPACES_DIR, entry.name)
    try {
      const stats = await fs.stat(targetDir)
      if (stats.mtimeMs < cutoff) {
        await fs.rm(targetDir, { recursive: true, force: true })
      }
    } catch {
      // Best-effort cleanup only.
    }
  }
}

async function handleGithubPreview(req, res) {
  let payload
  try {
    payload = await readRequestJson(req)
  } catch (error) {
    sendJson(res, 400, { ok: false, message: error.message || "Invalid JSON body." })
    return
  }

  let target
  try {
    target = parseGitHubInput(payload.input)
  } catch (error) {
    sendJson(res, 400, { ok: false, message: error.message })
    return
  }

  try {
    const preview = await createPreview(target)
    sendJson(res, 200, { ok: true, ...preview })
  } catch (error) {
    sendJson(res, 422, {
      ok: false,
      message: error.message || "The helper could not prepare a local preview for that repo.",
    })
  }
}

async function handleStaticPreview(res, pathname) {
  const [_, __, jobId, ...rest] = pathname.split("/")
  const job = activeJobs.get(jobId)
  if (!job || job.kind !== "static") {
    sendText(res, 404, "Preview job not found.")
    return
  }

  const relativePath = rest.join("/")
  const filePath = await resolveStaticRequest(job, relativePath)
  if (!filePath) {
    sendText(res, 404, "Preview asset not found.")
    return
  }

  const extension = path.extname(filePath).toLowerCase()
  setCorsHeaders(res)
  res.writeHead(200, {
    "Content-Type": MIME_TYPES.get(extension) || "application/octet-stream",
    "Cache-Control": "no-store",
  })
  createReadStream(filePath).pipe(res)
}

function stopAllChildProcesses() {
  for (const child of activeProcesses.values()) {
    try {
      child.kill()
    } catch {
      // Ignore shutdown cleanup errors.
    }
  }
  activeProcesses.clear()
}

await fs.mkdir(WORKSPACES_DIR, { recursive: true })
await sweepOldWorkspaces()

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendText(res, 400, "Missing request URL.")
    return
  }

  if (req.method === "OPTIONS") {
    setCorsHeaders(res)
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, `http://${HOST}:${PORT}`)
  const pathname = url.pathname

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      host: HOST,
      port: PORT,
      cacheDir: CACHE_DIR,
      activePreviewCount: activeJobs.size,
    })
    return
  }

  if (req.method === "POST" && pathname === "/api/github-preview") {
    await handleGithubPreview(req, res)
    return
  }

  if (req.method === "GET" && pathname.startsWith("/preview/")) {
    await handleStaticPreview(res, pathname)
    return
  }

  sendText(res, 404, "Not found.")
})

server.listen(PORT, HOST, () => {
  log(`running on http://${HOST}:${PORT}`)
  log(`workspace cache -> ${CACHE_DIR}`)
})

process.on("SIGINT", () => {
  stopAllChildProcesses()
  server.close(() => process.exit(0))
})

process.on("SIGTERM", () => {
  stopAllChildProcesses()
  server.close(() => process.exit(0))
})

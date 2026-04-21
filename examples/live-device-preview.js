const $ = (id) => document.getElementById(id)
const iosFrame = $("iosFrame")
const androidFrame = $("androidFrame")
const urlInput = $("urlInput")
const githubInput = $("githubInput")
const htmlInput = $("htmlInput")
const folderInput = $("folderInput")
const statusNode = $("status")
const helperStatusNode = $("helperStatus")
const openSourceButton = $("openSource")
const devices = $("devices")
const layoutButtons = Array.from(document.querySelectorAll("[data-layout]"))
const loadDemoButton = $("loadDemo")

const HELPER_ORIGINS = [
  "http://127.0.0.1:4312",
  "http://localhost:4312",
]

const state = {
  activeBlobUrls: new Set(),
  openUrl: "",
  helperOrigin: "",
}

const GITHUB_ENTRY_CANDIDATES = [
  "dist/index.html",
  "build/index.html",
  "out/index.html",
  "docs/index.html",
  "public/index.html",
  "storybook-static/index.html",
  "index.html",
]

const demo = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      *{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      body{min-height:100vh;padding:24px;background:linear-gradient(180deg,#fff8ef 0%,#e8f4ee 100%);color:#102033;display:flex;flex-direction:column;justify-content:space-between}
      .hero{display:flex;flex-direction:column;gap:14px;padding-top:28px}.tag{width:fit-content;padding:9px 12px;border-radius:999px;background:rgba(16,32,51,.08);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      h1{margin:0;font-size:38px;line-height:.96;letter-spacing:-.05em;max-width:290px}.sub{margin:0;font-size:16px;line-height:1.45;color:rgba(16,32,51,.72);max-width:300px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card{padding:16px;border-radius:22px;background:rgba(255,255,255,.78);box-shadow:0 14px 30px rgba(24,45,71,.08)}.card strong{display:block;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:rgba(16,32,51,.52);margin-bottom:6px}.card span{font-size:18px;font-weight:700;line-height:1.3}
      .cta{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-radius:24px;background:#102033;color:#fff}.cta b{font-size:20px}.cta small{display:block;opacity:.72;font-size:13px}.btn{padding:12px 16px;border-radius:999px;background:#fff;color:#102033;font-weight:800}
    </style>
  </head>
  <body>
    <section class="hero">
      <div class="tag">Built-in demo</div>
      <h1>Preview a real page inside device chrome.</h1>
      <p class="sub">This sample is loaded by the live preview tool itself, so you can confirm the framing flow instantly.</p>
      <div class="grid">
        <div class="card"><strong>Input</strong><span>URL, GitHub, HTML, or folder</span></div>
        <div class="card"><strong>Output</strong><span>iOS and Android previews side by side</span></div>
      </div>
    </section>
    <section class="cta">
      <div><small>device-chrome-react</small><b>JSX-first device preview</b></div>
      <div class="btn">Working</div>
    </section>
  </body>
</html>`

const welcome = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      *{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      body{min-height:100vh;display:grid;place-items:center;padding:28px;background:linear-gradient(180deg,#fff8ef 0%,#edf7f3 100%);color:#102033}
      .card{width:min(100%,320px);padding:24px;border-radius:28px;background:rgba(255,255,255,.82);box-shadow:0 20px 40px rgba(24,45,71,.12);display:flex;flex-direction:column;gap:14px}
      .tag{width:fit-content;padding:9px 12px;border-radius:999px;background:rgba(16,32,51,.08);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      h1{margin:0;font-size:30px;line-height:.98;letter-spacing:-.05em}p,li{margin:0;color:rgba(16,32,51,.72);line-height:1.5}ul{margin:0;padding-left:18px}
    </style>
  </head>
  <body>
    <div class="card">
      <div class="tag">Live preview</div>
      <h1>Load a source on the left.</h1>
      <p>Paste a URL, load a GitHub repo, choose local HTML, or hit Load demo.</p>
      <ul>
        <li>Public site or localhost URL</li>
        <li>GitHub repo, blob file, or Pages URL</li>
        <li>Single HTML file</li>
        <li>Best-effort static folder preview</li>
      </ul>
    </div>
  </body>
</html>`

function setStatus(message, tone = "") {
  statusNode.textContent = message
  statusNode.className = `status${tone ? ` ${tone}` : ""}`
}

function setHelperStatus(message) {
  if (helperStatusNode) helperStatusNode.textContent = message
}

function clearBlobs() {
  for (const url of state.activeBlobUrls) {
    URL.revokeObjectURL(url)
  }
  state.activeBlobUrls.clear()
}

function trackBlobFromFile(file) {
  const url = URL.createObjectURL(file)
  state.activeBlobUrls.add(url)
  return url
}

function applyUrlPreview(url, message, tone = "ok", openUrl = url) {
  iosFrame.removeAttribute("srcdoc")
  androidFrame.removeAttribute("srcdoc")
  iosFrame.src = url
  androidFrame.src = url
  state.openUrl = openUrl || ""
  openSourceButton.disabled = !state.openUrl
  setStatus(message, tone)
}

function applyHtmlPreview(html, message, tone = "ok", openUrl = "") {
  iosFrame.removeAttribute("src")
  androidFrame.removeAttribute("src")
  iosFrame.srcdoc = html
  androidFrame.srcdoc = html
  state.openUrl = openUrl || ""
  openSourceButton.disabled = !state.openUrl
  setStatus(message, tone)
}

function showWelcome() {
  clearBlobs()
  applyHtmlPreview(welcome, "Ready. Paste a URL, load a GitHub repo, upload local HTML, or load the built-in demo.")
}

function loadBuiltInDemo() {
  clearBlobs()
  applyHtmlPreview(demo, "Loaded the built-in demo page inside both device shells.", "ok")
}

async function fetchWithTimeout(resource, options = {}, timeoutMs = 1500) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(resource, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function detectHelper(force = false) {
  if (state.helperOrigin && !force) return state.helperOrigin

  setHelperStatus("Checking whether the local GitHub helper is available...")

  for (const origin of HELPER_ORIGINS) {
    try {
      const response = await fetchWithTimeout(`${origin}/api/health`, { headers: { Accept: "application/json" } }, 1500)
      if (!response.ok) continue
      state.helperOrigin = origin
      setHelperStatus(`Local GitHub helper detected at ${origin}. Repo URLs can use clone/build/serve mode.`)
      return origin
    } catch {
      // Try the next origin.
    }
  }

  state.helperOrigin = ""
  setHelperStatus("Local helper not detected. Repo URLs will fall back to GitHub Pages or checked-in static HTML previews.")
  return ""
}

function looksLikeHost(value) {
  return /^(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3}|[\w.-]+\.[a-z]{2,})(?::\d+)?(?:[/?#].*)?$/i.test(value)
}

function toAbsoluteUrl(raw) {
  const value = raw.trim()
  if (!value) throw new Error("Enter a URL first.")
  if (/^(https?:|file:|blob:|data:)/i.test(value)) return new URL(value).toString()
  if (looksLikeHost(value)) {
    const scheme = /^(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})/i.test(value) ? "http://" : "https://"
    return new URL(`${scheme}${value}`).toString()
  }
  throw new Error("That does not look like a valid URL or hostname.")
}

function encodePath(path) {
  return path.split("/").filter(Boolean).map(encodeURIComponent).join("/")
}

function normalizePath(path) {
  return String(path || "").replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "").replace(/\/+/g, "/")
}

function dirname(path) {
  const parts = normalizePath(path).split("/").filter(Boolean)
  parts.pop()
  return parts.join("/")
}

function splitRef(value) {
  const index = value.search(/[?#]/)
  return index === -1 ? { path: value, suffix: "" } : { path: value.slice(0, index), suffix: value.slice(index) }
}

function isRelativeRef(value) {
  const ref = value.trim()
  if (!ref || ref.startsWith("#") || ref.startsWith("mailto:") || ref.startsWith("tel:") || ref.startsWith("javascript:")) return false
  return !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(ref) && !ref.startsWith("//")
}

function resolvePath(baseDir, ref) {
  const { path } = splitRef(ref)
  const stack = path.startsWith("/") ? [] : normalizePath(baseDir).split("/").filter(Boolean)
  for (const part of path.split("/")) {
    if (!part || part === ".") continue
    if (part === "..") {
      stack.pop()
      continue
    }
    stack.push(part)
  }
  return stack.join("/")
}

function rewriteCss(text, baseDir, getAssetUrl) {
  return text.replace(/url\(([^)]+)\)/gi, (match, raw) => {
    const cleaned = raw.trim().replace(/^['"]|['"]$/g, "")
    if (!isRelativeRef(cleaned)) return match
    const assetUrl = getAssetUrl(resolvePath(baseDir, cleaned))
    return assetUrl ? `url("${assetUrl}")` : match
  })
}

function prefixPath(prefix, path) {
  const cleanPrefix = normalizePath(prefix)
  const cleanPath = normalizePath(path)
  if (!cleanPrefix) return cleanPath
  if (!cleanPath) return cleanPrefix
  return `${cleanPrefix}/${cleanPath}`
}

function buildCdnUrl(owner, repo, branch, path = "") {
  const repoPath = path ? `/${encodePath(path)}` : ""
  return `https://cdn.jsdelivr.net/gh/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}@${encodeURIComponent(branch)}${repoPath}`
}

function inferPagesUrl(owner, repo) {
  return repo.toLowerCase() === `${owner.toLowerCase()}.github.io`
    ? `https://${owner}.github.io/`
    : `https://${owner}.github.io/${repo}/`
}

function parseGitHubInput(raw) {
  const value = raw.trim().replace(/\.git$/i, "")
  if (!value) throw new Error("Enter a GitHub URL or owner/repo first.")
  if (/^https?:\/\/[\w.-]+\.github\.io(?:\/.*)?$/i.test(value)) {
    return { kind: "pages", url: new URL(value).toString() }
  }

  const short = value.match(/^([\w.-]+)\/([\w.-]+)$/)
  if (short) {
    return { kind: "repo", owner: short[1], repo: short[2] }
  }

  const parsed = new URL(toAbsoluteUrl(value))
  if (parsed.hostname.endsWith("github.io")) {
    return { kind: "pages", url: parsed.toString() }
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

  if (mode === "blob" && parts.length >= 5) {
    return {
      kind: "blob",
      owner,
      repo,
      branch: decodeURIComponent(parts[3]),
      filePath: decodeURIComponent(parts.slice(4).join("/")),
      repoUrl: `https://github.com/${owner}/${repo}`,
    }
  }

  if (mode === "tree" && parts.length >= 4) {
    return {
      kind: "tree",
      owner,
      repo,
      branch: decodeURIComponent(parts[3]),
      basePath: decodeURIComponent(parts.slice(4).join("/")),
      repoUrl: `https://github.com/${owner}/${repo}`,
    }
  }

  return {
    kind: "repo",
    owner,
    repo,
    repoUrl: `https://github.com/${owner}/${repo}`,
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}.`)
  }

  return response.json()
}

async function getDefaultBranch(owner, repo) {
  const data = await fetchJson(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`)
  return data.default_branch
}

async function getRepoTree(owner, repo, branch) {
  const data = await fetchJson(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`)
  return Array.isArray(data.tree) ? data.tree : []
}

function chooseGitHubHtmlEntry(tree, basePath = "") {
  const prefix = normalizePath(basePath)
  const treePaths = new Set(
    tree
      .filter((entry) => entry.type === "blob" && entry.path.toLowerCase().endsWith(".html"))
      .map((entry) => normalizePath(entry.path)),
  )

  for (const candidate of GITHUB_ENTRY_CANDIDATES) {
    const candidatePath = prefixPath(prefix, candidate)
    if (treePaths.has(candidatePath)) {
      return candidatePath
    }
  }

  if (prefix) {
    const prefixedIndex = `${prefix}/index.html`
    if (treePaths.has(prefixedIndex)) {
      return prefixedIndex
    }
  }

  const htmlFiles = Array.from(treePaths).filter((path) => !path.startsWith("node_modules/"))
  const prefixMatches = prefix
    ? htmlFiles.filter((path) => path === prefix || path.startsWith(`${prefix}/`))
    : htmlFiles

  const firstIndex = prefixMatches.find((path) => path.toLowerCase().endsWith("/index.html"))
  if (firstIndex) return firstIndex

  return prefixMatches[0] || ""
}

function ensureHead(doc) {
  if (!doc.head) {
    const head = doc.createElement("head")
    doc.documentElement.insertBefore(head, doc.body || null)
  }
  return doc.head
}

function rewriteRootRelativeNodeAttributes(doc, assetRoot) {
  const attrs = [
    ["img", "src"],
    ["script", "src"],
    ["source", "src"],
    ["video", "src"],
    ["audio", "src"],
    ["track", "src"],
    ["iframe", "src"],
    ["object", "data"],
    ["embed", "src"],
    ["link", "href"],
    ["a", "href"],
  ]

  for (const [selector, attr] of attrs) {
    for (const node of Array.from(doc.querySelectorAll(`${selector}[${attr}]`))) {
      const current = node.getAttribute(attr)
      if (!current || !current.startsWith("/") || current.startsWith("//")) continue
      node.setAttribute(attr, `${assetRoot}${current}`)
    }
  }
}

function rewriteRootRelativeCssUrls(doc, assetRoot) {
  const replacer = (text) => text.replace(/url\(([^)]+)\)/gi, (match, raw) => {
    const cleaned = raw.trim().replace(/^['"]|['"]$/g, "")
    if (!cleaned.startsWith("/") || cleaned.startsWith("//")) return match
    return `url("${assetRoot}${cleaned}")`
  })

  for (const node of Array.from(doc.querySelectorAll("style"))) {
    node.textContent = replacer(node.textContent || "")
  }

  for (const node of Array.from(doc.querySelectorAll("[style]"))) {
    const value = node.getAttribute("style")
    if (value) node.setAttribute("style", replacer(value))
  }
}

async function buildGitHubHtmlPreview(owner, repo, branch, htmlPath) {
  const htmlUrl = buildCdnUrl(owner, repo, branch, htmlPath)
  const response = await fetch(htmlUrl)
  if (!response.ok) {
    throw new Error(`Could not load ${htmlPath} from GitHub (${response.status}).`)
  }

  const html = await response.text()
  const doc = new DOMParser().parseFromString(html, "text/html")
  const head = ensureHead(doc)
  const base = doc.createElement("base")
  const dir = dirname(htmlPath)
  base.href = `${buildCdnUrl(owner, repo, branch, dir)}${dir ? "/" : "/"}`
  head.prepend(base)

  const assetRoot = buildCdnUrl(owner, repo, branch)
  rewriteRootRelativeNodeAttributes(doc, assetRoot)
  rewriteRootRelativeCssUrls(doc, assetRoot)

  return {
    html: `<!doctype html>\n${doc.documentElement.outerHTML}`,
    sourceUrl: htmlUrl,
  }
}

async function tryHelperGitHubPreview(rawInput) {
  const origin = await detectHelper()
  if (!origin) return null

  const response = await fetch(`${origin}/api/github-preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ input: rawInput }),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || "The local helper could not build that repository.")
  }

  return payload
}

async function loadGitHubPreviewFromInput() {
  const rawInput = githubInput.value
  const target = parseGitHubInput(rawInput)

  if (target.kind === "pages") {
    clearBlobs()
    applyUrlPreview(target.url, `Previewing ${target.url}`, "ok", target.url)
    return
  }

  if (target.kind !== "blob") {
    try {
      setStatus("Trying the local GitHub helper for clone/build/serve preview...", "")
      const helperResult = await tryHelperGitHubPreview(rawInput)
      if (helperResult?.mode === "url") {
        clearBlobs()
        applyUrlPreview(helperResult.previewUrl, helperResult.message, "ok", helperResult.openUrl || helperResult.previewUrl)
        return
      }
    } catch (error) {
      setStatus(`${error.message} Falling back to browser-only GitHub preview.`, "warn")
    }
  }

  setStatus("Looking for a GitHub preview candidate...", "")

  if (target.kind === "blob" && /\.html?$/i.test(target.filePath)) {
    clearBlobs()
    const rendered = await buildGitHubHtmlPreview(target.owner, target.repo, target.branch, target.filePath)
    applyHtmlPreview(rendered.html, `Loaded ${target.filePath} from ${target.owner}/${target.repo}.`, "ok", target.repoUrl || rendered.sourceUrl)
    return
  }

  const branch = target.branch || await getDefaultBranch(target.owner, target.repo)
  const tree = await getRepoTree(target.owner, target.repo, branch)
  const entry = chooseGitHubHtmlEntry(tree, target.basePath || "")

  if (entry) {
    clearBlobs()
    const rendered = await buildGitHubHtmlPreview(target.owner, target.repo, branch, entry)
    applyHtmlPreview(rendered.html, `Loaded ${entry} from ${target.owner}/${target.repo}.`, "ok", target.repoUrl || rendered.sourceUrl)
    return
  }

  clearBlobs()
  const pagesUrl = inferPagesUrl(target.owner, target.repo)
  applyUrlPreview(
    pagesUrl,
    `No static HTML file was found in ${target.owner}/${target.repo}. Falling back to ${pagesUrl}. If it stays blank, GitHub Pages may not be enabled or you may want to run npm run preview:helper for clone/build/serve support.`,
    "warn",
    target.repoUrl || pagesUrl,
  )
}

async function buildFolderPreview(fileList) {
  const files = Array.from(fileList || [])
  const map = new Map(files.map((file) => [normalizePath(file.webkitRelativePath || file.name), file]))
  const entry = map.has("index.html")
    ? "index.html"
    : map.has("index.htm")
      ? "index.htm"
      : Array.from(map.keys()).find((key) => /(?:^|\/)index\.html?$/i.test(key)) || Array.from(map.keys()).find((key) => /\.html?$/i.test(key))

  if (!entry) throw new Error("Could not find an HTML entry file in that folder.")

  const cache = new Map()
  let warn = false
  const getAssetUrl = (path) => {
    const normalized = normalizePath(path)
    if (!map.has(normalized)) return ""
    if (!cache.has(normalized)) cache.set(normalized, trackBlobFromFile(map.get(normalized)))
    return cache.get(normalized)
  }

  const doc = new DOMParser().parseFromString(await map.get(entry).text(), "text/html")
  const entryDir = dirname(entry)

  for (const link of Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'))) {
    const href = link.getAttribute("href")
    if (!href || !isRelativeRef(href)) continue
    const cssPath = resolvePath(entryDir, href)
    if (!map.has(cssPath)) continue
    const style = doc.createElement("style")
    style.textContent = rewriteCss(await map.get(cssPath).text(), dirname(cssPath), getAssetUrl)
    link.replaceWith(style)
  }

  for (const node of Array.from(doc.querySelectorAll("style"))) {
    node.textContent = rewriteCss(node.textContent || "", entryDir, getAssetUrl)
  }

  for (const node of Array.from(doc.querySelectorAll("[style]"))) {
    const styleValue = node.getAttribute("style")
    if (styleValue) node.setAttribute("style", rewriteCss(styleValue, entryDir, getAssetUrl))
  }

  const attrs = [["img", "src"], ["script", "src"], ["source", "src"], ["video", "src"], ["audio", "src"], ["track", "src"], ["iframe", "src"], ["object", "data"], ["embed", "src"], ["link", "href"]]
  for (const [selector, attr] of attrs) {
    for (const node of Array.from(doc.querySelectorAll(`${selector}[${attr}]`))) {
      if (selector === "link" && String(node.getAttribute("rel") || "").toLowerCase() === "stylesheet") continue
      const current = node.getAttribute(attr)
      if (!current || !isRelativeRef(current)) continue
      const assetUrl = getAssetUrl(resolvePath(entryDir, current))
      if (assetUrl) node.setAttribute(attr, `${assetUrl}${splitRef(current).suffix}`)
    }
  }

  if (doc.querySelector('script[type="module"][src]')) warn = true

  return {
    html: `<!doctype html>\n${doc.documentElement.outerHTML}`,
    warn,
    message: warn
      ? `Loaded ${entry}. Relative ES module imports may still need a dev server URL.`
      : `Loaded ${entry} from the selected folder.`,
  }
}

function loadUrlFromInput() {
  try {
    clearBlobs()
    const url = toAbsoluteUrl(urlInput.value)
    applyUrlPreview(url, `Loaded ${url}`, "ok", url)
  } catch (error) {
    setStatus(error.message, "warn")
  }
}

async function loadGitHubFromInput() {
  try {
    await loadGitHubPreviewFromInput()
  } catch (error) {
    setStatus(error.message || "GitHub preview could not be loaded.", "warn")
  }
}

function setLayout(layout) {
  devices.className = `devices layout-${layout}`
  layoutButtons.forEach((button) => button.classList.toggle("active", button.dataset.layout === layout))
}

$("loadUrl").addEventListener("click", loadUrlFromInput)
$("loadGithub").addEventListener("click", () => {
  void loadGitHubFromInput()
})
loadDemoButton.addEventListener("click", loadBuiltInDemo)

urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loadUrlFromInput()
})

githubInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault()
    void loadGitHubFromInput()
  }
})

htmlInput.addEventListener("change", async () => {
  const file = htmlInput.files && htmlInput.files[0]
  if (!file) return
  try {
    clearBlobs()
    applyHtmlPreview(await file.text(), `Loaded ${file.name}. Inline assets work best in this mode.`, "ok")
  } catch (error) {
    setStatus(`Could not open ${file.name}. ${error.message}`, "warn")
  }
})

folderInput.addEventListener("change", async () => {
  if (!folderInput.files || !folderInput.files.length) return
  try {
    clearBlobs()
    const result = await buildFolderPreview(folderInput.files)
    applyHtmlPreview(result.html, result.message, result.warn ? "warn" : "ok")
  } catch (error) {
    setStatus(error.message, "warn")
  }
})

openSourceButton.addEventListener("click", () => {
  if (state.openUrl) window.open(state.openUrl, "_blank", "noopener,noreferrer")
})

$("reset").addEventListener("click", () => {
  urlInput.value = ""
  githubInput.value = ""
  htmlInput.value = ""
  folderInput.value = ""
  showWelcome()
})

layoutButtons.forEach((button) => {
  button.addEventListener("click", () => setLayout(button.dataset.layout))
})

const params = new URLSearchParams(window.location.search)
const presetLayout = params.get("layout")
if (["both", "ios", "android"].includes(presetLayout)) setLayout(presetLayout)
else setLayout("both")

void detectHelper()

if (params.get("demo") === "1") {
  loadBuiltInDemo()
} else if (params.get("url")) {
  urlInput.value = params.get("url")
  loadUrlFromInput()
} else if (params.get("github")) {
  githubInput.value = params.get("github")
  void loadGitHubFromInput()
} else {
  showWelcome()
}

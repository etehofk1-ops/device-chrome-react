# device-chrome-react

Modern, JSX-first iOS and Android device chrome components for React.

`device-chrome-react` is built for landing pages, product showcases, mockups, and live previews where you want to render real React UI inside a device shell instead of dropping in static screenshots.

![device-chrome-react preview](./media/readme-preview.png)

## Why this exists

Most device-frame packages are optimized for:
- screenshot wrappers
- iframe previews
- large, older CSS device catalogs

This package takes a different angle:
- modern iOS and Android chrome
- real `children` composition
- self-contained TSX components
- lightweight usage in marketing pages and demos

The goal is simple: make device framing feel like normal React composition.

## What ships today

- `IOSDeviceFrame`
- `IOSStatusBar`
- `IOSDynamicIsland`
- `IOSHomeIndicator`
- `AndroidDeviceFrame`
- `AndroidStatusBar`
- `AndroidAppBar`
- `AndroidGestureBar`

## Install

```bash
npm install device-chrome-react
```

If the package name is unavailable at publish time, rename it before release.

## Usage

```tsx
import { AndroidDeviceFrame, IOSDeviceFrame } from "device-chrome-react"

export default function Preview() {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <IOSDeviceFrame width={390} height={844}>
        <div
          style={{
            height: "100%",
            background: "#f5efe4",
            padding: 24,
          }}
        >
          iOS screen content
        </div>
      </IOSDeviceFrame>

      <AndroidDeviceFrame width={412} height={892} title="Preview">
        <div
          style={{
            height: "100%",
            background: "#f4fbf8",
            padding: 24,
          }}
        >
          Android screen content
        </div>
      </AndroidDeviceFrame>
    </div>
  )
}
```

`IOSDeviceFrame` applies iPhone-style top and bottom safe-area insets by default so real pages do not collide with the status chrome. Pass `contentInsets={false}` if you want full edge-to-edge control.

## Repo preview asset

The screenshot above is generated from the actual React components in this repo.

```bash
npm install
npm run preview:render
```

That command refreshes [examples/readme-preview.html](./examples/readme-preview.html), which can be opened directly in a browser before recapturing [media/readme-preview.png](./media/readme-preview.png).

## Live Preview Tool

For quick no-build checks, open [examples/live-device-preview.html](./examples/live-device-preview.html) directly in a browser. The browser tool keeps source inputs inside one compact tabbed card, so you can switch between URL, GitHub, HTML, and folder previews without scrolling through a long sidebar. Use `Load demo` for an instant built-in sample before pasting your own URL.

For broader GitHub repo support, run the optional local helper in a separate terminal:

```bash
npm install
npm run preview:helper
```

That helper listens on `http://127.0.0.1:4312` and lets the browser tool turn a GitHub repo into a local preview by cloning, installing, building, and serving it when possible.

It supports:
- public site URLs
- localhost or dev server URLs
- GitHub Pages URLs
- GitHub repo URLs and `owner/repo` shorthand
- GitHub `blob/.../*.html` file URLs
- a single local HTML file
- a best-effort static folder preview based on `index.html`
- shareable presets with query params like `?url=https://your-preview`, `?github=owner/repo`, `?source=github`, or `?demo=1`
- portrait and landscape toggle controls with auto-scaled device shells on smaller screens

GitHub preview order:
- if the local helper is running and you paste a repo URL, it first tries `clone -> install -> build -> serve`
- if you paste a GitHub Pages URL, it loads that directly
- if you paste a GitHub blob URL to an HTML file, it renders that file through a CDN-backed preview
- if you paste a repo URL without the helper, it looks for common static HTML entry files such as `dist/index.html`, `build/index.html`, `docs/index.html`, or `index.html`
- if no static entry is found, it falls back to the inferred GitHub Pages URL

Notes:
- Services that block iframe embeds with `X-Frame-Options` or `frame-ancestors` will not render inside the tool.
- The helper path works best for public repos with a standard Node-based build and either a static output directory or a `preview` script.
- Without the helper, GitHub repo previews work best for public repositories with built static output checked in.
- The folder uploader is best for static HTML/CSS/image bundles. JS-heavy apps usually work better through a local dev server URL.

## Why only two device types?

Because early focus is a feature, not a limitation.

Many open-source device-frame libraries have broad catalogs, but they often end up:
- visually dated
- screenshot-first instead of JSX-first
- heavier than they need to be for simple marketing and preview use cases

This project is intentionally starting with:
- one strong modern iOS shell
- one strong modern Android shell
- clean React-first composition

That is enough to make the positioning clear for a strong v0. More variants can follow once the core API and visual direction are solid.

## Roadmap ideas

- iPhone size variants
- Pixel size variants
- tablet frames
- browser window frames
- landscape support
- safe-area helper overlays
- motion presets for showcase layouts

## Disclaimer

This package is unofficial and is not affiliated with Apple or Google.
It is intended for mockups, previews, marketing pages, and design showcases.

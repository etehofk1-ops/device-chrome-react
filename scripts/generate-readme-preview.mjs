import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { AndroidDeviceFrame, IOSDeviceFrame } from "../dist/index.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
const outputPath = path.join(projectRoot, "examples", "readme-preview.html")

const h = React.createElement

function pill(label, background, color) {
  return h(
    "div",
    {
      style: {
        padding: "10px 14px",
        borderRadius: 999,
        background,
        color,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      },
    },
    label,
  )
}

function metric(value, label) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 96,
      },
    },
    h(
      "span",
      {
        style: {
          fontSize: 28,
          fontWeight: 800,
          color: "#102033",
        },
      },
      value,
    ),
    h(
      "span",
      {
        style: {
          fontSize: 13,
          color: "rgba(16,32,51,0.68)",
        },
      },
      label,
    ),
  )
}

function infoCard(title, body, accent) {
  return h(
    "div",
    {
      style: {
        borderRadius: 24,
        padding: 20,
        background: "rgba(255,255,255,0.72)",
        boxShadow: "0 14px 30px rgba(53, 77, 103, 0.08)",
        border: `1px solid ${accent}`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      },
    },
    h(
      "div",
      {
        style: {
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "rgba(12, 32, 54, 0.56)",
        },
      },
      title,
    ),
    h(
      "div",
      {
        style: {
          fontSize: 18,
          fontWeight: 700,
          color: "#122033",
          lineHeight: 1.3,
        },
      },
      body,
    ),
  )
}

const iosContent = h(
  "div",
  {
    style: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "98px 24px 32px",
      background: "linear-gradient(180deg, #fff8ef 0%, #f6e3cf 46%, #f7efe4 100%)",
      boxSizing: "border-box",
    },
  },
  h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 18,
      },
    },
    h(
      "div",
      {
        style: {
          display: "inline-flex",
          alignSelf: "flex-start",
          padding: "10px 14px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.72)",
          color: "#6f5333",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        },
      },
      "New collection",
    ),
    h(
      "div",
      {
        style: {
          fontSize: 42,
          lineHeight: 1.02,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: "#1c1813",
          maxWidth: 280,
        },
      },
      "Design device previews as real JSX.",
    ),
    h(
      "div",
      {
        style: {
          fontSize: 17,
          lineHeight: 1.45,
          color: "rgba(28,24,19,0.72)",
          maxWidth: 292,
        },
      },
      "Drop product UI directly into a polished shell instead of flattening it into a screenshot.",
    ),
    h(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginTop: 10,
        },
      },
      infoCard("iOS shell", "Modern dynamic island and status chrome.", "rgba(193, 139, 87, 0.24)"),
      infoCard("React-first", "Live children composition, not screenshot wrappers.", "rgba(193, 139, 87, 0.24)"),
    ),
  ),
  h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 28,
        padding: 20,
        background: "rgba(255,255,255,0.82)",
        boxShadow: "0 16px 36px rgba(80, 56, 32, 0.12)",
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 4,
        },
      },
      h(
        "span",
        {
          style: {
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "rgba(28,24,19,0.54)",
          },
        },
        "Ready to ship",
      ),
      h(
        "span",
        {
          style: {
            fontSize: 20,
            fontWeight: 700,
            color: "#1c1813",
          },
        },
        "iOS + Android v0",
      ),
    ),
    h(
      "div",
      {
        style: {
          padding: "12px 18px",
          borderRadius: 999,
          background: "#1c1813",
          color: "#fff8ef",
          fontSize: 15,
          fontWeight: 700,
        },
      },
      "Publish",
    ),
  ),
)

function listRow(title, subtitle, tint) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: 16,
        borderRadius: 22,
        background: "rgba(255,255,255,0.78)",
        border: "1px solid rgba(82, 94, 87, 0.08)",
      },
    },
    h("div", {
      style: {
        width: 44,
        height: 44,
        borderRadius: 16,
        background: tint,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
      },
    }),
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 4,
          flex: 1,
        },
      },
      h(
        "span",
        {
          style: {
            fontSize: 17,
            fontWeight: 700,
            color: "#17211c",
          },
        },
        title,
      ),
      h(
        "span",
        {
          style: {
            fontSize: 14,
            color: "rgba(23,33,28,0.62)",
          },
        },
        subtitle,
      ),
    ),
  )
}

const androidContent = h(
  "div",
  {
    style: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 18,
      padding: 20,
      background: "linear-gradient(180deg, #f4fbf8 0%, #e7f3ee 100%)",
      boxSizing: "border-box",
    },
  },
  h(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 12,
      },
    },
    metric("2", "shells"),
    metric("JSX", "first"),
    metric("v0", "focus"),
  ),
  h(
    "div",
    {
      style: {
        borderRadius: 28,
        padding: 22,
        background: "linear-gradient(135deg, #0e6b52 0%, #1e8a6b 100%)",
        color: "white",
        boxShadow: "0 18px 36px rgba(20, 82, 63, 0.22)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      },
    },
    h(
      "div",
      {
        style: {
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          opacity: 0.76,
        },
      },
      "Android preview",
    ),
    h(
      "div",
      {
        style: {
          fontSize: 30,
          lineHeight: 1.08,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          maxWidth: 260,
        },
      },
      "Start narrow. Make the difference obvious.",
    ),
    h(
      "div",
      {
        style: {
          fontSize: 15,
          lineHeight: 1.45,
          opacity: 0.84,
          maxWidth: 270,
        },
      },
      "One modern iOS shell and one modern Android shell are enough to define the product clearly.",
    ),
  ),
  h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12,
      },
    },
    listRow("Dynamic island", "Built into the iOS frame for current-looking marketing mockups.", "linear-gradient(135deg, #c4efe0 0%, #9ad9c3 100%)"),
    listRow("Material shell", "Android app bar and gesture chrome tuned for modern product previews.", "linear-gradient(135deg, #d5f5e7 0%, #b7ecd5 100%)"),
    listRow("Composition first", "Render cards, dashboards, and hero layouts as actual React children.", "linear-gradient(135deg, #f4f4d8 0%, #ebe39e 100%)"),
  ),
)

const page = h(
  "div",
  {
    style: {
      minHeight: "100vh",
      padding: "72px 48px 96px",
      boxSizing: "border-box",
      background: "radial-gradient(circle at top left, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 40%), linear-gradient(135deg, #f7efe4 0%, #edf7f3 55%, #e6f1ff 100%)",
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: "#102033",
    },
  },
  h(
    "div",
    {
      style: {
        maxWidth: 1480,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 44,
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: 760,
          },
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            },
          },
          pill("device-chrome-react", "rgba(16,32,51,0.08)", "#102033"),
          pill("iOS + Android", "rgba(12,123,95,0.12)", "#0e6b52"),
        ),
        h(
          "h1",
          {
            style: {
              margin: 0,
              fontSize: 72,
              lineHeight: 0.96,
              letterSpacing: "-0.06em",
              fontWeight: 900,
              maxWidth: 840,
            },
          },
          "Modern device chrome for JSX-first previews.",
        ),
        h(
          "p",
          {
            style: {
              margin: 0,
              fontSize: 22,
              lineHeight: 1.45,
              color: "rgba(16,32,51,0.72)",
              maxWidth: 760,
            },
          },
          "Build landing-page mockups and live product previews with real React content inside polished iOS and Android shells.",
        ),
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          },
        },
        pill("Screenshot-free composition", "rgba(255,255,255,0.74)", "#102033"),
        pill("Narrow by design", "rgba(255,255,255,0.74)", "#102033"),
      ),
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          gap: 40,
          justifyContent: "center",
          alignItems: "flex-start",
          flexWrap: "wrap",
        },
      },
      h(IOSDeviceFrame, { width: 390, height: 844 }, iosContent),
      h(AndroidDeviceFrame, { width: 412, height: 892, title: "Overview" }, androidContent),
    ),
  ),
)

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>device-chrome-react preview</title>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; }
      body { min-width: 1440px; }
    </style>
  </head>
  <body>${renderToStaticMarkup(page)}</body>
</html>
`

await fs.writeFile(outputPath, html, "utf8")
console.log(`Wrote ${path.relative(projectRoot, outputPath)}`)

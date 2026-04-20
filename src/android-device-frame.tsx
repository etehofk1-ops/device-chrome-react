import type { CSSProperties, ReactNode } from "react"

const MATERIAL = {
  surface: "#F4FBF8",
  frameBorder: "rgba(116,119,117,0.5)",
  onSurface: "#171D1B",
  onSurfaceVariant: "#49454F",
} as const

export interface AndroidDeviceFrameProps {
  children: ReactNode
  width?: number | string
  height?: number | string
  dark?: boolean
  time?: string
  title?: string
  largeTitle?: boolean
  showStatusBar?: boolean
  showAppBar?: boolean
  showGestureBar?: boolean
  style?: CSSProperties
  screenStyle?: CSSProperties
}

export function AndroidStatusBar({ dark = false, time = "9:30" }: { dark?: boolean; time?: string }) {
  const color = dark ? "#FFFFFF" : MATERIAL.onSurface

  return (
    <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", position: "relative", fontFamily: 'Roboto, system-ui, sans-serif' }}>
      <div style={{ width: 128, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 400, letterSpacing: 0.25, lineHeight: "20px", color }}>{time}</span>
      </div>
      <div style={{ position: "absolute", left: "50%", top: 8, transform: "translateX(-50%)", width: 24, height: 24, borderRadius: 999, background: "#2E2E2E" }} />
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", paddingRight: 2 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: -2 }} aria-hidden="true"><path d="M8 13.3L.67 5.97a10.37 10.37 0 0114.66 0L8 13.3z" fill={color} /></svg>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: -2 }} aria-hidden="true"><path d="M14.67 14.67V1.33L1.33 14.67h13.34z" fill={color} /></svg>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="3.75" y="2" width="8.5" height="13" rx="1.5" fill={color} />
          <rect x="5.5" y="0.9" width="5" height="2" rx="0.5" fill={color} />
        </svg>
      </div>
    </div>
  )
}

export function AndroidAppBar({ title = "Title", large = false, dark = false }: { title?: string; large?: boolean; dark?: boolean }) {
  const textColor = dark ? "#FFFFFF" : MATERIAL.onSurface
  const iconColor = dark ? "rgba(255,255,255,0.3)" : "rgba(73,69,79,0.3)"
  const iconDot = <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 22, height: 22, borderRadius: 999, background: iconColor }} /></div>

  return (
    <div style={{ background: dark ? "#1D1B20" : MATERIAL.surface, padding: "4px 4px 0" }}>
      <div style={{ height: 56, display: "flex", alignItems: "center", gap: 4 }}>
        {iconDot}
        {!large ? <span style={{ flex: 1, fontSize: 22, fontWeight: 400, color: textColor, fontFamily: 'Roboto, system-ui, sans-serif' }}>{title}</span> : <div style={{ flex: 1 }} />}
        {iconDot}
      </div>
      {large ? <div style={{ padding: "16px 16px 20px", fontSize: 28, fontWeight: 400, color: textColor, fontFamily: 'Roboto, system-ui, sans-serif' }}>{title}</div> : null}
    </div>
  )
}

export function AndroidGestureBar({ dark = false }: { dark?: boolean }) {
  return <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 108, height: 4, borderRadius: 2, background: dark ? "#FFFFFF" : MATERIAL.onSurface, opacity: 0.4 }} /></div>
}

export function AndroidDeviceFrame({ children, width = 412, height = 892, dark = false, time = "9:30", title, largeTitle = false, showStatusBar = true, showAppBar = true, showGestureBar = true, style, screenStyle }: AndroidDeviceFrameProps) {
  return (
    <div style={{ width, height, overflow: "hidden", display: "flex", flexDirection: "column", boxSizing: "border-box", borderRadius: 18, border: `8px solid ${MATERIAL.frameBorder}`, background: dark ? "#1D1B20" : MATERIAL.surface, boxShadow: "0 30px 80px rgba(0,0,0,0.25)", ...style }}>
      {showStatusBar ? <AndroidStatusBar dark={dark} time={time} /> : null}
      {showAppBar ? <AndroidAppBar title={title} large={largeTitle} dark={dark} /> : null}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", ...screenStyle }}>{children}</div>
      {showGestureBar ? <AndroidGestureBar dark={dark} /> : null}
    </div>
  )
}

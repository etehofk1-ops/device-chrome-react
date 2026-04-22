import type { CSSProperties, ReactNode } from "react"

const IOS_TOP_SAFE_AREA = 59
const IOS_BOTTOM_SAFE_AREA = 34

export interface IOSContentInsets {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

export interface IOSDeviceFrameProps {
  children: ReactNode
  width?: number | string
  height?: number | string
  dark?: boolean
  time?: string
  showStatusBar?: boolean
  showDynamicIsland?: boolean
  showHomeIndicator?: boolean
  style?: CSSProperties
  screenStyle?: CSSProperties
  contentInsets?: false | IOSContentInsets
}

export interface IOSStatusBarProps {
  dark?: boolean
  time?: string
  style?: CSSProperties
}

export function IOSStatusBar({ dark = false, time = "9:41", style }: IOSStatusBarProps) {
  const color = dark ? "#FFFFFF" : "#000000"

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "21px 24px 19px", pointerEvents: "none", ...style }}>
      <div style={{ flex: 1, height: 22, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 1.5 }}>
        <span style={{ color, fontFamily: '-apple-system, "SF Pro", system-ui', fontSize: 17, fontWeight: 590, lineHeight: "22px" }}>{time}</span>
      </div>
      <div style={{ flex: 1, height: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, paddingTop: 1, paddingRight: 1 }}>
        <svg width="19" height="12" viewBox="0 0 19 12" aria-hidden="true">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={color} />
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={color} />
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={color} />
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={color} />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12" aria-hidden="true">
          <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" fill={color} />
          <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" fill={color} />
          <circle cx="8.5" cy="10.5" r="1.5" fill={color} />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={color} strokeOpacity="0.35" fill="none" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill={color} />
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill={color} fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  )
}

export function IOSDynamicIsland() {
  return <div aria-hidden="true" style={{ position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)", zIndex: 30, width: 126, height: 37, borderRadius: 24, background: "#000000", pointerEvents: "none" }} />
}

export function IOSHomeIndicator({ dark = false }: { dark?: boolean }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 30, height: 34, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 8, pointerEvents: "none" }}>
      <div style={{ width: 139, height: 5, borderRadius: 999, background: dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.25)" }} />
    </div>
  )
}

function resolveContentInsets(showStatusBar: boolean, showDynamicIsland: boolean, showHomeIndicator: boolean, contentInsets: false | IOSContentInsets | undefined) {
  if (contentInsets === false) {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }

  return {
    top: contentInsets?.top ?? (showStatusBar || showDynamicIsland ? IOS_TOP_SAFE_AREA : 0),
    right: contentInsets?.right ?? 0,
    bottom: contentInsets?.bottom ?? (showHomeIndicator ? IOS_BOTTOM_SAFE_AREA : 0),
    left: contentInsets?.left ?? 0,
  }
}

export function IOSDeviceFrame({ children, width = 402, height = 874, dark = false, time = "9:41", showStatusBar = true, showDynamicIsland = true, showHomeIndicator = true, style, screenStyle, contentInsets }: IOSDeviceFrameProps) {
  const insets = resolveContentInsets(showStatusBar, showDynamicIsland, showHomeIndicator, contentInsets)

  return (
    <div style={{ position: "relative", overflow: "hidden", width, height, borderRadius: 48, background: dark ? "#000000" : "#F5EFE4", boxShadow: "0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)", fontFamily: '-apple-system, system-ui, sans-serif', WebkitFontSmoothing: "antialiased", ...style }}>
      {showDynamicIsland ? <IOSDynamicIsland /> : null}
      {showStatusBar ? <IOSStatusBar dark={dark} time={time} /> : null}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", overflow: "hidden", boxSizing: "border-box", paddingTop: insets.top, paddingRight: insets.right, paddingBottom: insets.bottom, paddingLeft: insets.left, ...screenStyle }}>{children}</div>
      {showHomeIndicator ? <IOSHomeIndicator dark={dark} /> : null}
    </div>
  )
}

import type { ReactNode } from "react";

/** Shared artwork for favicon / PWA icons (speech bubble — interviews). */
export function AppIconArt(): ReactNode {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#2563eb",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "58%",
          height: "52%",
          background: "#ffffff",
          borderRadius: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          paddingBottom: 8,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            background: "#2563eb",
            opacity: 0.35,
          }}
        />
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            background: "#2563eb",
            opacity: 0.55,
          }}
        />
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            background: "#2563eb",
            opacity: 0.85,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -18,
            left: 28,
            width: 0,
            height: 0,
            borderLeft: "16px solid transparent",
            borderRight: "16px solid transparent",
            borderTop: "22px solid #ffffff",
          }}
        />
      </div>
    </div>
  );
}

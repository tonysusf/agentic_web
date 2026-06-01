import { ImageResponse } from "next/og";

export const alt = "Agentic Lite AI assistant";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbfbfa",
          color: "#302e2a",
          fontFamily: "Arial, Helvetica, sans-serif"
        }}
      >
        <div
          style={{
            display: "flex",
            width: "1060px",
            height: "500px",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "58px 66px",
            background: "#ffffff",
            border: "2px solid #e1e1dc",
            borderRadius: "36px",
            boxShadow: "0 36px 90px rgba(46, 45, 42, 0.12)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                display: "flex",
                width: "58px",
                height: "58px",
                alignItems: "center",
                justifyContent: "center",
                color: "#fbfbfa",
                background: "#171715",
                borderRadius: "16px",
                fontSize: "34px",
                fontWeight: 700,
                transform: "rotate(-12deg)"
              }}
            >
              A
            </div>
            <div
              style={{
                fontFamily: "Georgia, Times New Roman, serif",
                fontSize: "58px",
                fontWeight: 700,
                letterSpacing: 0
              }}
            >
              agentic
            </div>
            <div
              style={{
                padding: "10px 18px",
                color: "#77736c",
                border: "2px solid #d9d9d4",
                borderRadius: "14px",
                fontSize: "28px",
                fontWeight: 700
              }}
            >
              Lite
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div
              style={{
                fontFamily: "Georgia, Times New Roman, serif",
                fontSize: "72px",
                lineHeight: 1.04,
                letterSpacing: 0
              }}
            >
              What can I do for you?
            </div>
            <div
              style={{
                maxWidth: "790px",
                color: "#5f5c56",
                fontSize: "32px",
                lineHeight: 1.35
              }}
            >
              A lightweight AI assistant for quick answers, writing, research, and task planning.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#85827c",
              fontSize: "24px",
              fontWeight: 700
            }}
          >
            <span>agentic.im996.com</span>
            <span>Ask anything. Get moving.</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}

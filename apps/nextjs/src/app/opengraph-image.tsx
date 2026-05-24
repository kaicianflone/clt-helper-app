import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#B23A1F",
          color: "#F5EFE6",
          fontSize: 96,
          fontFamily: "system-ui",
        }}
      >
        <div style={{ fontWeight: 700, letterSpacing: -2 }}>clt-app</div>
        <div style={{ fontSize: 32, marginTop: 16, opacity: 0.85 }}>
          Charlotte&apos;s open guide
        </div>
      </div>
    ),
    { ...size }
  );
}

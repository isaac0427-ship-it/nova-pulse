import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0F1923",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "26px solid #C9A84C",
        }}
      >
        <span
          style={{
            color: "#C9A84C",
            fontSize: 300,
            fontWeight: 700,
            fontFamily: "Georgia, serif",
            lineHeight: 1,
          }}
        >
          N
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}

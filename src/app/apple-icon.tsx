import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            width: 130,
            height: 130,
            border: "3px solid #C9A84C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: "#C9A84C",
              fontSize: 82,
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            N
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          border: "1.5px solid #C9A84C",
        }}
      >
        <span
          style={{
            color: "#C9A84C",
            fontSize: 19,
            fontWeight: 700,
            fontFamily: "Georgia, serif",
            lineHeight: 1,
            marginTop: 1,
          }}
        >
          N
        </span>
      </div>
    ),
    { ...size }
  );
}

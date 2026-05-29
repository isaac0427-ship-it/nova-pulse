interface NovaLogoProps {
  size?: number;
}

export function NovaLogo({ size = 44 }: NovaLogoProps) {
  const border = Math.max(1.5, size / 22);
  const fontSize = Math.round(size * 0.52);

  return (
    <div
      style={{
        width: size,
        height: size,
        border: `${border}px solid #C9A84C`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: "rgba(201,168,76,0.04)",
      }}
    >
      <span
        style={{
          color: "#C9A84C",
          fontWeight: 700,
          fontSize,
          lineHeight: 1,
          userSelect: "none",
          letterSpacing: "-0.02em",
        }}
      >
        N
      </span>
    </div>
  );
}

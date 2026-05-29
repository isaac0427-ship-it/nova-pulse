"use client";

interface OperationalScoreGaugeProps {
  score: number;
  size?: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Needs Attention";
  return "Critical";
}

export function OperationalScoreGauge({ score, size = 160 }: OperationalScoreGaugeProps) {
  const center = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.065;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const dashOffset = circumference * (1 - clampedScore / 100);
  const color = getScoreColor(clampedScore);
  const label = getScoreLabel(clampedScore);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1F2230"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease",
            filter: `drop-shadow(0 0 ${size * 0.05}px ${color}60)`,
          }}
        />
        {/* Center text (counter-rotate) */}
        <g transform={`rotate(90, ${center}, ${center})`}>
          <text
            x={center}
            y={center - size * 0.04}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize={size * 0.22}
            fontWeight={600}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {clampedScore}
          </text>
          <text
            x={center}
            y={center + size * 0.15}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#7C8494"
            fontSize={size * 0.075}
            fontWeight={500}
            letterSpacing="0.06em"
            textDecoration="none"
          >
            / 100
          </text>
        </g>
      </svg>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
          Operational Health
        </div>
      </div>
    </div>
  );
}

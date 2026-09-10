import { Button as EmailButton, Section, Text } from "@react-email/components"
import { BRAND } from "../layout"

type Accent = "gold" | "navy"

export function CtaButton({ label, url, accent = "navy" }: { label: string; url: string; accent?: Accent }) {
  const bg = accent === "gold" ? BRAND.gold : BRAND.navy
  const color = accent === "gold" ? BRAND.navy : "#ffffff"
  return (
    <Section style={{ textAlign: "center", margin: "28px 0" }}>
      <EmailButton
        href={url}
        style={{
          background: bg,
          color,
          padding: "14px 34px",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          textDecoration: "none",
          fontWeight: "bold",
          borderRadius: 2,
        }}
      >
        {label}
      </EmailButton>
    </Section>
  )
}

type BoxAccent = "gold" | "success" | "warning" | "danger"

const ACCENT_COLORS: Record<BoxAccent, { border: string; bg: string }> = {
  gold: { border: BRAND.gold, bg: BRAND.cream },
  success: { border: "#2f7d54", bg: "#e9f4ee" },
  warning: { border: "#9a6a12", bg: "#fbf3e2" },
  danger: { border: "#a33131", bg: "#f8ecec" },
}

export function InfoBox({ children, accent = "gold" }: { children: React.ReactNode; accent?: BoxAccent }) {
  const { border, bg } = ACCENT_COLORS[accent]
  return (
    <Section
      style={{
        background: bg,
        borderLeft: `3px solid ${border}`,
        padding: "18px 22px",
        margin: "24px 0",
        fontFamily: "Helvetica, Arial, sans-serif",
        fontSize: 14,
        lineHeight: 1.6,
        color: BRAND.ink,
      }}
    >
      {children}
    </Section>
  )
}

export function DetailList({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{ margin: "24px 0", borderTop: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}` }}
    >
      {rows.map((r) => (
        <tr key={r.label}>
          <td
            style={{
              padding: "8px 0",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: 13,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: BRAND.muted,
              width: "42%",
              verticalAlign: "top",
            }}
          >
            {r.label}
          </td>
          <td style={{ padding: "8px 0", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 15, color: BRAND.ink, fontWeight: "bold" }}>
            {r.value}
          </td>
        </tr>
      ))}
    </table>
  )
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: "0 0 16px 0", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 15, lineHeight: 1.7, color: BRAND.ink }}>{children}</Text>
}

export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 20px 0",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 26,
        lineHeight: 1.3,
        fontWeight: "normal",
        color: BRAND.navy,
      }}
    >
      {children}
    </Text>
  )
}

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

const tones = {
  danger: { icon: AlertTriangle },
  warning: { icon: AlertTriangle },
  info: { icon: Info },
  success: { icon: CheckCircle2 },
};

export function AlertBanner({
  tone = "info",
  title,
  children,
  icon: CustomIcon,
  className = "",
}) {
  const toneConfig = tones[tone] || tones.info;
  const Icon = CustomIcon || toneConfig.icon;

  return (
    <section className={["alert-banner", `alert-banner-${tone}`, className].filter(Boolean).join(" ")}>
      <Icon size={18} className="alert-banner-icon" />
      <div>
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
      </div>
    </section>
  );
}

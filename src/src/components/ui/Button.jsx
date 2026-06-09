const variantStyles = {
  primary: {
    background: "linear-gradient(180deg, #334155, #1e293b)",
    color: "white",
    border: "1px solid #1e293b",
    boxShadow: "0 10px 22px rgba(15, 23, 42, 0.16)",
  },
  secondary: {
    background: "#ffffff",
    color: "#1e293b",
    border: "1px solid #d5dde8",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },
  danger: {
    background: "#b42318",
    color: "white",
    border: "1px solid #b42318",
    boxShadow: "0 10px 22px rgba(180, 35, 24, 0.14)",
  },
  ghost: {
    background: "transparent",
    color: "#334155",
    border: "1px solid transparent",
    boxShadow: "none",
  },
};

const sizeStyles = {
  sm: {
    padding: "7px 10px",
    fontSize: "12px",
  },
  md: {
    padding: "10px 13px",
    fontSize: "13px",
  },
  lg: {
    padding: "12px 16px",
    fontSize: "14px",
  },
};

const disabledStyles = {
  opacity: 0.52,
  cursor: "not-allowed",
  transform: "none",
  boxShadow: "none",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  style,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  isLoading = false,
  disabled = false,
  ...props
}) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        "ui-button",
        `ui-button-${variant}`,
        `ui-button-${size}`,
        fullWidth ? "ui-button-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        borderRadius: "12px",
        fontWeight: 760,
        lineHeight: 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.16s ease",
        textDecoration: "none",
        width: fullWidth ? "100%" : undefined,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...(isDisabled ? disabledStyles : {}),
        ...style,
      }}
      {...props}
    >
      {isLoading ? <span className="ui-button-spinner" aria-hidden="true" /> : null}
      {LeftIcon && !isLoading ? <LeftIcon size={15} /> : null}
      <span>{children}</span>
      {RightIcon ? <RightIcon size={15} /> : null}
    </button>
  );
}

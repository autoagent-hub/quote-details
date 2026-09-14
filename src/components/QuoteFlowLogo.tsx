import { Link } from "@tanstack/react-router";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  withText?: boolean;
  withDomain?: boolean;
  className?: string;
  linkToHome?: boolean;
  textClassName?: string;
  imgClassName?: string;
}

const sizeMap = {
  xs: { img: "size-5", text: "text-xs", container: "gap-1.5", domain: "text-[9px]" },
  sm: { img: "size-6", text: "text-sm", container: "gap-2", domain: "text-[10px]" },
  md: { img: "size-7", text: "text-base", container: "gap-2", domain: "text-xs" },
  lg: { img: "size-8", text: "text-lg", container: "gap-2.5", domain: "text-xs" },
  xl: { img: "size-10", text: "text-xl", container: "gap-3", domain: "text-sm" },
};

export function DetailrLogo({
  size = "md",
  withText = true,
  withDomain = false,
  className = "",
  linkToHome = false,
  textClassName = "",
  imgClassName = "",
}: LogoProps) {
  const config = sizeMap[size];

  const content = (
    <span
      className={`inline-flex items-center ${config.container} font-display font-bold tracking-tight ${className}`}
    >
      <img
        src="/favicon.png"
        alt="Detailr logo"
        className={`${config.img} shrink-0 rounded-lg object-contain shadow-xs transition-transform hover:scale-105 ${imgClassName}`}
        loading="eager"
      />
      {withText && (
        <span className={`inline-flex items-baseline gap-0.5 ${config.text} ${textClassName}`}>
          <span>Detailr</span>
          {withDomain ? (
            <span className="font-mono text-primary font-medium">.online</span>
          ) : (
            <span className="text-primary font-black">.</span>
          )}
        </span>
      )}
    </span>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-flex items-center focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

export const QuoteFlowLogo = DetailrLogo;

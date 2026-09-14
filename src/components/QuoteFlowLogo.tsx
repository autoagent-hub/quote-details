import { Link } from "@tanstack/react-router";

interface QuoteFlowLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  withText?: boolean;
  className?: string;
  linkToHome?: boolean;
  textClassName?: string;
  imgClassName?: string;
}

const sizeMap = {
  xs: { img: "size-5", text: "text-xs", container: "gap-1.5" },
  sm: { img: "size-6", text: "text-sm", container: "gap-2" },
  md: { img: "size-7", text: "text-base", container: "gap-2" },
  lg: { img: "size-8", text: "text-lg", container: "gap-2.5" },
  xl: { img: "size-10", text: "text-xl", container: "gap-3" },
};

export function QuoteFlowLogo({
  size = "md",
  withText = true,
  className = "",
  linkToHome = false,
  textClassName = "",
  imgClassName = "",
}: QuoteFlowLogoProps) {
  const config = sizeMap[size];

  const content = (
    <span
      className={`inline-flex items-center ${config.container} font-display font-bold ${className}`}
    >
      <img
        src="/favicon.png"
        alt="QuoteFlow logo"
        className={`${config.img} shrink-0 rounded-lg object-contain shadow-xs transition-transform hover:scale-105 ${imgClassName}`}
        loading="eager"
      />
      {withText && <span className={`${config.text} ${textClassName}`}>QuoteFlow</span>}
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

import { useState, ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
  aspectRatio?: string;
}

export function LazyImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  fallbackSrc,
  aspectRatio,
  style,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-800/60 animate-pulse rounded-inherit" />
      )}

      {hasError ? (
        <div className="flex h-full w-full min-h-[100px] items-center justify-center bg-slate-900 text-slate-500 rounded-inherit border border-slate-800 p-2">
          {fallbackSrc ? (
            <img
              src={fallbackSrc}
              alt={alt || "Image fallback"}
              loading="lazy"
              decoding="async"
              className={`h-full w-full object-cover ${className}`}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-[11px]">
              <ImageOff className="size-5 text-slate-600" />
              <span>Image unavailable</span>
            </div>
          )}
        </div>
      ) : (
        <img
          src={src}
          alt={alt || "Detailr image"}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          style={style}
          {...props}
        />
      )}
    </div>
  );
}

import { cn } from "@/lib/utils"
import Image from "next/image"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  fallback?: string;
}

export function Avatar({ src, fallback, className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/10 p-0.5 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.2)]",
        className
      )}
      {...props}
    >
      <div className="h-full w-full overflow-hidden rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center">
        {src ? (
          <Image
            src={src}
            alt={fallback || "Avatar"}
            width={40}
            height={40}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs font-bold uppercase text-muted-foreground">
            {fallback?.substring(0, 2) || "??"}
          </span>
        )}
      </div>
    </div>
  )
}

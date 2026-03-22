import * as React from "react";

import { cn } from "@/lib/utils";

type GlassCardProps = React.ComponentProps<"div"> & {
  strong?: boolean;
};

export default function GlassCard({
  className,
  strong = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "card-glass rounded-[28px]",
        strong && "card-glass-strong",
        className
      )}
      {...props}
    />
  );
}

import Link from "next/link";
import { AequanLogo as AequanLogoSvg } from "@/components/AequanLogo";
import { cn } from "@/app/utils/cn";

type AequanLogoLinkProps = {
  className?: string;
  href?: string;
  showText?: boolean;
  height?: number;
};

/** Linked AEQUAN logo for navigation shells (sidebar, navbar). */
export function AequanLogo({
  className,
  href = "/dashboard",
  showText = true,
  height = 40,
}: AequanLogoLinkProps) {
  const mark = (
    <AequanLogoSvg showText={showText} height={height} className={cn("shrink-0", className)} />
  );

  if (href) {
    return (
      <Link href={href} className="aequan-interactive hover:opacity-90 shrink-0">
        {mark}
      </Link>
    );
  }

  return mark;
}

/** Icon-only brand mark for constrained contexts. */
export function AequanMark({ className, height = 32 }: { className?: string; height?: number }) {
  return <AequanLogoSvg showText={false} height={height} className={className} />;
}

import { forwardRef } from "react";

// This component has been intentionally disabled to remove the "Skip to content" link
// that appears briefly during page load.

export interface SkipLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

/**
 * SkipLink component - disabled version that doesn't render anything.
 */
const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ className, children, href, ...props }, ref) => {
    // Return null to render nothing
    return null;
  }
);

SkipLink.displayName = "SkipLink";

export { SkipLink };
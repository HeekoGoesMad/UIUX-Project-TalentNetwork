import Link from "next/link";

const footerLinks = [
  { href: "/search", label: "Search talent" },
  { href: "/shortlist", label: "Shortlist" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto flex flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <Link href="/" className="font-semibold tracking-tight">
            talent<span className="text-primary">network</span>
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Thoughtful recruiting, with more signal.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

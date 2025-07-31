import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto py-6 px-4 md:flex md:items-center md:justify-between">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          © {new Date().getFullYear()} Lucky Six. All Rights Reserved.
        </p>
        <div className="flex justify-center space-x-6 mt-4 md:mt-0">
          <Link
            href="#"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}

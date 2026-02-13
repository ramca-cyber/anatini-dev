import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PageMeta } from "@/components/shared/PageMeta";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
    <PageMeta title="Page Not Found — Anatini.dev" description="The page you're looking for doesn't exist. Browse 28+ free offline data tools at Anatini.dev." />
    <div className="container flex items-center justify-center py-32">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">Page not found</p>
        <a href="/" className="inline-flex items-center gap-2 border-2 border-border bg-foreground px-5 py-2.5 text-sm font-bold text-background transition-all hover:shadow-xs">
          Return to Home
        </a>
      </div>
    </div>
    </>
  );
};

export default NotFound;

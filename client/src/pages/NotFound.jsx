import { Link } from "react-router-dom";
import { CompassIcon } from "lucide-react";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
      <div className="rounded-full bg-brand-50 p-4 text-brand-600">
        <CompassIcon size={36} />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900">Page not found</h1>
      <p className="text-slate-500">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Button as={Link} to="/">
        Back to home
      </Button>
    </div>
  );
}

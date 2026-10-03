import React from "react";
import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5">
          <Compass className="w-7 h-7" aria-hidden="true" />
        </div>
        <p className="text-sm font-mono font-semibold text-blue-600">404</p>
        <h1 className="mt-1 text-3xl font-display font-extrabold text-slate-900">Page not found</h1>
        <p className="mt-2 text-slate-600">The page you're looking for doesn't exist or has moved.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/">
            <Button><ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back home</Button>
          </Link>
          <Link to="/events">
            <Button variant="outline">Browse events</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";

// Auth removed (repo-as-database design)
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: () => new Response("Not found", { status: 404 }),
      POST: () => new Response("Not found", { status: 404 }),
    },
  },
});

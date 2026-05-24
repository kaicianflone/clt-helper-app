import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createServerCaller } from "~/trpc/server";
import { ContributeWrapper } from "./_components/wrapper";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ verify?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  let name = slug;
  try {
    const caller = await createServerCaller();
    const g = await caller.greenway.get({ slug });
    name = g.name;
  } catch {
    // swallow
  }

  return {
    title: `Suggest an edit — ${name}`,
    description: `Help keep ${name} accurate by suggesting corrections.`,
  };
}

export default async function ContributeGreenwayPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { verify } = await searchParams;
  const verifyOnly = verify === "yes";

  const caller = await createServerCaller();
  let greenway;
  try {
    greenway = await caller.greenway.get({ slug });
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-8">
      <h1 className="font-display text-4xl font-bold tracking-tight text-[color:var(--fg-ink)]">
        Suggest an edit
      </h1>
      <p className="mt-2 text-base text-[color:var(--fg-ink-soft)]">
        Your edit will become a pull request. Be specific.
      </p>
      <Link
        href={`/greenways/${slug}`}
        className="mt-2 inline-flex items-center gap-1 text-sm text-[color:var(--fg-ink-soft)] hover:text-[color:var(--brick)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to {greenway.name}
      </Link>

      <div className="mt-8">
        <ContributeWrapper
          slug={slug}
          initialName={greenway.name}
          initialLengthMiles={greenway.lengthMiles}
          initialDescription={greenway.description}
          initialSurface={greenway.surface}
          verifyOnly={verifyOnly}
        />
      </div>
    </main>
  );
}

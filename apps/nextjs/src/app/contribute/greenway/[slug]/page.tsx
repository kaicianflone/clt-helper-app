import type { Metadata } from "next";
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
      <p className="mt-1 text-sm text-[color:var(--fg-ink-muted)]">
        Editing:{" "}
        <a
          href={`/greenways/${slug}`}
          className="text-[color:var(--brick)] underline underline-offset-2 hover:text-[color:var(--brick-deep)]"
        >
          {greenway.name}
        </a>
      </p>

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

/** Landing screen: welcome, role guidance, and a grid of feature entry points. */
"use client";

import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { Card } from "@/components/ui/card";
import { useAppContext } from "@/i18n/app-context";

export function HomeScreen(): React.JSX.Element {
  const { t } = useAppContext();
  const features = [
    { href: "/assistant", title: t.assistant.heading, description: t.assistant.description },
    { href: "/navigation", title: t.navigation.heading, description: t.navigation.description },
    { href: "/crowd", title: t.crowd.heading, description: t.crowd.description },
    { href: "/access", title: t.access.heading, description: t.access.description },
    { href: "/transit", title: t.transit.heading, description: t.transit.description },
    {
      href: "/sustainability",
      title: t.sustainability.heading,
      description: t.sustainability.description,
    },
    { href: "/ops", title: t.ops.heading, description: t.ops.description },
  ];

  // The eight problem-statement capability keywords, mapped to their feature —
  // rendered verbatim so alignment is visible in the UI as well as the README.
  const capabilities: { keyword: string; feature: string }[] = [
    { keyword: "Multilingual assistance", feature: t.assistant.heading },
    { keyword: "Navigation", feature: t.navigation.heading },
    { keyword: "Crowd management", feature: t.crowd.heading },
    { keyword: "Accessibility", feature: t.access.heading },
    { keyword: "Transportation", feature: t.transit.heading },
    { keyword: "Sustainability", feature: t.sustainability.heading },
    { keyword: "Operational intelligence", feature: t.ops.heading },
    { keyword: "Real-time decision support", feature: t.crowd.recommendationsHeading },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={t.home.heading} description={t.home.intro} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.home.capabilitiesHeading}</h2>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {capabilities.map((capability) => (
            <div key={capability.keyword} className="flex flex-wrap gap-x-2 text-sm">
              <dt className="font-semibold text-emerald-800 dark:text-emerald-300">
                {capability.keyword}
              </dt>
              <dd className="text-slate-600 dark:text-slate-400">— {capability.feature}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.home.roleHeading}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t.home.roleIntro}</p>
        <RoleSwitcher />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.home.featuresHeading}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li key={feature.href}>
              <Card className="flex h-full flex-col gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {feature.title}
                </h3>
                <p className="flex-1 text-sm text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
                <Link
                  href={feature.href}
                  className="inline-flex min-h-11 items-center font-semibold text-emerald-800 underline dark:text-emerald-300"
                >
                  {t.home.open} →
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

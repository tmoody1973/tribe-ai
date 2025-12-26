import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PowerToolsSection } from "@/components/landing/PowerToolsSection";
import { DashboardPreviewSection } from "@/components/landing/DashboardPreviewSection";
import { WhoIsItForSection } from "@/components/landing/WhoIsItForSection";
import { CorridorsMapSection } from "@/components/landing/CorridorsMapSection";
import { CTASection } from "@/components/landing/CTASection";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Home() {
  const t = useTranslations("landing");

  return (
    <main className="min-h-screen">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b-4 border-black">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-head text-2xl font-bold">
            TRIBE
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              href="/sign-in"
              className="font-bold text-sm hover:underline hidden sm:block"
            >
              {t("signIn")}
            </Link>
            <Link
              href="/sign-up"
              className="bg-black text-white px-4 py-2 font-bold text-sm border-2 border-black hover:bg-yellow-400 hover:text-black transition-colors"
            >
              {t("getStarted")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        title={t("title")}
        subtitle={t("heroSubtitle")}
        tagline={t("tagline")}
        ctaText={t("getStarted")}
        secondaryCtaText={t("learnMore")}
      />

      {/* How It Works */}
      <HowItWorksSection
        title={t("howItWorks.title")}
        subtitle={t("howItWorks.subtitle")}
      />

      {/* Features */}
      <FeaturesSection
        title={t("features.title")}
        subtitle={t("features.subtitle")}
      />

      {/* Dashboard Preview */}
      <DashboardPreviewSection
        title={t("dashboardPreview.title")}
        subtitle={t("dashboardPreview.subtitle")}
        ctaText={t("dashboardPreview.cta")}
      />

      {/* Power Tools */}
      <PowerToolsSection
        title={t("powerTools.title")}
        subtitle={t("powerTools.subtitle")}
      />

      {/* Who Is It For */}
      <WhoIsItForSection
        title={t("whoIsItFor.title")}
        subtitle={t("whoIsItFor.subtitle")}
      />

      {/* Corridors Map */}
      <CorridorsMapSection
        title={t("corridors.title")}
        subtitle={t("corridors.subtitle")}
      />

      {/* CTA */}
      <CTASection
        title={t("cta.title")}
        subtitle={t("cta.subtitle")}
        ctaText={t("cta.button")}
        subCtaText={t("cta.badge")}
      />

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="font-head text-3xl mb-2">TRIBE</h3>
              <p className="text-gray-400">{t("footer.tagline")}</p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <Link href="/sign-up" className="hover:text-yellow-400 transition-colors">
                {t("getStarted")}
              </Link>
              <Link href="/sign-in" className="hover:text-yellow-400 transition-colors">
                {t("signIn")}
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>{t("footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

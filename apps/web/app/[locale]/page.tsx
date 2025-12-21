import { Button } from "@/components/retroui/Button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Home() {
  const t = useTranslations("landing");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <h1 className="font-head text-4xl md:text-6xl text-center">
        {t("title")}
      </h1>
      <p className="text-xl text-muted-foreground text-center max-w-md">
        {t("subtitle")}
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/sign-up">
          <Button>{t("getStarted")}</Button>
        </Link>
        <Button variant="secondary">{t("learnMore")}</Button>
      </div>
    </main>
  );
}

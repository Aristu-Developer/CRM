import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";

import { LandingNav }        from "@/components/landing/LandingNav";
import { HeroSection }       from "@/components/landing/HeroSection";
import { ValueStrip }        from "@/components/landing/ValueStrip";
import { FeaturesSection }   from "@/components/landing/FeaturesSection";
import { WhyNepalSection }   from "@/components/landing/WhyNepalSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ProductPreview }    from "@/components/landing/ProductPreview";
import { BenefitsSection }   from "@/components/landing/BenefitsSection";
import { CtaSection }        from "@/components/landing/CtaSection";
import { LandingFooter }     from "@/components/landing/LandingFooter";

export const metadata = {
  title: "Nepal CRM — Manage Sales, Dues & Inventory",
  description:
    "Track customers, record sales, collect dues, and manage inventory. The simple CRM built for Nepali small and medium businesses.",
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const ctaHref = session ? "/dashboard" : "/register";

  return (
    <div className="min-h-screen bg-white">
      <LandingNav ctaHref={ctaHref} />
      <main>
        <HeroSection       ctaHref={ctaHref} />
        <ValueStrip />
        <FeaturesSection />
        <WhyNepalSection />
        <HowItWorksSection />
        <ProductPreview />
        <BenefitsSection />
        <CtaSection        ctaHref={ctaHref} />
      </main>
      <LandingFooter />
    </div>
  );
}

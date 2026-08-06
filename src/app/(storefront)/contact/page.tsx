import { type Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/features/contact/components/contact-form";
import { MaskReveal, Reveal } from "@/features/storefront/components/reveal";
import { formatStoreAddress, storeConfig } from "@/config/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Dope Store.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-24 sm:px-8 sm:pt-36 sm:pb-32">
      <div className="mb-14 max-w-2xl sm:mb-20">
        <Reveal>
          <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
            We&apos;re listening
          </p>
        </Reveal>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-6xl">
          <MaskReveal delay={0.05}>Get in touch</MaskReveal>
        </h1>
        <Reveal delay={0.15}>
          <p className="text-muted-foreground mt-5 text-sm leading-relaxed">
            Questions about an order, a fit, or a pickup? Send us a note — we
            reply fast.
          </p>
        </Reveal>
      </div>

      <div className="grid gap-14 lg:grid-cols-[1fr_360px] lg:gap-20">
        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>

        <Reveal delay={0.2} className="space-y-8">
          <ContactRow icon={Mail} label="Email">
            <a
              href={`mailto:${storeConfig.email}`}
              className="hover:text-gold transition-colors"
            >
              {storeConfig.email}
            </a>
          </ContactRow>
          <ContactRow icon={Phone} label="Phone">
            <a
              href={storeConfig.phoneHref}
              className="hover:text-gold transition-colors"
            >
              {storeConfig.phone}
            </a>
          </ContactRow>
          <ContactRow icon={MapPin} label="Store">
            <span className="leading-relaxed">{formatStoreAddress()}</span>
            <span className="text-muted-foreground mt-1 block text-xs">
              {storeConfig.hours}
            </span>
          </ContactRow>

          <div className="border-border border-t pt-8">
            <p className="text-muted-foreground/70 text-[11px] font-medium tracking-[0.2em] uppercase">
              Follow
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <a
                href={storeConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 hover:text-foreground w-fit transition-colors"
              >
                Instagram
              </a>
              <a
                href={storeConfig.social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 hover:text-foreground w-fit transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={storeConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 hover:text-foreground w-fit transition-colors"
              >
                Facebook
              </a>
            </div>
          </div>

          {storeConfig.mapsEmbedSrc ? (
            <iframe
              title="Dope Store location"
              src={storeConfig.mapsEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="border-border aspect-video w-full rounded-lg border grayscale"
            />
          ) : null}
        </Reveal>
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="border-border text-gold flex size-10 shrink-0 items-center justify-center rounded-full border">
        <Icon className="size-4" strokeWidth={1.5} />
      </span>
      <div>
        <p className="text-muted-foreground/70 text-[10px] font-medium tracking-[0.18em] uppercase">
          {label}
        </p>
        <div className="text-foreground/85 mt-1 text-sm">{children}</div>
      </div>
    </div>
  );
}

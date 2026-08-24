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
  const mapsDirectionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    formatStoreAddress(),
  )}`;

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

        </Reveal>
      </div>

      {/* Premium, config-driven store map */}
      <Reveal className="mt-20 sm:mt-28">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
              Find us
            </p>
            <h2 className="font-display mt-2 text-2xl font-light tracking-tight sm:text-3xl">
              {storeConfig.address.city}, {storeConfig.address.state}
            </h2>
          </div>
          <a
            href={mapsDirectionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground hidden text-[12px] font-medium tracking-[0.16em] uppercase transition-colors sm:inline"
          >
            Get directions
          </a>
        </div>

        <div className="border-border relative aspect-[16/10] w-full overflow-hidden rounded-lg border sm:aspect-[21/7]">
          {storeConfig.mapsEmbedSrc ? (
            <iframe
              title="Dope Store location"
              src={storeConfig.mapsEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full grayscale transition-[filter] duration-500 hover:grayscale-0"
            />
          ) : (
            <div className="from-secondary/40 to-background flex h-full w-full flex-col items-center justify-center bg-gradient-to-br text-center">
              <MapPin
                className="text-gold/60 size-8"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="text-foreground mt-4 text-sm font-medium">
                {formatStoreAddress()}
              </p>
              <a
                href={mapsDirectionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold-soft mt-3 text-[12px] font-medium tracking-[0.16em] uppercase transition-colors"
              >
                Open in Google Maps
              </a>
            </div>
          )}
        </div>
      </Reveal>
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

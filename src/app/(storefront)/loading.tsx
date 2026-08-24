import Image from "next/image";

export default function StorefrontLoading() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="dope-glow flex items-center gap-3">
        <Image
          src="/dope-logo.png"
          alt="Dope Store"
          width={56}
          height={56}
          priority
          className="size-12 object-contain"
        />
        <span className="font-display text-2xl font-medium tracking-[0.34em] text-white">
          DOPE
        </span>
      </div>
      <div className="relative h-px w-28 overflow-hidden bg-white/10">
        <div className="dope-sweep absolute inset-y-0 w-1/2 bg-[color:var(--gold)]" />
      </div>
    </div>
  );
}

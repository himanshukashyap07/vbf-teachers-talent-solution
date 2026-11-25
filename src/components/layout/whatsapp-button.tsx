import { siteConfig } from "@/config/site";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="currentColor">
      <path d="M16.004 3C9.38 3 4 8.376 4 15c0 2.116.553 4.18 1.6 6.002L4 29l8.2-1.564A11.94 11.94 0 0 0 16.004 27C22.628 27 28 21.624 28 15S22.628 3 16.004 3zm0 21.8a9.77 9.77 0 0 1-4.98-1.364l-.357-.213-4.867.928.953-4.74-.233-.375A9.79 9.79 0 0 1 6.2 15c0-5.413 4.39-9.8 9.804-9.8 5.412 0 9.796 4.387 9.796 9.8 0 5.413-4.384 9.8-9.796 9.8zm5.37-7.34c-.294-.147-1.743-.86-2.013-.958-.27-.099-.466-.147-.663.147-.196.294-.76.958-.932 1.155-.172.196-.343.22-.637.074-.294-.148-1.243-.458-2.368-1.46-.875-.78-1.466-1.744-1.638-2.038-.172-.294-.018-.453.13-.6.133-.131.294-.343.441-.515.148-.172.197-.294.295-.49.098-.197.05-.368-.025-.515-.073-.147-.662-1.597-.907-2.186-.239-.574-.482-.496-.663-.505l-.565-.01c-.196 0-.515.074-.785.368-.27.295-1.03 1.007-1.03 2.457 0 1.45 1.055 2.85 1.202 3.046.147.196 2.077 3.172 5.032 4.45.703.303 1.252.484 1.68.62.706.224 1.349.192 1.857.117.567-.085 1.743-.713 1.989-1.401.245-.688.245-1.278.172-1.401-.074-.123-.27-.196-.564-.343z" />
    </svg>
  );
}

/** Fixed bottom-right WhatsApp chat shortcut. Number comes from NEXT_PUBLIC_WHATSAPP_NUMBER. */
export function WhatsAppButton() {
  const number = siteConfig.whatsappNumber.replace(/\D/g, "");
  // Without a number configured, fall back to wa.me (opens WhatsApp's own contact picker).
  const href = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(siteConfig.whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(siteConfig.whatsappMessage)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-4 right-4 z-50 print:hidden flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-1 ring-black/10 hover:bg-[#1ebe5b] sm:bottom-6 sm:right-6"
    >
      <WhatsAppIcon className="size-8" />
    </a>
  );
}

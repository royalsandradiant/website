export type TrackingCarrier = "ups" | "usps" | "fedex" | "dhl" | "generic";

function normalizeTrackingNumber(trackingNumber: string): string {
  return trackingNumber.trim().replace(/\s+/g, "");
}

function normalizeCarrier(carrier?: string | null): TrackingCarrier | null {
  if (!carrier) return null;
  const normalized = carrier.trim().toLowerCase();
  if (normalized === "ups") return "ups";
  if (normalized === "usps") return "usps";
  if (normalized === "fedex" || normalized === "federal express")
    return "fedex";
  if (normalized === "dhl") return "dhl";
  return null;
}

function inferCarrierFromTrackingNumber(
  trackingNumber: string,
): TrackingCarrier | null {
  const value = normalizeTrackingNumber(trackingNumber);

  // UPS: Typically starts with 1Z.
  if (/^1Z[0-9A-Z]{16}$/i.test(value)) return "ups";

  // USPS: Common USPS patterns.
  if (/^(9\d{21,23}|[A-Z]{2}\d{9}[A-Z]{2})$/i.test(value)) return "usps";

  // FedEx: Common numeric lengths.
  if (
    /^\d{12}$/.test(value) ||
    /^\d{15}$/.test(value) ||
    /^\d{20}$/.test(value) ||
    /^\d{22}$/.test(value)
  ) {
    return "fedex";
  }

  // DHL Express: Frequently 10-digit numeric.
  if (/^\d{10}$/.test(value)) return "dhl";

  return null;
}

function carrierDisplayName(carrier: TrackingCarrier): string {
  if (carrier === "ups") return "UPS";
  if (carrier === "usps") return "USPS";
  if (carrier === "fedex") return "FedEx";
  if (carrier === "dhl") return "DHL";
  return "Carrier";
}

function carrierTrackingUrl(
  carrier: TrackingCarrier,
  trackingNumber: string,
): string | null {
  const encoded = encodeURIComponent(trackingNumber);

  if (carrier === "ups") {
    return `https://www.ups.com/track?tracknum=${encoded}`;
  }
  if (carrier === "usps") {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`;
  }
  if (carrier === "fedex") {
    return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
  }
  if (carrier === "dhl") {
    return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encoded}`;
  }

  return null;
}

export function buildTrackingLink(
  trackingNumber: string,
  carrier?: string | null,
): {
  trackingNumber: string;
  trackingUrl: string;
  carrier: TrackingCarrier;
  carrierLabel: string;
} {
  const normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
  const explicitCarrier = normalizeCarrier(carrier);
  const detectedCarrier =
    explicitCarrier || inferCarrierFromTrackingNumber(normalizedTrackingNumber);
  const selectedCarrier = detectedCarrier || "generic";

  const directCarrierUrl = carrierTrackingUrl(
    selectedCarrier,
    normalizedTrackingNumber,
  );
  const trackingUrl =
    directCarrierUrl ||
    `https://www.google.com/search?q=${encodeURIComponent(`${normalizedTrackingNumber} tracking`)}`;

  return {
    trackingNumber: normalizedTrackingNumber,
    trackingUrl,
    carrier: selectedCarrier,
    carrierLabel: carrierDisplayName(selectedCarrier),
  };
}

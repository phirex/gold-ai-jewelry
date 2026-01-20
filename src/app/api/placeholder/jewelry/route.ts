import { NextRequest, NextResponse } from "next/server";

// SVG placeholder images for jewelry types
const jewelryPlaceholders: Record<string, string> = {
  ring: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F5B800"/>
        <stop offset="50%" style="stop-color:#E6A912"/>
        <stop offset="100%" style="stop-color:#C98B0A"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <rect width="400" height="400" fill="#1a1a1a"/>
    <ellipse cx="200" cy="200" rx="120" ry="120" fill="none" stroke="url(#goldGrad)" stroke-width="24" filter="url(#shadow)"/>
    <ellipse cx="200" cy="130" rx="25" ry="20" fill="#87CEEB" stroke="url(#goldGrad)" stroke-width="4"/>
    <text x="200" y="350" font-family="Arial" font-size="16" fill="#666" text-anchor="middle">Ring Design Preview</text>
  </svg>`,
  necklace: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F5B800"/>
        <stop offset="50%" style="stop-color:#E6A912"/>
        <stop offset="100%" style="stop-color:#C98B0A"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="#1a1a1a"/>
    <path d="M 80 100 Q 200 180 320 100" fill="none" stroke="url(#goldGrad)" stroke-width="6"/>
    <path d="M 200 180 L 180 240 L 200 280 L 220 240 Z" fill="url(#goldGrad)"/>
    <circle cx="200" cy="220" r="15" fill="#87CEEB"/>
    <text x="200" y="350" font-family="Arial" font-size="16" fill="#666" text-anchor="middle">Necklace Design Preview</text>
  </svg>`,
  bracelet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F5B800"/>
        <stop offset="50%" style="stop-color:#E6A912"/>
        <stop offset="100%" style="stop-color:#C98B0A"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="#1a1a1a"/>
    <ellipse cx="200" cy="200" rx="140" ry="80" fill="none" stroke="url(#goldGrad)" stroke-width="16"/>
    <ellipse cx="200" cy="200" rx="100" ry="50" fill="none" stroke="url(#goldGrad)" stroke-width="8"/>
    <text x="200" y="350" font-family="Arial" font-size="16" fill="#666" text-anchor="middle">Bracelet Design Preview</text>
  </svg>`,
  earrings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F5B800"/>
        <stop offset="50%" style="stop-color:#E6A912"/>
        <stop offset="100%" style="stop-color:#C98B0A"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="#1a1a1a"/>
    <circle cx="130" cy="150" r="8" fill="url(#goldGrad)"/>
    <path d="M 130 158 L 130 220 L 110 260 L 130 300 L 150 260 L 130 220" fill="url(#goldGrad)"/>
    <circle cx="270" cy="150" r="8" fill="url(#goldGrad)"/>
    <path d="M 270 158 L 270 220 L 250 260 L 270 300 L 290 260 L 270 220" fill="url(#goldGrad)"/>
    <text x="200" y="370" font-family="Arial" font-size="16" fill="#666" text-anchor="middle">Earrings Design Preview</text>
  </svg>`,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "ring";
  const variant = searchParams.get("variant") || "0";

  // Get base SVG
  let svg = jewelryPlaceholders[type] || jewelryPlaceholders.ring;

  // Add variant-specific modifications (different colors/sizes)
  const variantNum = parseInt(variant, 10);
  const hueRotate = variantNum * 15; // Slight color variation
  const scale = 1 + variantNum * 0.02; // Slight size variation

  // Wrap in a group with transform
  svg = svg.replace(
    '<rect width="400"',
    `<g transform="scale(${scale})" style="filter: hue-rotate(${hueRotate}deg)"><rect width="400"`
  );
  svg = svg.replace("</svg>", "</g></svg>");

  // Convert to data URL for response
  const svgBuffer = Buffer.from(svg, "utf-8");

  return new NextResponse(svgBuffer, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

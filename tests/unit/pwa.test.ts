import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * PWA artifact tests.
 *
 * These tests guard the installability contract: a valid manifest, a generated
 * service worker, and correctly sized PNG icons must be present after build.
 * They run against the build output so the CI verification `pnpm build && npx vitest run`
 * exercises the real artifacts rather than just source configuration.
 */

const ROOT = resolve(__dirname, '..', '..');
const PUBLIC = resolve(ROOT, 'public');
const OUTPUT_PUBLIC = resolve(ROOT, '.output', 'public');

function pngDimensions(path: string): { width: number; height: number } {
  const buffer = readFileSync(path);
  // PNG signature is 8 bytes; IHDR starts at byte 16, width/height at 16+4/16+8.
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, 8).equals(signature)) {
    throw new Error(`Not a PNG file: ${path}`);
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

describe('PWA public icons', () => {
  it('provides a 192×192 PNG icon', () => {
    const path = resolve(PUBLIC, 'pwa-192x192.png');
    expect(existsSync(path), 'icon must exist').toBe(true);
    expect(pngDimensions(path)).toEqual({ width: 192, height: 192 });
  });

  it('provides a 512×512 PNG icon', () => {
    const path = resolve(PUBLIC, 'pwa-512x512.png');
    expect(existsSync(path), 'icon must exist').toBe(true);
    expect(pngDimensions(path)).toEqual({ width: 512, height: 512 });
  });
});

describe('PWA build output', () => {
  it('emits a web app manifest with required installability fields', () => {
    const path = resolve(OUTPUT_PUBLIC, 'manifest.webmanifest');
    expect(existsSync(path), 'manifest must exist').toBe(true);

    const manifest = JSON.parse(readFileSync(path, 'utf-8'));
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBeTruthy();
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.some((icon: { sizes?: string }) => icon.sizes === '192x192')).toBe(true);
    expect(manifest.icons.some((icon: { sizes?: string }) => icon.sizes === '512x512')).toBe(true);
  });

  it('emits a service worker script', () => {
    const path = resolve(OUTPUT_PUBLIC, 'sw.js');
    expect(existsSync(path), 'service worker must exist').toBe(true);
    const content = readFileSync(path, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });
});

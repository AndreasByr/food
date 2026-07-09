import { randomUUID } from 'node:crypto';
import { mkdir, rm, stat } from 'node:fs/promises';
import { resolve, normalize, sep } from 'node:path';

// `createError` is provided by Nitro as a server auto-import (see
// server/utils/errors.ts for the same convention). It is referenced only inside
// functions, never at module top level, so the module can be imported in a
// plain Node/Vitest context when a polyfill is installed (see tests/setup.ts).

// ─────────────────────────────────────────────────────────────────────────────
// Image upload + static serving for recipes (T04).
//
// Files are written into Nuxt's `public/recipes/` directory so the static
// asset server serves them at `/recipes/<file>`. The DB stores only the
// relative path (`recipes/<file>`) — the public root is implicit.
//
// Validation is a pure function (no I/O) so it can be unit-tested in isolation;
// the filesystem helpers are thin wrappers that keep the same error shape the
// rest of the API uses (structured JSON 400/415/413).
//
// Security notes:
//  - Filenames are server-generated (crypto UUID) — client-supplied filenames
//    are never used on disk, preventing traversal via crafted names.
//  - removeRecipeImage normalizes + resolves the stored path and refuses to
//    touch anything outside `public/recipes/`, so a tampered DB row can never
//    delete an arbitrary file.
//  - MIME + size are validated before the file touches disk.
// ─────────────────────────────────────────────────────────────────────────────

/** Absolute path to the Nuxt public root (project-relative `public/`). */
export const PUBLIC_DIR = resolve(process.cwd(), 'public');

/** Absolute path to the recipe image storage directory. */
export const RECIPES_DIR = resolve(PUBLIC_DIR, 'recipes');

/** Sub-path under `public/` — the value stored in `recipes.image_path`. */
export const RECIPES_SUBDIR = 'recipes';

/** Maximum accepted upload size (5 MiB). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** MIME types we accept and the file extension written for each. */
const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Set of accepted MIME types (for validation assertions / tests). */
export const ALLOWED_IMAGE_MIME = Object.keys(ALLOWED_MIME);

/** Shape of an incoming image part from `readMultipartFormData`. */
export interface IncomingImage {
  /** Raw file bytes. */
  data: Buffer;
  /** Original client filename (used only for extension fallback). */
  filename?: string;
  /** Declared MIME type from the part headers. */
  type?: string;
}

/** Result of a successful image save: the value to persist in the DB. */
export interface SavedImage {
  /** Relative path under `public/` (e.g. `recipes/abc.jpg`). */
  relativePath: string;
  /** Absolute path on disk. */
  absolutePath: string;
}

/**
 * Validate an incoming image part without touching disk.
 *
 * Returns the canonical MIME type (lowercased) on success. Throws a structured
 * 400 error on failure so the handler can surface it directly:
 *  - missing/empty data → 400 "Image file is required"
 *  - unknown/missing MIME → 415 "Unsupported image type"
 *  - size > MAX_IMAGE_BYTES → 413 "Image file too large"
 *
 * Pure function — safe to unit-test without filesystem setup.
 */
export function validateImageFile(image: {
  data?: Buffer;
  filename?: string;
  type?: string;
}): string {
  if (!image.data || image.data.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { statusCode: 400, message: 'Image file is required' },
    });
  }

  const mime = ((image.type ?? '').toLowerCase().split(';')[0] ?? '').trim();
  if (!ALLOWED_MIME[mime]) {
    throw createError({
      statusCode: 415,
      statusMessage: 'Unsupported Media Type',
      data: {
        statusCode: 415,
        message: `Unsupported image type: ${image.type || 'none'}. Allowed: ${ALLOWED_IMAGE_MIME.join(', ')}`,
      },
    });
  }

  if (image.data.length > MAX_IMAGE_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Payload Too Large',
      data: {
        statusCode: 413,
        message: `Image file too large: ${image.data.length} bytes (max ${MAX_IMAGE_BYTES})`,
      },
    });
  }

  return mime;
}

/**
 * Generate a server-side filename for a stored image. The name never derives
 * from the client-supplied filename — only the MIME determines the extension.
 *
 * Pure function — deterministic given the inputs (uuid mockable in tests).
 */
export function generateImageFilename(mime: string, supplied: { uuid?: () => string } = {}): string {
  const ext = ALLOWED_MIME[mime.toLowerCase()];
  if (!ext) {
    // Defensive — validateImageFile should have rejected this first.
    throw createError({
      statusCode: 415,
      statusMessage: 'Unsupported Media Type',
      data: { statusCode: 415, message: `Unsupported image type: ${mime}` },
    });
  }
  const uuid = (supplied.uuid ?? randomUUID)();
  return `${uuid}.${ext}`;
}

/**
 * Resolve a stored relative path to an absolute filesystem path, refusing to
 * escape `public/recipes/`. Returns null when the path is unsafe or not under
 * the recipes directory.
 *
 * Pure function — no filesystem access.
 */
export function resolveRecipeImagePath(relativePath: string | null | undefined): string | null {
  if (!relativePath || typeof relativePath !== 'string') return null;
  // Reject any absolute path or anything containing traversal segments — even
  // after normalize, an absolute path would anchor elsewhere.
  if (relativePath.startsWith('/')) return null;

  const normalized = normalize(relativePath);
  if (normalized.includes('..')) return null;

  // The stored path must live under the recipes subdirectory.
  if (!normalized.startsWith(`${RECIPES_SUBDIR}/`)) return null;

  // Final resolve against the public root, then assert containment.
  const absolute = resolve(PUBLIC_DIR, normalized);
  const recipesAbsolute = resolve(PUBLIC_DIR, RECIPES_SUBDIR);
  if (absolute !== recipesAbsolute && !absolute.startsWith(`${recipesAbsolute}${sep}`)) {
    return null;
  }
  return absolute;
}

/**
 * Validate and persist an incoming image part to `public/recipes/<uuid>.<ext>`.
 *
 * Creates the storage directory if missing. Returns the saved image metadata
 * on success. On validation failure, throws the same structured error as
 * `validateImageFile` (no partial file is written).
 */
export async function saveRecipeImage(
  image: IncomingImage,
  opts: { uuid?: () => string } = {},
): Promise<SavedImage> {
  const mime = validateImageFile(image);
  const filename = generateImageFilename(mime, opts);

  await mkdir(RECIPES_DIR, { recursive: true });

  const absolutePath = resolve(RECIPES_DIR, filename);
  const { writeFile } = await import('node:fs/promises');
  await writeFile(absolutePath, image.data);

  return {
    relativePath: `${RECIPES_SUBDIR}/${filename}`,
    absolutePath,
  };
}

/**
 * Remove a previously stored recipe image. Silently no-ops when:
 *  - the path is null/empty (recipe had no image)
 *  - the path fails the containment guard (tampered DB row)
 *  - the file no longer exists on disk
 *
 * Never throws for a missing file — DELETE must stay idempotent even if the
 * image was removed out-of-band.
 */
export async function removeRecipeImage(relativePath: string | null | undefined): Promise<void> {
  const absolute = resolveRecipeImagePath(relativePath);
  if (!absolute) return;

  try {
    await rm(absolute, { force: true });
  } catch {
    // Swallow — a failed unlink must not turn a successful recipe DELETE into
    // a 500. The recipe row is already gone; the orphaned file is a ops concern.
  }
}

/**
 * Stat a stored image (used by tests / diagnostics). Returns null when the
 * path is unsafe or the file does not exist.
 */
export async function statRecipeImage(relativePath: string | null | undefined): Promise<{ size: number } | null> {
  const absolute = resolveRecipeImagePath(relativePath);
  if (!absolute) return null;
  try {
    const s = await stat(absolute);
    return { size: s.size };
  } catch {
    return null;
  }
}

/** Re-export for handlers that need to build a public URL from a stored path. */
export function toPublicUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  return `/${relativePath}`;
}
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { mkdtemp, rm, readFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests for the recipe image-upload module (T04).
//
// The pure validators (validateImageFile, generateImageFilename,
// resolveRecipeImagePath, toPublicUrl) need no filesystem. The save/remove
// helpers write into a per-test temp directory — we isolate them by chdir-ing
// into a temp root *before* importing the module so its PUBLIC_DIR constant
// points at throwaway storage, not the real `public/`.
// ─────────────────────────────────────────────────────────────────────────────

const JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

let tmpRoot = '';
let imageUpload: typeof import('../../server/utils/image-upload');

beforeAll(async () => {
  // Create a throwaway project root and make it the cwd so the module's
  // `resolve(process.cwd(), 'public')` lands inside the temp tree.
  tmpRoot = await mkdtemp(join(tmpdir(), 'foodora-img-'));
  process.chdir(tmpRoot);
  // Fresh import — constants are captured against the new cwd.
  imageUpload = await import('../../server/utils/image-upload');
});

afterEach(async () => {
  // Wipe any uploaded files between tests, keep the temp root itself.
  await rm(join(tmpRoot, 'public'), { recursive: true, force: true });
});

afterAll(async () => {
  // Best-effort cleanup of the temp tree.
  await rm(tmpRoot, { recursive: true, force: true });
});

// ── validateImageFile ────────────────────────────────────────────────────────

describe('validateImageFile', () => {
  it('accepts a valid jpeg under the size limit', () => {
    const mime = imageUpload.validateImageFile({
      data: JPEG,
      type: 'image/jpeg',
    });
    expect(mime).toBe('image/jpeg');
  });

  it('accepts png and webp (case/suffix-insensitive)', () => {
    expect(
      imageUpload.validateImageFile({ data: Buffer.from('x'), type: 'image/png' }),
    ).toBe('image/png');
    expect(
      imageUpload.validateImageFile({ data: Buffer.from('x'), type: 'image/webp' }),
    ).toBe('image/webp');
  });

  it('normalizes charset-decorated content types', () => {
    const mime = imageUpload.validateImageFile({
      data: JPEG,
      type: 'Image/JPEG; charset=utf-8',
    });
    expect(mime).toBe('image/jpeg');
  });

  it('rejects an unsupported MIME type with 415', () => {
    try {
      imageUpload.validateImageFile({ data: JPEG, type: 'image/gif' });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as { statusCode?: number }).statusCode).toBe(415);
    }
  });

  it('rejects a missing/empty data buffer with 400', () => {
    try {
      imageUpload.validateImageFile({ data: Buffer.alloc(0), type: 'image/jpeg' });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as { statusCode: number }).statusCode).toBe(400);
    }
  });

  it('rejects a file exceeding the 5 MiB cap with 413', () => {
    const tooLarge = Buffer.alloc(imageUpload.MAX_IMAGE_BYTES + 1);
    try {
      imageUpload.validateImageFile({ data: tooLarge, type: 'image/jpeg' });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as { statusCode: number }).statusCode).toBe(413);
    }
  });

  it('accepts a file exactly at the 5 MiB cap', () => {
    const atCap = Buffer.alloc(imageUpload.MAX_IMAGE_BYTES);
    const mime = imageUpload.validateImageFile({ data: atCap, type: 'image/jpeg' });
    expect(mime).toBe('image/jpeg');
  });
});

// ── generateImageFilename ────────────────────────────────────────────────────

describe('generateImageFilename', () => {
  it('maps MIME to the canonical extension', () => {
    expect(imageUpload.generateImageFilename('image/jpeg', { uuid: () => 'abc' })).toBe('abc.jpg');
    expect(imageUpload.generateImageFilename('image/png', { uuid: () => 'abc' })).toBe('abc.png');
    expect(imageUpload.generateImageFilename('image/webp', { uuid: () => 'abc' })).toBe('abc.webp');
  });

  it('rejects an unsupported MIME with 415', () => {
    try {
      imageUpload.generateImageFilename('image/gif', { uuid: () => 'abc' });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as { statusCode: number }).statusCode).toBe(415);
    }
  });

  it('produces unique names for distinct uuids', () => {
    const a = imageUpload.generateImageFilename('image/jpeg');
    const b = imageUpload.generateImageFilename('image/jpeg');
    expect(a).not.toBe(b);
    expect(a.endsWith('.jpg')).toBe(true);
  });
});

// ── resolveRecipeImagePath (path-traversal guard) ─────────────────────────────

describe('resolveRecipeImagePath', () => {
  it('resolves a well-formed stored path under public/recipes', () => {
    const abs = imageUpload.resolveRecipeImagePath('recipes/abc.jpg');
    expect(abs).not.toBeNull();
    expect(abs).toContain(join('public', 'recipes', 'abc.jpg'));
  });

  it('returns null for an empty/null path (no image)', () => {
    expect(imageUpload.resolveRecipeImagePath(null)).toBeNull();
    expect(imageUpload.resolveRecipeImagePath(undefined)).toBeNull();
    expect(imageUpload.resolveRecipeImagePath('')).toBeNull();
  });

  it('returns null for an absolute path', () => {
    expect(imageUpload.resolveRecipeImagePath('/etc/passwd')).toBeNull();
    expect(imageUpload.resolveRecipeImagePath('/recipes/x.jpg')).toBeNull();
  });

  it('returns null for a traversal path', () => {
    expect(imageUpload.resolveRecipeImagePath('recipes/../secret.txt')).toBeNull();
    expect(imageUpload.resolveRecipeImagePath('../etc/passwd')).toBeNull();
    expect(imageUpload.resolveRecipeImagePath('recipes/../../etc/passwd')).toBeNull();
  });

  it('returns null when the path does not live under recipes/', () => {
    expect(imageUpload.resolveRecipeImagePath('ingredients/x.json')).toBeNull();
    expect(imageUpload.resolveRecipeImagePath('foo.jpg')).toBeNull();
  });
});

// ── toPublicUrl ──────────────────────────────────────────────────────────────

describe('toPublicUrl', () => {
  it('prefixes a relative path with a leading slash', () => {
    expect(imageUpload.toPublicUrl('recipes/abc.jpg')).toBe('/recipes/abc.jpg');
  });
  it('returns null for an empty path', () => {
    expect(imageUpload.toPublicUrl(null)).toBeNull();
    expect(imageUpload.toPublicUrl(undefined)).toBeNull();
  });
});

// ── saveRecipeImage / removeRecipeImage (filesystem) ─────────────────────────

describe('saveRecipeImage', () => {
  it('writes the file under public/recipes and returns a relative path', async () => {
    const saved = await imageUpload.saveRecipeImage(
      { data: JPEG, type: 'image/jpeg', filename: 'lunch.jpg' },
      { uuid: () => 'fixed-uuid' },
    );
    expect(saved.relativePath).toBe('recipes/fixed-uuid.jpg');
    expect(saved.absolutePath).toContain(join('public', 'recipes', 'fixed-uuid.jpg'));

    const onDisk = await readFile(saved.absolutePath);
    expect(onDisk.equals(JPEG)).toBe(true);
  });

  it('creates the storage directory when missing', async () => {
    // afterEach wipes public/ — so the dir does not exist yet here.
    const saved = await imageUpload.saveRecipeImage(
      { data: Buffer.from('png'), type: 'image/png' },
      { uuid: () => 'dir-test' },
    );
    expect(saved.relativePath).toBe('recipes/dir-test.png');
  });

  it('rejects an oversized image before touching disk', async () => {
    const tooLarge = Buffer.alloc(imageUpload.MAX_IMAGE_BYTES + 1);
    await expect(
      imageUpload.saveRecipeImage({ data: tooLarge, type: 'image/jpeg' }),
    ).rejects.toMatchObject({ statusCode: 413 });

    // Nothing was written.
    const { readdir } = await import('node:fs/promises');
    await expect(readdir(join(tmpRoot, 'public'))).rejects.toThrow();
  });

  it('rejects an unsupported MIME before touching disk', async () => {
    await expect(
      imageUpload.saveRecipeImage({ data: JPEG, type: 'image/gif' }),
    ).rejects.toMatchObject({ statusCode: 415 });
  });
});

describe('removeRecipeImage', () => {
  it('deletes an existing file and is idempotent on re-call', async () => {
    const saved = await imageUpload.saveRecipeImage(
      { data: JPEG, type: 'image/jpeg' },
      { uuid: () => 'removable' },
    );

    await imageUpload.removeRecipeImage(saved.relativePath);
    // Second call must not throw (file already gone).
    await expect(imageUpload.removeRecipeImage(saved.relativePath)).resolves.toBeUndefined();
  });

  it('silently ignores a null/empty path', async () => {
    await expect(imageUpload.removeRecipeImage(null)).resolves.toBeUndefined();
    await expect(imageUpload.removeRecipeImage('')).resolves.toBeUndefined();
  });

  it('refuses to delete outside the recipes dir (tampered DB row)', async () => {
    // Plant a file outside recipes/ that a traversal path would target.
    await mkdir(join(tmpRoot, 'public'), { recursive: true });
    await writeFile(join(tmpRoot, 'public', 'secret.txt'), 'top-secret');

    await imageUpload.removeRecipeImage('recipes/../secret.txt');
    const { readFile } = await import('node:fs/promises');
    const stillThere = await readFile(join(tmpRoot, 'public', 'secret.txt'), 'utf8');
    expect(stillThere).toBe('top-secret');
  });
});
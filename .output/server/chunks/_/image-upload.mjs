import { e as createError } from '../nitro/nitro.mjs';
import { randomUUID } from 'node:crypto';
import { rm, mkdir } from 'node:fs/promises';
import { resolve, normalize, sep } from 'node:path';

const PUBLIC_DIR = resolve(process.cwd(), "public");
const RECIPES_DIR = resolve(PUBLIC_DIR, "recipes");
const RECIPES_SUBDIR = "recipes";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};
const ALLOWED_IMAGE_MIME = Object.keys(ALLOWED_MIME);
function validateImageFile(image) {
  var _a, _b;
  if (!image.data || image.data.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { statusCode: 400, message: "Image file is required" }
    });
  }
  const mime = ((_b = ((_a = image.type) != null ? _a : "").toLowerCase().split(";")[0]) != null ? _b : "").trim();
  if (!ALLOWED_MIME[mime]) {
    throw createError({
      statusCode: 415,
      statusMessage: "Unsupported Media Type",
      data: {
        statusCode: 415,
        message: `Unsupported image type: ${image.type || "none"}. Allowed: ${ALLOWED_IMAGE_MIME.join(", ")}`
      }
    });
  }
  if (image.data.length > MAX_IMAGE_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: "Payload Too Large",
      data: {
        statusCode: 413,
        message: `Image file too large: ${image.data.length} bytes (max ${MAX_IMAGE_BYTES})`
      }
    });
  }
  return mime;
}
function generateImageFilename(mime, supplied = {}) {
  var _a;
  const ext = ALLOWED_MIME[mime.toLowerCase()];
  if (!ext) {
    throw createError({
      statusCode: 415,
      statusMessage: "Unsupported Media Type",
      data: { statusCode: 415, message: `Unsupported image type: ${mime}` }
    });
  }
  const uuid = ((_a = supplied.uuid) != null ? _a : randomUUID)();
  return `${uuid}.${ext}`;
}
function resolveRecipeImagePath(relativePath) {
  if (!relativePath || typeof relativePath !== "string") return null;
  if (relativePath.startsWith("/")) return null;
  const normalized = normalize(relativePath);
  if (normalized.includes("..")) return null;
  if (!normalized.startsWith(`${RECIPES_SUBDIR}/`)) return null;
  const absolute = resolve(PUBLIC_DIR, normalized);
  const recipesAbsolute = resolve(PUBLIC_DIR, RECIPES_SUBDIR);
  if (absolute !== recipesAbsolute && !absolute.startsWith(`${recipesAbsolute}${sep}`)) {
    return null;
  }
  return absolute;
}
async function saveRecipeImage(image, opts = {}) {
  const mime = validateImageFile(image);
  const filename = generateImageFilename(mime, opts);
  await mkdir(RECIPES_DIR, { recursive: true });
  const absolutePath = resolve(RECIPES_DIR, filename);
  const { writeFile } = await import('node:fs/promises');
  await writeFile(absolutePath, image.data);
  return {
    relativePath: `${RECIPES_SUBDIR}/${filename}`,
    absolutePath
  };
}
async function removeRecipeImage(relativePath) {
  const absolute = resolveRecipeImagePath(relativePath);
  if (!absolute) return;
  try {
    await rm(absolute, { force: true });
  } catch {
  }
}

export { removeRecipeImage as r, saveRecipeImage as s };
//# sourceMappingURL=image-upload.mjs.map

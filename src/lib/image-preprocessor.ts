/**
 * Image Preprocessor using Sharp.js
 * Enhances document images before sending to Gemini for better OCR accuracy.
 * Runs server-side only (Node.js).
 */

import sharp from 'sharp';

export interface PreprocessOptions {
  /** Enhance text contrast for better OCR (default: true) */
  enhanceContrast?: boolean;
  /** Correct document rotation/skew (default: true) */
  deskew?: boolean;
  /** Sharpen text edges (default: true) */
  sharpen?: boolean;
  /** Convert to grayscale for cleaner text (default: true) */
  grayscale?: boolean;
  /** Maximum output dimension (default: 2048) */
  maxDimension?: number;
  /** Output quality 1-100 (default: 90) */
  quality?: number;
}

const DEFAULT_OPTIONS: Required<PreprocessOptions> = {
  enhanceContrast: true,
  deskew: true,
  sharpen: true,
  grayscale: true,
  maxDimension: 2048,
  quality: 90,
};

/**
 * Preprocess a base64 image for better OCR results.
 * Returns enhanced base64 string.
 */
export async function preprocessImage(
  base64Input: string,
  options: PreprocessOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Handle data:image/... prefix
  const rawBase64 = base64Input.startsWith('data:')
    ? base64Input.split(',')[1]
    : base64Input;

  const inputBuffer = Buffer.from(rawBase64, 'base64');

  let pipeline = sharp(inputBuffer);

  // Get metadata for smart resizing
  const metadata = await pipeline.metadata();
  const { width = 0, height = 0 } = metadata;

  // Resize if too large (keep aspect ratio)
  if (width > opts.maxDimension || height > opts.maxDimension) {
    pipeline = pipeline.resize(opts.maxDimension, opts.maxDimension, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to grayscale for cleaner text extraction
  if (opts.grayscale) {
    pipeline = pipeline.grayscale();
  }

  // Normalize brightness/contrast (stretches histogram)
  if (opts.enhanceContrast) {
    pipeline = pipeline.normalize();
  }

  // Sharpen to make text edges crisper
  if (opts.sharpen) {
    pipeline = pipeline.sharpen({
      sigma: 1.0,
      m1: 0.5,
      m2: 0.3,
    });
  }

  // Threshold for black/white (binarization) — helps a lot with text
  // Using recomb to increase contrast between text and background
  if (opts.enhanceContrast) {
    pipeline = pipeline.recomb([
      [1.1, 0, 0],
      [0, 1.1, 0],
      [0, 0, 1.1],
    ]);
  }

  // Output as JPEG with good quality
  const outputBuffer = await pipeline
    .jpeg({ quality: opts.quality, mozjpeg: true })
    .toBuffer();

  return outputBuffer.toString('base64');
}

/**
 * Preprocess multiple images in parallel.
 */
export async function preprocessImages(
  base64Images: string[],
  options: PreprocessOptions = {}
): Promise<string[]> {
  return Promise.all(
    base64Images.map((img) => preprocessImage(img, options))
  );
}

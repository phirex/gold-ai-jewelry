/**
 * Supabase Storage Client
 *
 * Handles image uploads to Supabase Storage for permanent, publicly accessible URLs.
 * Used for storing generated jewelry design images.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const BUCKET_NAME = "jewelry-designs";

// Create Supabase client for server-side operations
function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase storage not configured - missing URL or service key");
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Upload an image from a URL to Supabase Storage
 * Returns the public URL of the uploaded image
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  options?: {
    folder?: string;
    filename?: string;
  }
): Promise<string> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.warn("Supabase not configured, returning original URL");
    return imageUrl;
  }

  try {
    // Fetch the image from the source URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const extension = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
    const imageBuffer = await response.arrayBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const folder = options?.folder || "generated";
    const filename = options?.filename || `${timestamp}-${randomId}.${extension}`;
    const filePath = `${folder}/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, imageBuffer, {
        contentType,
        cacheControl: "31536000", // 1 year cache
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    console.log(`Image uploaded to Supabase: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Failed to upload image to Supabase:", error);
    // Return original URL as fallback
    return imageUrl;
  }
}

/**
 * Upload image data (Buffer or Blob) directly to Supabase Storage
 */
export async function uploadImageData(
  data: Buffer | ArrayBuffer,
  options: {
    contentType?: string;
    folder?: string;
    filename?: string;
  }
): Promise<string | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.warn("Supabase not configured");
    return null;
  }

  try {
    const contentType = options.contentType || "image/png";
    const extension = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const folder = options.folder || "generated";
    const filename = options.filename || `${timestamp}-${randomId}.${extension}`;
    const filePath = `${folder}/${filename}`;

    const { data: uploadData, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, data, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Failed to upload image data to Supabase:", error);
    return null;
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(filePath: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete image from Supabase:", error);
    return false;
  }
}

/**
 * Check if Supabase storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Get the bucket name for reference
 */
export function getBucketName(): string {
  return BUCKET_NAME;
}

import { supabase } from './supabase';
import { addImageToJob } from './database';

const BUCKET_NAME = 'drone-images';

/**
 * Upload an image file to Supabase Storage and save the reference in the DB.
 * Returns the public URL of the uploaded image.
 */
export async function uploadRepairImage(
  repairJobId: string,
  file: File
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${repairJobId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    return null;
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  const publicUrl = data.publicUrl;

  // Save reference in the database
  await addImageToJob(repairJobId, filePath, publicUrl);

  return publicUrl;
}

/**
 * Upload multiple image files for a repair job.
 * Returns array of public URLs for successfully uploaded images.
 */
export async function uploadMultipleImages(
  repairJobId: string,
  files: File[]
): Promise<string[]> {
  const results = await Promise.all(
    files.map(file => uploadRepairImage(repairJobId, file))
  );

  return results.filter((url): url is string => url !== null);
}

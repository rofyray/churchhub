import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload a member photo to Firebase Storage
 */
export async function uploadMemberPhoto(
  churchId: string,
  memberId: string,
  file: File
): Promise<string> {
  // Compress image before upload
  const compressedFile = await compressImage(file, 800, 0.8);

  // Create storage reference
  const fileRef = ref(storage, `churches/${churchId}/members/${memberId}/profile.jpg`);

  // Upload file
  await uploadBytes(fileRef, compressedFile, {
    contentType: 'image/jpeg',
  });

  // Get download URL
  return getDownloadURL(fileRef);
}

/**
 * Delete a member photo from Firebase Storage
 */
export async function deleteMemberPhoto(
  churchId: string,
  memberId: string
): Promise<void> {
  const fileRef = ref(storage, `churches/${churchId}/members/${memberId}/profile.jpg`);

  try {
    await deleteObject(fileRef);
  } catch (err) {
    // Ignore errors if file doesn't exist
    console.warn('Could not delete photo:', err);
  }
}

/**
 * Compress an image file using canvas
 */
async function compressImage(
  file: File,
  maxWidth: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Could not load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

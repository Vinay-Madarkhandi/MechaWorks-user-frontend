// File validation constants and utilities

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const MAX_IMAGES_PER_TASK = 10;
export const MAX_TITLE_LENGTH = 200;

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file selected" };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: "Invalid file type. Please upload JPEG, PNG, GIF, or WebP images only" 
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  return { valid: true };
}

export function validateTaskTitle(title: string): { valid: boolean; error?: string } {
  if (!title || !title.trim()) {
    return { valid: false, error: "Task title is required" };
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return { 
      valid: false, 
      error: `Title must be less than ${MAX_TITLE_LENGTH} characters` 
    };
  }

  return { valid: true };
}

export function validateImageCount(count: number): { valid: boolean; error?: string } {
  if (count === 0) {
    return { valid: false, error: "At least one image is required" };
  }

  if (count > MAX_IMAGES_PER_TASK) {
    return { 
      valid: false, 
      error: `Maximum ${MAX_IMAGES_PER_TASK} images allowed per task` 
    };
  }

  return { valid: true };
}

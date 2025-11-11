"use client";
import { BACKEND_URL, CLOUDFRONT_URL } from "@/utils";
import { getToken } from "@/utils/auth";
import axios from "axios";
import { useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export function UploadImage({
  onImageAdded,
  onImageRemoved,
  image,
  disabled = false,
}: {
  onImageAdded: (image: string) => void;
  onImageRemoved?: () => void;
  image?: string;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  async function onFileSelect(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
      e.target.value = ""; // Reset file input
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 5MB");
      e.target.value = ""; // Reset file input
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 150);

      const response = await axios.get(`${BACKEND_URL}/v1/user/presignedUrl`, {
        headers: {
          Authorization: getToken(),
        },
      });

      const presignedUrl = response.data.preSignedUrl;
      const formData = new FormData();
      formData.set("bucket", response.data.fields["bucket"]);
      formData.set("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
      formData.set(
        "X-Amz-Credential",
        response.data.fields["X-Amz-Credential"]
      );
      formData.set("X-Amz-Date", response.data.fields["X-Amz-Date"]);
      formData.set("key", response.data.fields["key"]);
      formData.set("Policy", response.data.fields["Policy"]);
      formData.set("X-Amz-Signature", response.data.fields["X-Amz-Signature"]);
      formData.append("file", file);

      await axios.post(presignedUrl, formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const imageUrl = `${CLOUDFRONT_URL}/${response.data.fields["key"]}`;

      setTimeout(() => {
        onImageAdded(imageUrl);
        toast.success("Image uploaded successfully! 🎉");
      }, 300);
    } catch (e) {
      console.error("Upload error:", e);
      toast.error("Failed to upload image. Please try again.");
      setUploadProgress(0);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        e.target.value = ""; // Reset file input
      }, 500);
    }
  }

  if (image) {
    return (
      <div className="group relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-violet-950/50 to-purple-950/50 border border-violet-500/20 hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20">
        <Image
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          src={image}
          alt="Uploaded image"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {onImageRemoved && (
          <button
            onClick={onImageRemoved}
            disabled={disabled || uploading}
            className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 hover:rotate-90 shadow-lg z-10"
            title="Remove image"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Image info badge */}
        <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-xs text-white font-medium">Uploaded</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square">
      <div
        className={`relative h-full rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
          disabled || uploading
            ? "border-violet-500/20 bg-violet-950/20 cursor-not-allowed"
            : "border-violet-500/40 bg-gradient-to-br from-violet-950/30 to-purple-950/30 hover:border-violet-400 hover:bg-violet-950/40 cursor-pointer group"
        }`}
      >
        {/* Upload icon and text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          {uploading ? (
            <div className="flex flex-col items-center space-y-4 w-full px-4">
              {/* Spinning loader */}
              <div className="relative">
                <div className="w-16 h-16 border-4 border-violet-500/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-[200px] space-y-2">
                <div className="h-2 bg-violet-950/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-violet-300 text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Upload icon */}
              <div
                className={`mb-3 ${
                  disabled
                    ? "opacity-30"
                    : "group-hover:scale-110 transition-transform duration-300"
                }`}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <svg
                    className="relative w-12 h-12 text-violet-400 group-hover:text-violet-300 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
              </div>

              {/* Text */}
              <p
                className={`text-sm font-medium mb-1 ${
                  disabled
                    ? "text-violet-400/30"
                    : "text-violet-300 group-hover:text-violet-200 transition-colors"
                }`}
              >
                {disabled ? "Upload disabled" : "Click to upload"}
              </p>
              <p
                className={`text-xs text-center ${
                  disabled ? "text-violet-400/20" : "text-violet-400/60"
                }`}
              >
                PNG, JPG, GIF, WebP
                <br />
                (Max 5MB)
              </p>
            </>
          )}
        </div>

        {/* Hidden file input */}
        {!uploading && !disabled && (
          <input
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            disabled={disabled || uploading}
          />
        )}

        {/* Decorative gradient border effect */}
        {!disabled && !uploading && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-purple-600/10 rounded-2xl"></div>
          </div>
        )}
      </div>
    </div>
  );
}

import { Image as ImageIcon, X } from "lucide-react";
import React, { useRef, useState } from "react";
import { apiService } from "../services/api";

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImage?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUploaded, currentImage, className = "" }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Generate presigned URL
      const presignedResponse = await apiService.generatePresignedUrl({
        fileName: file.name,
        fileType: file.type,
        contentLength: file.size,
      });

      // Upload to S3
      await apiService.uploadImage(presignedResponse.presignedUrl, file);

      setUploadProgress(100);

      // Call the callback with the S3 URL
      onImageUploaded(presignedResponse.s3Url);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Please try again.");
      setPreviewUrl(currentImage || null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">Product Image</label>

      <div className="space-y-4">
        {/* Image Preview */}
        {previewUrl && (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Product preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div
          onClick={handleClick}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isUploading
              ? "border-primary-300 bg-primary-50"
              : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          <div className="space-y-2">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-sm text-primary-600">Uploading... {uploadProgress}%</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">Click to upload an image or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP up to 10MB</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

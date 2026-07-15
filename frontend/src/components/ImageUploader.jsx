import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiCheckCircle, FiLoader, FiImage } from 'react-icons/fi';
import { apiService } from '../services/api.js';

export const ImageUploader = ({ onUploadComplete, currentImageUrl }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type (limit to image uploads)
    if (!file.type.startsWith('image/')) {
      setError('Invalid format: Please select an image file (JPEG, PNG, WEBP).');
      return;
    }

    // Limit file size to 5MB for demo sanity
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large: Maximum upload limit is 5MB.');
      return;
    }

    setUploading(true);
    setError(null);

    // Create a local object URL for instant preview rendering
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      console.log(`[Upload] Initiating upload flow for: ${file.name}`);
      
      // Step 1: Request presigned S3/local PUT credentials from backend
      const tokenRes = await apiService.getUploadToken(file.name, file.type);
      const { uploadUrl, downloadUrl, isMock } = tokenRes;
      
      // Step 2: Execute direct binary PUT upload to S3 / Local Express proxy
      await apiService.uploadFileDirect(uploadUrl, file, isMock);

      console.log(`[Upload] Upload successful. S3 asset: ${downloadUrl}`);
      
      // Step 3: Trigger parent handler returning S3 link
      onUploadComplete(downloadUrl);
      setPreviewUrl(downloadUrl);
    } catch (err) {
      console.error('[Upload] Image upload pipeline failed:', err.message);
      setError('Upload failed: Failed to securely transmit asset.');
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      
      <div 
        onClick={!uploading ? triggerFileSelect : undefined}
        className={`w-full h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
          uploading 
            ? 'border-emerald-500/30 bg-emerald-500/5 cursor-not-allowed' 
            : 'border-slate-800 bg-slate-900/40 hover:border-emerald-500/40 hover:bg-slate-900/60'
        }`}
      >
        {previewUrl ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden group">
            <img 
              src={previewUrl} 
              alt="Farm Blueprint" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
                <FiUploadCloud className="w-5 h-5 animate-bounce" />
                <span>Replace Blueprint</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-6">
            <FiUploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-sm text-slate-300 font-medium">Click to upload Farm Blueprint</p>
            <p className="text-xs text-slate-500 mt-1">Accepts Drone/Satellite JPEG & PNG (Max 5MB)</p>
          </div>
        )}
      </div>

      {uploading && (
        <div className="flex items-center space-x-2 text-emerald-400 mt-2 text-xs font-semibold">
          <FiLoader className="w-4 h-4 animate-spin" />
          <span>Uploading blueprint directly to S3 storage bucket...</span>
        </div>
      )}

      {error && (
        <p className="text-rose-400 text-xs mt-2 font-medium">{error}</p>
      )}
    </div>
  );
};

export default ImageUploader;

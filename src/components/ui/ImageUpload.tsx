'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
}

interface ImageUploadProps {
  images: ImagePreview[];
  onImagesChange: (images: ImagePreview[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  maxSizeMB = 2,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  disabled = false
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Only ${acceptedTypes.map(type => type.split('/')[1]).join(', ')} files are allowed.`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }

    return null;
  };

  const createPreview = (file: File): Promise<ImagePreview> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          file,
          preview: reader.result as string,
          id: Math.random().toString(36).substr(2, 9)
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (files: FileList) => {
    setError('');
    
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Check total images limit
    if (images.length + files.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images.`);
      return;
    }

    // Validate each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    // Create previews for valid files
    if (validFiles.length > 0) {
      const previews = await Promise.all(validFiles.map(createPreview));
      onImagesChange([...images, ...previews]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, images, onImagesChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [disabled, images, onImagesChange]);

  const removeImage = useCallback((id: string) => {
    if (disabled) return;
    onImagesChange(images.filter(img => img.id !== id));
  }, [disabled, images, onImagesChange]);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-orange-500 bg-orange-50'
              : disabled
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-orange-400 cursor-pointer'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full ${isDragging ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <Upload className={`h-8 w-8 ${isDragging ? 'text-orange-600' : 'text-gray-400'}`} />
            </div>
            
            <div>
              <p className="text-lg font-medium text-black">
                {isDragging ? 'Drop images here' : 'Upload product images'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Up to {maxImages} images, max {maxSizeMB}MB each
              </p>
              <p className="text-xs text-gray-400">
                Accepted: {acceptedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black">
              Product Images ({images.length}/{maxImages})
            </p>
            {images.length >= maxImages && (
              <p className="text-xs text-gray-500">Maximum images reached</p>
            )}
          </div>
          
          {/* Fixed row of 5 thumbnail slots */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[...Array(maxImages)].map((_, index) => {
              const image = images[index];
              return (
                <div key={index} className="relative flex-shrink-0">
                  {image ? (
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img
                          src={image.preview}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Delete Button */}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                          aria-label="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      
                      {/* Image Number Badge */}
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors bg-gray-50"
                      onClick={openFileDialog}
                    >
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !disabled && (
        <div className="text-center py-4">
          <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}

// Fix import for Plus icon
import { Plus } from 'lucide-react';

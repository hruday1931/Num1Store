'use client';

import { useState, useRef } from 'react';
import { X, GripVertical, Image as ImageIcon } from 'lucide-react';

interface ImageManagerProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  className?: string;
}

export function ImageManager({ images, onImagesChange, className = '' }: ImageManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = [...images, ...Array.from(files)];
      onImagesChange(newImages);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    // Remove from original position
    newImages.splice(draggedIndex, 1);
    
    // Insert at new position
    const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newImages.splice(adjustedDropIndex, 0, draggedImage);
    
    onImagesChange(newImages);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const getImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          <ImageIcon className="w-5 h-5 mr-2 text-gray-500" />
          <span className="text-gray-700">Add Images</span>
        </label>
        <p className="text-sm text-gray-500 mt-2">
          Supported formats: JPG, PNG, GIF, WebP. Drag and drop to reorder.
        </p>
      </div>

      {/* Image Thumbnails */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black">
              Product Images ({images.length})
            </p>
            {images.length > 0 && (
              <p className="text-xs text-gray-500">
                First image will be the primary product image
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {images.map((image, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  relative group cursor-move rounded-lg overflow-hidden border-2
                  ${index === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
                  ${draggedIndex === index ? 'opacity-50' : ''}
                  ${dragOverIndex === index ? 'border-blue-400 bg-blue-50' : ''}
                  hover:border-gray-300 transition-all
                `}
              >
                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute top-1 left-1 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Primary
                  </div>
                )}
                
                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                
                {/* Drag Handle */}
                <div className="absolute bottom-1 left-1 z-10 bg-black bg-opacity-50 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3" />
                </div>
                
                {/* Image Preview */}
                <img
                  src={getImagePreview(image)}
                  alt={image.name}
                  className="w-full h-24 object-cover"
                />
                
                {/* File Name */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No images selected</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add Images" to start uploading</p>
        </div>
      )}
    </div>
  );
}

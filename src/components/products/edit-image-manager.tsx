'use client';

import { useState, useRef } from 'react';
import { X, GripVertical, Image as ImageIcon, Upload } from 'lucide-react';

interface EditImageManagerProps {
  existingImages: string[];
  newImages: File[];
  onExistingImagesChange: (images: string[]) => void;
  onNewImagesChange: (images: File[]) => void;
  className?: string;
}

export function EditImageManager({ 
  existingImages, 
  newImages, 
  onExistingImagesChange, 
  onNewImagesChange,
  className = '' 
}: EditImageManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<'existing' | 'new' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const updatedNewImages = [...newImages, ...Array.from(files)];
      onNewImagesChange(updatedNewImages);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number, type: 'existing' | 'new') => {
    setDraggedIndex(index);
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number, type: 'existing' | 'new') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number, dropType: 'existing' | 'new') => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (draggedIndex === null || draggedType === null) {
      return;
    }

    // Don't allow dropping on the same position
    if (draggedType === dropType && draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDraggedType(null);
      return;
    }

    // Handle reordering within the same type
    if (draggedType === dropType) {
      if (dropType === 'existing') {
        const newExistingImages = [...existingImages];
        const draggedImage = newExistingImages[draggedIndex];
        newExistingImages.splice(draggedIndex, 1);
        const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
        newExistingImages.splice(adjustedDropIndex, 0, draggedImage);
        onExistingImagesChange(newExistingImages);
      } else {
        const newNewImages = [...newImages];
        const draggedImage = newNewImages[draggedIndex];
        newNewImages.splice(draggedIndex, 1);
        const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
        newNewImages.splice(adjustedDropIndex, 0, draggedImage);
        onNewImagesChange(newNewImages);
      }
    }

    setDraggedIndex(null);
    setDraggedType(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggedType(null);
  };

  const removeExistingImage = (index: number) => {
    const newExistingImages = existingImages.filter((_, i) => i !== index);
    onExistingImagesChange(newExistingImages);
  };

  const removeNewImage = (index: number) => {
    const newNewImages = newImages.filter((_, i) => i !== index);
    onNewImagesChange(newNewImages);
  };

  const getNewImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const allImages = [
    ...existingImages.map((url, index) => ({ type: 'existing' as const, index, url })),
    ...newImages.map((file, index) => ({ type: 'new' as const, index, file, preview: getNewImagePreview(file) }))
  ];

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
          id="edit-image-upload"
        />
        <label
          htmlFor="edit-image-upload"
          className="cursor-pointer inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          <Upload className="w-5 h-5 mr-2 text-gray-500" />
          <span className="text-gray-700">Add New Images</span>
        </label>
        <p className="text-sm text-gray-500 mt-2">
          Supported formats: JPG, PNG, GIF, WebP. Drag and drop to reorder.
        </p>
      </div>

      {/* Image Thumbnails */}
      {allImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black">
              Product Images ({allImages.length})
            </p>
            {allImages.length > 0 && (
              <p className="text-xs text-gray-500">
                First image will be the primary product image
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allImages.map((item, globalIndex) => (
              <div
                key={`${item.type}-${item.index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, item.index, item.type)}
                onDragOver={(e) => handleDragOver(e, globalIndex, item.type)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, globalIndex, item.type)}
                onDragEnd={handleDragEnd}
                className={`
                  relative group cursor-move rounded-lg overflow-hidden border-2
                  ${globalIndex === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
                  ${draggedIndex === item.index && draggedType === item.type ? 'opacity-50' : ''}
                  ${dragOverIndex === globalIndex ? 'border-blue-400 bg-blue-50' : ''}
                  hover:border-gray-300 transition-all
                `}
              >
                {/* Primary Badge */}
                {globalIndex === 0 && (
                  <div className="absolute top-1 left-1 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Primary
                  </div>
                )}
                
                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => item.type === 'existing' ? removeExistingImage(item.index) : removeNewImage(item.index)}
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
                  src={item.type === 'existing' ? item.url : item.preview}
                  alt={item.type === 'existing' ? 'Product image' : item.file.name}
                  className="w-full h-24 object-cover"
                />
                
                {/* File Name / Type Indicator */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                  {item.type === 'existing' ? 'Existing' : item.file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {allImages.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No images</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add New Images" to start uploading</p>
        </div>
      )}
    </div>
  );
}

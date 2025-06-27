import { ArrowLeft, Loader, Save } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImageUpload } from "../components/ImageUpload";
import { apiService } from "../services/api";
import { CreateProductRequest } from "../types/product";

export const CreateProduct: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: "",
    price: 0,
    description: "",
    image: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateProductRequest, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleImageUploaded = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      image: imageUrl,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const newProduct = await apiService.createProduct(formData);
      navigate(`/product/${newProduct.id}`);
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="btn btn-secondary flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
      </div>

      {/* Form */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`input ${errors.name ? "border-red-500" : ""}`}
                  placeholder="Enter product name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                    className={`input pl-8 ${errors.price ? "border-red-500" : ""}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="input resize-none"
                  rows={4}
                  placeholder="Enter product description..."
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <ImageUpload onImageUploaded={handleImageUploaded} currentImage={formData.image} />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link to="/" className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex items-center space-x-2">
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Create Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

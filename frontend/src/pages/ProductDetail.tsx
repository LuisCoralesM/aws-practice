import { ArrowLeft, Calendar, DollarSign, Edit, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiService } from "../services/api";
import { Product } from "../types/product";

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getProduct(productId);
      setProduct(data);
    } catch (err) {
      setError("Product not found or failed to load.");
      console.error("Error loading product:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiService.deleteProduct(product.id);
      navigate("/", { replace: true });
    } catch (err) {
      alert("Failed to delete product. Please try again.");
      console.error("Error deleting product:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Product not found"}</p>
        <Link to="/" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="btn btn-secondary flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Link to={`/product/${product.id}/edit`} className="btn btn-primary flex items-center space-x-2">
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Link>
          <button onClick={handleDelete} disabled={isDeleting} className="btn btn-danger flex items-center space-x-2">
            <Trash2 className="h-4 w-4" />
            <span>{isDeleting ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      </div>

      {/* Product Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-lg">No image available</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Price */}
          <div className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-primary-600" />
            <span className="text-4xl font-bold text-primary-600">{formatPrice(product.price)}</span>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Product Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(product.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(product.updated_at)}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Product ID: <span className="font-mono text-gray-900">{product.id}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

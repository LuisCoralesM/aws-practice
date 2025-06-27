import { Edit, Eye, Trash2 } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete, isDeleting = false }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Product Image */}
      <div className="aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
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
            <span className="text-sm">No image</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>

        <p className="text-2xl font-bold text-primary-600">{formatPrice(product.price)}</p>

        {product.description && <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>}

        <div className="text-xs text-gray-500">Updated: {formatDate(product.updated_at)}</div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <Link to={`/product/${product.id}`} className="btn btn-secondary flex items-center space-x-1 text-sm">
            <Eye className="h-4 w-4" />
            <span>View</span>
          </Link>

          <Link to={`/product/${product.id}/edit`} className="btn btn-secondary flex items-center space-x-1 text-sm">
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Link>
        </div>

        <button
          onClick={() => onDelete(product.id)}
          disabled={isDeleting}
          className="btn btn-danger flex items-center space-x-1 text-sm"
        >
          <Trash2 className="h-4 w-4" />
          <span>{isDeleting ? "Deleting..." : "Delete"}</span>
        </button>
      </div>
    </div>
  );
};

import { Filter, Grid, List, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { apiService } from "../services/api";
import { Product } from "../types/product";

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "created_at">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, sortBy, sortOrder]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getProducts();
      setProducts(response.products);
    } catch (err) {
      setError("Failed to load products. Please try again.");
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === "price") {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortBy === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      setDeletingIds((prev) => new Set(prev).add(id));
      await apiService.deleteProduct(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err) {
      alert("Failed to delete product. Please try again.");
      console.error("Error deleting product:", err);
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={loadProducts} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            {filteredProducts.length} of {products.length} products
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="input w-auto">
              <option value="created_at">Date Created</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="btn btn-secondary"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-primary-100 text-primary-600" : "text-gray-400"}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-primary-100 text-primary-600" : "text-gray-400"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchTerm ? "No products found matching your search." : "No products yet."}
          </p>
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="btn btn-primary mt-4">
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          }`}
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={handleDelete}
              isDeleting={deletingIds.has(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

import { Package, Plus } from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">AWS Practice</span>
              </Link>
            </div>

            <nav className="flex items-center space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/"
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                Products
              </Link>
              <Link to="/create" className="btn btn-primary flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">&copy; 2025 AWS Practice by Luis Corales</p>
        </div>
      </footer>
    </div>
  );
};

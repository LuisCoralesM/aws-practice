import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CreateProduct } from "./pages/CreateProduct";
import { EditProduct } from "./pages/EditProduct";
import { ProductDetail } from "./pages/ProductDetail";
import { ProductList } from "./pages/ProductList";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/product/:id/edit" element={<EditProduct />} />
          <Route path="/create" element={<CreateProduct />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

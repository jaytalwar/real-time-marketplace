import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const Orders = lazy(() => import("./pages/Orders"));
const Product = lazy(() => import("./pages/Product"));
const AddProduct = lazy(() => import("./pages/AddProduct"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Assistant = lazy(() => import("./pages/Assistant"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Loader2 className="animate-spin text-brand-700" size={28} />
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/assistant" element={<Assistant />} />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller"
            element={
              <ProtectedRoute role="seller">
                <SellerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/add"
            element={
              <ProtectedRoute role="seller">
                <AddProduct />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/edit/:id"
            element={
              <ProtectedRoute role="seller">
                <EditProduct />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;

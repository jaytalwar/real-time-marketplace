import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { createProduct } from "../services/productService";
import ProductForm from "../components/ProductForm";

export default function AddProduct() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (values) => {
    setSubmitting(true);
    try {
      await createProduct(values);
      toast.success("Product added");
      navigate("/seller");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-xl font-bold text-slate-900">Add Product</h1>
      <ProductForm onSubmit={submit} submitLabel="Add Product" submitting={submitting} />
    </div>
  );
}

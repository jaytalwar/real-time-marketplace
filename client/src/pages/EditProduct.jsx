import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { getProductById, updateProduct } from "../services/productService";
import ProductForm from "../components/ProductForm";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getProductById(id)
      .then(setProduct)
      .catch(() => toast.error("Could not load product"))
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async (values) => {
    setSubmitting(true);
    try {
      await updateProduct(id, values);
      toast.success("Product updated");
      navigate("/seller");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand-700" size={28} />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-xl font-bold text-slate-900">Edit Product</h1>
      <ProductForm
        initialValues={{
          title: product.title,
          description: product.description,
          category: product.category,
          image: product.image,
          price: product.price,
          stock: product.stock,
        }}
        onSubmit={submit}
        submitLabel="Save Changes"
        submitting={submitting}
      />
    </div>
  );
}

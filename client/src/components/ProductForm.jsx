import { useState } from "react";
import { Sparkles, Loader2, ImageOff } from "lucide-react";
import toast from "react-hot-toast";

import Button from "./ui/Button";
import { generateDescription } from "../services/aiService";

const FIELD_CLASS =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function ProductForm({ initialValues, onSubmit, submitLabel, submitting }) {
  const [form, setForm] = useState(
    initialValues || {
      title: "",
      description: "",
      category: "",
      image: "",
      price: "",
      stock: "",
    }
  );
  const [generating, setGenerating] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleGenerate = async () => {
    if (!form.title.trim()) {
      toast.error("Add a product title first so AI knows what to describe");
      return;
    }

    setGenerating(true);
    try {
      const { description } = await generateDescription({
        title: form.title,
        category: form.category,
      });
      setForm((f) => ({ ...f, description }));
      toast.success("AI description generated");
    } catch (err) {
      if (err.response?.status === 503) {
        toast.error("AI isn't configured on the server yet (missing ANTHROPIC_API_KEY)");
      } else {
        toast.error("Couldn't generate a description right now");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input
            name="title"
            required
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Wireless Noise Cancelling Headphones"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Generate with AI
            </button>
          </div>
          <textarea
            name="description"
            required
            rows={6}
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the product, its features and condition"
            className={FIELD_CLASS}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <input
              name="category"
              required
              value={form.category}
              onChange={handleChange}
              placeholder="e.g. Electronics"
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Image URL</label>
            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://..."
              className={FIELD_CLASS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Price (₹)</label>
            <input
              type="number"
              name="price"
              required
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Stock</label>
            <input
              type="number"
              name="stock"
              required
              min="0"
              value={form.stock}
              onChange={handleChange}
              className={FIELD_CLASS}
            />
          </div>
        </div>

        <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-slate-700">Preview</p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex aspect-square w-full items-center justify-center bg-slate-100 text-slate-300">
            {form.image ? (
              <img
                src={form.image}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <ImageOff size={32} />
            )}
          </div>
          <div className="p-3">
            <p className="line-clamp-1 text-sm font-medium text-slate-800">
              {form.title || "Product title"}
            </p>
            <p className="mt-1 text-base font-bold text-slate-900">
              {form.price ? `₹${form.price}` : "₹0"}
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}

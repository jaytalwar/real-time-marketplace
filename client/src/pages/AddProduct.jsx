import { useState } from "react";
import { createProduct } from "../services/productService";
import { useNavigate } from "react-router-dom";

export default function AddProduct() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    image: "",
    stock: 0,
    price: 0,
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    await createProduct(form);

    navigate("/seller");
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Add Product</h1>

      <form onSubmit={submit}>
        <input
          name="title"
          placeholder="Title"
          onChange={handleChange}
        />
        <br /><br />

        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
        />
        <br /><br />

        <input
          name="category"
          placeholder="Category"
          onChange={handleChange}
        />
        <br /><br />

        <input
          name="image"
          placeholder="Image URL"
          onChange={handleChange}
        />
        <br /><br />

        <input
          type="number"
          name="price"
          placeholder="Price"
          onChange={handleChange}
        />
        <br /><br />

        <input
          type="number"
          name="stock"
          placeholder="Stock"
          onChange={handleChange}
        />
        <br /><br />

        <button>Add Product</button>
      </form>
    </div>
  );
}
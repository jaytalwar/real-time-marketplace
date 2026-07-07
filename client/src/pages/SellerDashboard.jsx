import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyProducts,
  deleteProduct,
} from "../services/productService";

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);

  const loadProducts = async () => {
    try {
      const data = await getMyProducts();
      setProducts(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete Product?")) return;

    await deleteProduct(id);

    loadProducts();
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Seller Dashboard</h1>

      <Link to="/seller/add">
        <button>Add Product</button>
      </Link>

      <br />
      <br />

      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%" }}
      >
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>
                <img
                  src={p.image}
                  width="70"
                />
              </td>

              <td>{p.title}</td>

              <td>₹{p.price}</td>

              <td>{p.stock}</td>

              <td>
                <Link to={`/seller/edit/${p._id}`}>
                  Edit
                </Link>
              </td>

              <td>
                <button
                  onClick={() =>
                    handleDelete(p._id)
                  }
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "10px",
        padding: "15px",
      }}
    >
      <img
        src={product.image}
        alt={product.title}
        style={{
          width: "100%",
          height: "220px",
          objectFit: "cover",
        }}
      />

      <h3>{product.title}</h3>

      <h2>₹{product.price}</h2>

      <p>{product.category}</p>

      <Link to={`/product/${product._id}`}>
        View Product
      </Link>
    </div>
  );
}
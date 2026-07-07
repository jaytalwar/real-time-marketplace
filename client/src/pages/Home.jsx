import { useEffect, useState } from "react";

import { getProducts } from "../services/productService";

import ProductCard from "../components/ProductCard";

export default function Home() {

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchProducts = async () => {

      try {

        const data = await getProducts();

        setProducts(data.products);

      } catch (err) {

        console.log(err);

      }

      setLoading(false);

    };

    fetchProducts();

  }, []);

  if (loading) {

    return <h2>Loading...</h2>;

  }

  return (

    <div
      style={{
        padding: "30px",
      }}
    >

      <h1>Marketplace</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill,minmax(250px,1fr))",
          gap: "20px",
        }}
      >

        {products.map((product) => (

          <ProductCard
            key={product._id}
            product={product}
          />

        ))}

      </div>

    </div>

  );

}
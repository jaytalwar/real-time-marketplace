import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import { getProductById } from "../services/productService";
import { createOrder } from "../services/orderService";
import toast from "react-hot-toast";

export default function Product() {

  const { id } = useParams();

  const [product, setProduct] = useState(null);

  useEffect(() => {

    const fetchProduct = async () => {

      const data = await getProductById(id);

      setProduct(data);

    };

    fetchProduct();

  }, []);

  if (!product) {

    return <h2>Loading...</h2>;

  }

  return (

    <div
      style={{
        padding: "30px",
      }}
    >

      <img
        src={product.image}
        width="350"
      />

      <h1>{product.title}</h1>

      <h2>₹{product.price}</h2>

      <p>{product.description}</p>

      <p>

        Seller :

        {product.seller.name}

      </p>

      <p>

        Stock :

        {product.stock}

      </p>

      <button
onClick={async()=>{

await createOrder([
{
product:product._id,
quantity:1
}
]);

toast.success("Order Placed");

}}
>
Buy Now
</button>

    </div>

  );

}
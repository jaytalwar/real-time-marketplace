import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";

let cache = null;
let inflight = null;

const fetchCategories = async () => {
  if (cache) return cache;
  if (!inflight) {
    inflight = getProducts(1, "", "", "-createdAt", 100)
      .then((data) => {
        const unique = [
          ...new Set((data.products || []).map((p) => p.category).filter(Boolean)),
        ];
        cache = unique;
        return unique;
      })
      .catch(() => []);
  }
  return inflight;
};

export default function useCategories() {
  const [categories, setCategories] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let active = true;
    if (cache) return;

    fetchCategories().then((data) => {
      if (active) {
        setCategories(data);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}

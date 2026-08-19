import api from "./api";

export const getProducts = async (
  page = 1,
  search = "",
  category = "",
  sort = "-createdAt",
  limit = 12,
  minPrice,
  maxPrice
) => {
  const { data } = await api.get("/products", {
    params: {
      page,
      search,
      category,
      sort,
      limit,
      minPrice,
      maxPrice,
    },
  });

  return data;
};

export const getMyProducts = async () => {
    const { data } = await api.get("/products/my-products");
    return data;
};

export const createProduct = async (product) => {
    const { data } = await api.post("/products", product);
    return data;
};

export const updateProduct = async (id, product) => {
    const { data } = await api.put(`/products/${id}`, product);
    return data;
};

export const deleteProduct = async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
};

export const getProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);

  return data;
};
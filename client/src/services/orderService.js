import api from "./api";

export const createOrder = async (items) => {
  const { data } = await api.post("/orders", {
    items,
  });

  return data;
};

export const getMyOrders = async () => {
  const { data } = await api.get("/orders/my");

  return data;
};

export const getAllOrders = async () => {
  const { data } = await api.get("/orders/all");

  return data;
};

export const updateStatus = async (
  id,
  status
) => {
  const { data } = await api.patch(
    `/orders/${id}/status`,
    {
      status,
    }
  );

  return data;
};
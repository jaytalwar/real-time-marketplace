import api from "./api";

export const askAssistant = async (message, history = [], productContext = null) => {
  const { data } = await api.post("/ai/assistant", { message, history, productContext });
  return data;
};

export const generateDescription = async ({ title, category, keywords }) => {
  const { data } = await api.post("/ai/generate-description", {
    title,
    category,
    keywords,
  });
  return data;
};

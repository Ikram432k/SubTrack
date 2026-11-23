const KEY = "token";

export const saveToken = (token: string) => localStorage.setItem(KEY, token);
export const getToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(KEY);
export const clearToken = () => localStorage.removeItem(KEY);
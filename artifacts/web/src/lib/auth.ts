import { setAuthTokenGetter } from "@workspace/api-client-react";

export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearAuthToken(): void {
  localStorage.removeItem("token");
}

// Configure the generated fetch client to use the token
setAuthTokenGetter(() => {
  return getAuthToken();
});

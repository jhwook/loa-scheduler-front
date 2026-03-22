/** POST /users/me/lostark-api-key — 백엔드 필드명이 다르면 `users.ts`에서만 수정 */
export type RegisterLostarkApiKeyRequest = {
  apiKey: string;
};

import { apiFetch } from "@/lib/api/client";
import type { LoginRequest, LoginResponse, SignupRequest } from "@/types/auth";

/** 백엔드가 snake_case / 다른 필드명을 쓰면 여기서 매핑 */
type RawLoginResponse = {
  accessToken?: string;
  token?: string;
  expiresIn?: number;
  hasApiToken?: boolean | string | number | null;
  lostarkApiToken?: string | null;
  user?: {
    hasApiToken?: boolean | string | number | null;
    lostarkApiToken?: string | null;
  };
  character?: {
    hasApiToken?: boolean | string | number | null;
    lostarkApiToken?: string | null;
  };
};

function normalizeBooleanLike(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1" || v === "y" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "n" || v === "no") return false;
  }
  return null;
}

function pickHasApiToken(raw: RawLoginResponse): boolean {
  const root = normalizeBooleanLike(raw.hasApiToken);
  if (root !== null) return root;
  const user = normalizeBooleanLike(raw.user?.hasApiToken);
  if (user !== null) return user;
  const character = normalizeBooleanLike(raw.character?.hasApiToken);
  if (character !== null) return character;
  return false;
}

function pickLostarkApiToken(raw: RawLoginResponse): string | null {
  if (typeof raw.lostarkApiToken === "string" && raw.lostarkApiToken.trim()) {
    return raw.lostarkApiToken;
  }
  if (
    raw.user &&
    typeof raw.user.lostarkApiToken === "string" &&
    raw.user.lostarkApiToken.trim()
  ) {
    return raw.user.lostarkApiToken;
  }
  if (
    raw.character &&
    typeof raw.character.lostarkApiToken === "string" &&
    raw.character.lostarkApiToken.trim()
  ) {
    return raw.character.lostarkApiToken;
  }
  return null;
}

const LOGIN_PATH = "/auth/login";

/**
 * POST {BASE_URL}/auth/login — body: { username, password }
 */
export async function loginApi(credentials: LoginRequest): Promise<LoginResponse> {
  const raw = await apiFetch<RawLoginResponse>(LOGIN_PATH, {
    method: "POST",
    json: {
      username: credentials.username,
      password: credentials.password,
    },
  });

  const accessToken = raw.accessToken ?? raw.token;
  if (!accessToken) {
    throw new Error("Login response did not include accessToken or token");
  }

  return {
    accessToken,
    expiresIn: raw.expiresIn,
    hasApiToken: pickHasApiToken(raw),
    lostarkApiToken: pickLostarkApiToken(raw),
  };
}

const SIGNUP_PATH = "/auth/signup";

/**
 * POST {BASE_URL}/auth/signup — body: { username, password }
 */
export async function signupApi(payload: SignupRequest): Promise<void> {
  await apiFetch<unknown>(SIGNUP_PATH, {
    method: "POST",
    json: {
      username: payload.username,
      password: payload.password,
    },
  });
}

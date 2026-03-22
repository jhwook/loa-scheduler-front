import { apiFetch } from "@/lib/api/client";
import type { LoginRequest, LoginResponse, SignupRequest } from "@/types/auth";

/** 백엔드가 snake_case / 다른 필드명을 쓰면 여기서 매핑 */
type RawLoginResponse = {
  accessToken?: string;
  token?: string;
  expiresIn?: number;
  hasApiToken?: boolean;
  user?: { hasApiToken?: boolean };
  character?: { hasApiToken?: boolean };
};

function pickHasApiToken(raw: RawLoginResponse): boolean {
  if (typeof raw.hasApiToken === "boolean") return raw.hasApiToken;
  if (raw.user && typeof raw.user.hasApiToken === "boolean") {
    return raw.user.hasApiToken;
  }
  if (raw.character && typeof raw.character.hasApiToken === "boolean") {
    return raw.character.hasApiToken;
  }
  return false;
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

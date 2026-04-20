/** 아이디·비밀번호는 각각 20자 이하(프론트 검증). 백엔드와 동일하게 username 사용. */
export type LoginRequest = {
  username: string;
  password: string;
};

/** 백엔드 스키마에 맞게 필드명만 조정하면 됩니다. */
export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  /** Lostark API 키 등록 여부. false면 원정대 화면에서 등록 버튼 표시 */
  hasApiToken: boolean;
  /** 백엔드가 토큰 원문을 내려주는 경우 */
  lostarkApiToken?: string | null;
};

/** 회원가입 API 요청 (POST /auth/signup) */
export type SignupRequest = {
  username: string;
  nickname: string;
  password: string;
};

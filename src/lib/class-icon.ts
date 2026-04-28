/**
 * `public/class-icons/{이름}.png` 와 LOA API `characterClassName` 매핑.
 * 파일명은 NFC 기준 한글과 동일하게 맞춰 두었습니다.
 */

const CANONICAL_CLASS_ICONS = new Set([
  '가디언나이트',
  '건슬링어',
  '기공사',
  '기상술사',
  '데모닉',
  '데빌헌터',
  '도화가',
  '디트로이드',
  '리퍼',
  '바드',
  '발키리',
  '배틀마스터',
  '버서커',
  '브레이커',
  '블래스터',
  '블레이드',
  '서머너',
  '소서리스',
  '소울이터',
  '스카우터',
  '스트라이커',
  '슬레이어',
  '아르카나',
  '워로드',
  '인파이터',
  '창술사',
  '호크아이',
  '홀리나이트',
  '환수사',
]);

/** API·표기 차이 → 아이콘 파일 베이스명 */
const CLASS_ICON_ALIASES: Record<string, string> = {
  배틀마스터: '배마',
  인파이터: '인파',
  건슬링어: '건슬',
  호크아이: '호크',
  디스트로이어: '디트',
  데빌헌터: '데헌',
  '데빌 헌터': '데헌',
  슬레이어: '슬레',
  '가디언 나이트': '가디언나이트',
  Valkyrie: '발키리',
  valkyrie: '발키리',
};

function normalizeKey(s: string): string {
  return s.trim().normalize('NFC');
}

/**
 * 아이콘 PNG 베이스명(확장자 제외). 없으면 null → UI에서 글자 마크 폴백.
 */
export function resolveClassIconBasename(
  characterClassName: string | null | undefined
): string | null {
  if (!characterClassName?.trim()) return null;
  const n = normalizeKey(characterClassName);
  const compact = n.replace(/\s+/g, '');

  const alias =
    CLASS_ICON_ALIASES[n] ?? CLASS_ICON_ALIASES[compact] ?? undefined;
  if (alias && CANONICAL_CLASS_ICONS.has(alias)) return alias;

  if (CANONICAL_CLASS_ICONS.has(n)) return n;
  if (CANONICAL_CLASS_ICONS.has(compact)) return compact;

  return null;
}

/** 브라우저용 정적 경로 (`public/class-icons`) */
export function getClassIconSrc(basename: string): string {
  return `/class-icons/${encodeURIComponent(basename)}.png`;
}

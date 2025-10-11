/**
 * Photographer Signup Constants
 * 사진작가 회원가입 관련 상수
 */

export const PHOTOGRAPHER_SPECIALTIES = [
  { value: 'portrait', label: '인물 사진' },
  { value: 'wedding', label: '웨딩' },
  { value: 'event', label: '행사' },
  { value: 'product', label: '제품' },
  { value: 'food', label: '음식' },
  { value: 'architecture', label: '건축' },
  { value: 'landscape', label: '풍경' },
  { value: 'fashion', label: '패션' },
  { value: 'pet', label: '반려동물' },
  { value: 'other', label: '기타' },
] as const;

export const AGE_RANGES = ['20대', '30대', '40대', '50대 이상'] as const;

export const KOREAN_CITIES = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
] as const;

export const SIGNUP_STEPS = [
  { id: 1, title: '기본 정보', icon: 'User' },
  { id: 2, title: '연락처 정보', icon: 'Camera' },
  { id: 3, title: '전문 분야', icon: 'MapPin' },
  { id: 4, title: '가격 정보', icon: 'DollarSign' },
  { id: 5, title: '포트폴리오', icon: 'FileImage' },
] as const;

export type PhotographerSpecialty = typeof PHOTOGRAPHER_SPECIALTIES[number]['value'];
export type AgeRange = typeof AGE_RANGES[number];
export type KoreanCity = typeof KOREAN_CITIES[number];

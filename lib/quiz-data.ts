// 성격유형 정의
export type PersonalityType = 'A1' | 'A2' | 'B1' | 'C1' | 'D1' | 'E1' | 'E2' | 'F1' | 'F2';

export interface PersonalityTypeInfo {
  code: PersonalityType;
  name: string;
  description: string;
  examplePerson: string;
  styleKeywords: string[];
  recommendedLocations: string[];
  recommendedProps: string[];
  color: string;
  bgColor: string;
}

export const personalityTypes: Record<PersonalityType, PersonalityTypeInfo> = {
  A1: {
    code: 'A1',
    name: '고요한 관찰자',
    description: '혼자만의 시선과 조용한 분위기를 선호하는 섬세한 감성의 소유자입니다.',
    examplePerson: '조용한 카페에서 혼자 책을 읽는 사람',
    styleKeywords: ['차분함', '내성적', '관찰', '섬세함', '조용함'],
    recommendedLocations: ['조용한 공원', '작은 카페', '도서관', '골목길'],
    recommendedProps: ['책', '노트', '따뜻한 음료', '안경'],
    color: 'from-gray-400 to-gray-600',
    bgColor: 'from-gray-50 to-gray-100'
  },
  A2: {
    code: 'A2',
    name: '따뜻한 동행자',
    description: '따뜻하고 감정적인 관계를 선호하는 다정한 성격의 소유자입니다.',
    examplePerson: '친구와 함께 걸으며 이야기하는 사람',
    styleKeywords: ['따뜻함', '감성적', '동행', '다정함', '배려'],
    recommendedLocations: ['공원 산책로', '카페 테라스', '꽃길', '따뜻한 실내'],
    recommendedProps: ['꽃다발', '따뜻한 스카프', '핫팩', '함께하는 소품'],
    color: 'from-amber-400 to-orange-600',
    bgColor: 'from-amber-50 to-orange-100'
  },
  B1: {
    code: 'B1',
    name: '감성 기록자',
    description: '일상의 감성을 포착하고 편안한 분위기를 추구하는 내추럴한 힐러입니다.',
    examplePerson: '일상의 소소한 순간들을 소중히 여기는 사람',
    styleKeywords: ['자연스러움', '힐링', '감성', '일상', '평온'],
    recommendedLocations: ['자연 속', '한적한 길', '집 근처 공원', '작은 정원'],
    recommendedProps: ['드라이플라워', '내추럴 소품', '편안한 의상', '자연 재질 액세서리'],
    color: 'from-emerald-400 to-green-600',
    bgColor: 'from-emerald-50 to-green-100'
  },
  C1: {
    code: 'C1',
    name: '시네마틱 몽상가',
    description: '구조적 아름다움과 도시적 감성을 선호하는 시크한 미니멀리스트입니다.',
    examplePerson: '도시의 건축물을 감상하며 걷는 사람',
    styleKeywords: ['시크함', '미니멀', '도시적', '구조적', '세련됨'],
    recommendedLocations: ['모던 건축물', '도시 거리', '깔끔한 실내', '기하학적 공간'],
    recommendedProps: ['미니멀 액세서리', '깔끔한 의상', '단순한 소품', '모던 아이템'],
    color: 'from-blue-400 to-blue-600',
    bgColor: 'from-blue-50 to-blue-100'
  },
  D1: {
    code: 'D1',
    name: '활력 가득 리더',
    description: '밝고 에너지 넘치는 구도를 선호하는 캐주얼한 낙천주의자입니다.',
    examplePerson: '친구들과 함께 웃으며 활동하는 사람',
    styleKeywords: ['활력', '밝음', '리더십', '에너지', '긍정'],
    recommendedLocations: ['넓은 광장', '활기찬 거리', '밝은 실내', '야외 공간'],
    recommendedProps: ['밝은 색상 의상', '스포티한 소품', '활동적인 아이템', '컬러풀한 액세서리'],
    color: 'from-red-400 to-red-600',
    bgColor: 'from-red-50 to-red-100'
  },
  E1: {
    code: 'E1',
    name: '도시의 드리머',
    description: '도시적인 빛과 그림자를 사랑하는 꿈꾸는 영혼의 소유자입니다.',
    examplePerson: '도시 야경을 보며 꿈을 꾸는 사람',
    styleKeywords: ['도시적', '꿈꾸는', '빛과그림자', '감성적', '로맨틱'],
    recommendedLocations: ['도시 야경', '네온사인 거리', '고층빌딩', '도시 전망대'],
    recommendedProps: ['반짝이는 소품', '도시적 의상', '조명 효과', '글리터'],
    color: 'from-purple-400 to-purple-600',
    bgColor: 'from-purple-50 to-purple-100'
  },
  E2: {
    code: 'E2',
    name: '무심한 예술가',
    description: '실험적이고 감성적인 접근을 선호하는 자유로운 아티스트입니다.',
    examplePerson: '자신만의 스타일로 예술을 추구하는 사람',
    styleKeywords: ['예술적', '실험적', '무심함', '독창적', '자유로움'],
    recommendedLocations: ['갤러리', '독특한 공간', '예술적 배경', '창작 공간'],
    recommendedProps: ['예술적 소품', '독특한 의상', '창작 도구', '개성 있는 액세서리'],
    color: 'from-indigo-400 to-indigo-600',
    bgColor: 'from-indigo-50 to-indigo-100'
  },
  F1: {
    code: 'F1',
    name: '자유로운 탐험가',
    description: '틀에 얽매이지 않는 역동적 탐색을 즐기는 모험가 정신의 소유자입니다.',
    examplePerson: '새로운 장소를 탐험하며 모험을 즐기는 사람',
    styleKeywords: ['자유로움', '탐험', '역동적', '모험', '개방적'],
    recommendedLocations: ['자연 속', '모험적 장소', '새로운 공간', '야외 활동지'],
    recommendedProps: ['아웃도어 의상', '탐험 도구', '자연친화적 소품', '활동적 액세서리'],
    color: 'from-orange-400 to-orange-600',
    bgColor: 'from-orange-50 to-orange-100'
  },
  F2: {
    code: 'F2',
    name: '감각적 실험가',
    description: '콘셉트 있고 독특한 시도를 선호하는 창의적 실험가입니다.',
    examplePerson: '새로운 스타일을 실험하며 창조하는 사람',
    styleKeywords: ['감각적', '독특함', '콘셉추얼', '창의적', '실험적'],
    recommendedLocations: ['독특한 공간', '실험적 장소', '아트 스페이스', '트렌디한 장소'],
    recommendedProps: ['독창적 의상', '실험적 소품', '감각적 액세서리', '콘셉추얼 아이템'],
    color: 'from-pink-400 to-pink-600',
    bgColor: 'from-pink-50 to-pink-100'
  }
};

// 질문 인터페이스
export interface QuizQuestion {
  id: number;
  part: '감정' | '사진';
  question: string;
  choices: QuizChoice[];
}

export interface QuizChoice {
  id: string;
  text: string;
  weights: Record<PersonalityType, number>;
}

// 21개 질문 데이터
export const quizQuestions: QuizQuestion[] = [
  // 감정 파트 (1-10)
  {
    id: 1,
    part: '감정',
    question: '친구들과의 모임에서 나는 주로...',
    choices: [
      {
        id: '1a',
        text: '조용히 관찰하며 필요할 때만 대화에 참여한다',
        weights: { A1: 3, A2: 1, B1: 2, C1: 2, D1: 0, E1: 1, E2: 2, F1: 0, F2: 1 }
      },
      {
        id: '1b',
        text: '모든 사람이 편안하도록 분위기를 맞춘다',
        weights: { A1: 0, A2: 3, B1: 2, C1: 1, D1: 2, E1: 1, E2: 0, F1: 1, F2: 0 }
      },
      {
        id: '1c',
        text: '활발하게 대화를 이끌고 분위기를 주도한다',
        weights: { A1: 0, A2: 1, B1: 0, C1: 0, D1: 3, E1: 1, E2: 1, F1: 2, F2: 2 }
      },
      {
        id: '1d',
        text: '관심 있는 주제에만 집중해서 깊게 대화한다',
        weights: { A1: 2, A2: 0, B1: 1, C1: 2, D1: 0, E1: 2, E2: 3, F1: 0, F2: 2 }
      }
    ]
  },
  {
    id: 2,
    part: '감정',
    question: '스트레스를 받을 때 나는...',
    choices: [
      {
        id: '2a',
        text: '혼자만의 시간을 갖고 차분히 생각한다',
        weights: { A1: 3, A2: 1, B1: 2, C1: 2, D1: 0, E1: 2, E2: 2, F1: 0, F2: 1 }
      },
      {
        id: '2b',
        text: '믿을 만한 사람과 이야기를 나눈다',
        weights: { A1: 1, A2: 3, B1: 2, C1: 1, D1: 1, E1: 1, E2: 0, F1: 1, F2: 0 }
      },
      {
        id: '2c',
        text: '활동적인 일을 하며 에너지를 발산한다',
        weights: { A1: 0, A2: 0, B1: 1, C1: 0, D1: 3, E1: 1, E2: 1, F1: 3, F2: 1 }
      },
      {
        id: '2d',
        text: '창작 활동이나 예술적 표현을 통해 해소한다',
        weights: { A1: 1, A2: 0, B1: 1, C1: 1, D1: 0, E1: 2, E2: 3, F1: 1, F2: 3 }
      }
    ]
  },
  {
    id: 3,
    part: '감정',
    question: '새로운 환경에 적응할 때 나는...',
    choices: [
      {
        id: '3a',
        text: '천천히 관찰하고 신중하게 행동한다',
        weights: { A1: 3, A2: 2, B1: 2, C1: 2, D1: 0, E1: 1, E2: 1, F1: 0, F2: 1 }
      },
      {
        id: '3b',
        text: '주변 사람들과 친해지려 노력한다',
        weights: { A1: 0, A2: 3, B1: 1, C1: 1, D1: 2, E1: 1, E2: 0, F1: 2, F2: 1 }
      },
      {
        id: '3c',
        text: '적극적으로 탐험하고 도전한다',
        weights: { A1: 0, A2: 1, B1: 0, C1: 1, D1: 3, E1: 2, E2: 2, F1: 3, F2: 2 }
      },
      {
        id: '3d',
        text: '나만의 방식으로 자연스럽게 적응한다',
        weights: { A1: 2, A2: 1, B1: 3, C1: 2, D1: 1, E1: 2, E2: 2, F1: 1, F2: 2 }
      }
    ]
  },
  {
    id: 4,
    part: '감정',
    question: '감정 표현에 있어서 나는...',
    choices: [
      {
        id: '4a',
        text: '내 감정을 잘 드러내지 않는 편이다',
        weights: { A1: 3, A2: 0, B1: 1, C1: 2, D1: 0, E1: 1, E2: 2, F1: 1, F2: 1 }
      },
      {
        id: '4b',
        text: '따뜻하고 진솔하게 감정을 표현한다',
        weights: { A1: 1, A2: 3, B1: 3, C1: 1, D1: 2, E1: 2, E2: 1, F1: 2, F2: 1 }
      },
      {
        id: '4c',
        text: '활발하고 직접적으로 감정을 드러낸다',
        weights: { A1: 0, A2: 1, B1: 1, C1: 0, D1: 3, E1: 1, E2: 1, F1: 3, F2: 2 }
      },
      {
        id: '4d',
        text: '창의적이고 독특한 방식으로 표현한다',
        weights: { A1: 1, A2: 0, B1: 0, C1: 1, D1: 0, E1: 2, E2: 3, F1: 1, F2: 3 }
      }
    ]
  },
  {
    id: 5,
    part: '감정',
    question: '휴식을 취할 때 나는...',
    choices: [
      {
        id: '5a',
        text: '조용한 곳에서 혼자만의 시간을 보낸다',
        weights: { A1: 3, A2: 1, B1: 2, C1: 2, D1: 0, E1: 1, E2: 2, F1: 0, F2: 1 }
      },
      {
        id: '5b',
        text: '가족이나 친한 친구와 따뜻한 시간을 보낸다',
        weights: { A1: 1, A2: 3, B1: 3, C1: 1, D1: 1, E1: 1, E2: 0, F1: 1, F2: 0 }
      },
      {
        id: '5c',
        text: '활동적인 취미나 운동을 한다',
        weights: { A1: 0, A2: 1, B1: 1, C1: 1, D1: 3, E1: 1, E2: 1, F1: 3, F2: 1 }
      },
      {
        id: '5d',
        text: '영감을 주는 예술이나 문화 활동을 한다',
        weights: { A1: 2, A2: 0, B1: 1, C1: 2, D1: 0, E1: 3, E2: 3, F1: 1, F2: 3 }
      }
    ]
  },
  {
    id: 6,
    part: '감정',
    question: '중요한 결정을 내릴 때 나는...',
    choices: [
      {
        id: '6a',
        text: '혼자 충분히 고민하고 신중하게 결정한다',
        weights: { A1: 3, A2: 1, B1: 2, C1: 2, D1: 0, E1: 2, E2: 2, F1: 1, F2: 1 }
      },
      {
        id: '6b',
        text: '주변 사람들의 의견을 듣고 함께 결정한다',
        weights: { A1: 1, A2: 3, B1: 2, C1: 1, D1: 2, E1: 1, E2: 0, F1: 1, F2: 0 }
      },
      {
        id: '6c',
        text: '직감적으로 빠르게 결정하고 실행한다',
        weights: { A1: 0, A2: 0, B1: 0, C1: 0, D1: 3, E1: 1, E2: 1, F1: 3, F2: 2 }
      },
      {
        id: '6d',
        text: '나만의 기준과 철학에 따라 결정한다',
        weights: { A1: 2, A2: 0, B1: 1, C1: 2, D1: 1, E1: 2, E2: 3, F1: 2, F2: 3 }
      }
    ]
  },
  {
    id: 7,
    part: '감정',
    question: '갈등 상황에서 나는...',
    choices: [
      {
        id: '7a',
        text: '조용히 물러나서 상황을 지켜본다',
        weights: { A1: 3, A2: 1, B1: 1, C1: 2, D1: 0, E1: 1, E2: 2, F1: 0, F2: 1 }
      },
      {
        id: '7b',
        text: '중재자 역할을 하며 화해를 시도한다',
        weights: { A1: 1, A2: 3, B1: 2, C1: 1, D1: 1, E1: 1, E2: 0, F1: 1, F2: 0 }
      },
      {
        id: '7c',
        text: '적극적으로 문제 해결에 나선다',
        weights: { A1: 0, A2: 1, B1: 1, C1: 1, D1: 3, E1: 1, E2: 1, F1: 3, F2: 2 }
      },
      {
        id: '7d',
        text: '나만의 방식으로 상황을 해석하고 대응한다',
        weights: { A1: 2, A2: 0, B1: 1, C1: 2, D1: 0, E1: 2, E2: 3, F1: 1, F2: 3 }
      }
    ]
  },
  {
    id: 8,
    part: '감정',
    question: '새로운 사람들과 만날 때 나는...',
    choices: [
      {
        id: '8a',
        text: '조용히 관찰하며 서서히 마음을 연다',
        weights: { A1: 3, A2: 2, B1: 2, C1: 2, D1: 0, E1: 1, E2: 2, F1: 0, F2: 1 }
      },
      {
        id: '8b',
        text: '친근하게 다가가며 편안한 분위기를 만든다',
        weights: { A1: 1, A2: 3, B1: 2, C1: 1, D1: 2, E1: 1, E2: 0, F1: 2, F2: 1 }
      },
      {
        id: '8c',
        text: '적극적으로 대화를 시작하고 이끈다',
        weights: { A1: 0, A2: 1, B1: 0, C1: 1, D1: 3, E1: 2, E2: 1, F1: 3, F2: 2 }
      },
      {
        id: '8d',
        text: '나만의 독특함으로 인상을 남긴다',
        weights: { A1: 1, A2: 0, B1: 0, C1: 1, D1: 1, E1: 2, E2: 3, F1: 2, F2: 3 }
      }
    ]
  },
  {
    id: 9,
    part: '감정',
    question: '일상 생활에서 나는...',
    choices: [
      {
        id: '9a',
        text: '규칙적이고 안정적인 패턴을 선호한다',
        weights: { A1: 3, A2: 2, B1: 2, C1: 2, D1: 1, E1: 1, E2: 0, F1: 0, F2: 0 }
      },
      {
        id: '9b',
        text: '사람들과의 관계를 중심으로 하루를 보낸다',
        weights: { A1: 1, A2: 3, B1: 2, C1: 1, D1: 2, E1: 1, E2: 0, F1: 2, F2: 1 }
      },
      {
        id: '9c',
        text: '매일 새로운 도전과 활동을 추구한다',
        weights: { A1: 0, A2: 1, B1: 1, C1: 1, D1: 3, E1: 2, E2: 2, F1: 3, F2: 2 }
      },
      {
        id: '9d',
        text: '기분과 영감에 따라 유동적으로 생활한다',
        weights: { A1: 1, A2: 0, B1: 2, C1: 1, D1: 1, E1: 2, E2: 3, F1: 2, F2: 3 }
      }
    ]
  },
  {
    id: 10,
    part: '감정',
    question: '성취감을 느낄 때는...',
    choices: [
      {
        id: '10a',
        text: '혼자만의 노력이 결실을 맺었을 때',
        weights: { A1: 3, A2: 1, B1: 2, C1: 2, D1: 1, E1: 2, E2: 2, F1: 1, F2: 2 }
      },
      {
        id: '10b',
        text: '다른 사람들에게 도움이 되었을 때',
        weights: { A1: 1, A2: 3, B1: 2, C1: 1, D1: 2, E1: 1, E2: 0, F1: 1, F2: 0 }
      },
      {
        id: '10c',
        text: '도전적인 목표를 달성했을 때',
        weights: { A1: 0, A2: 1, B1: 1, C1: 1, D1: 3, E1: 2, E2: 2, F1: 3, F2: 2 }
      },
      {
        id: '10d',
        text: '창의적인 작업을 완성했을 때',
        weights: { A1: 2, A2: 0, B1: 1, C1: 2, D1: 0, E1: 3, E2: 3, F1: 2, F2: 3 }
      }
    ]
  },

  // 사진 파트 (11-21)
  {
    id: 11,
    part: '사진',
    question: '사진을 찍을 때 선호하는 분위기는?',
    choices: [
      {
        id: '11a',
        text: '조용하고 차분한 분위기',
        weights: { A1: 3, A2: 2, B1: 3, C1: 2, D1: 0, E1: 1, E2: 1, F1: 0, F2: 1 }
      },
      {
        id: '11b',
        text: '따뜻하고 포근한 분위기',
        weights: { A1: 1, A2: 3, B1: 3, C1: 1, D1: 1, E1: 1, E2: 0, F1: 1, F2: 0 }
      },
      {
        id: '11c',
        text: '활기차고 역동적인 분위기',
        weights: { A1: 0, A2: 1, B1: 0, C1: 1, D1: 3, E1: 2, E2: 2, F1: 3, F2: 2 }
      },
      {
        id: '11d',
        text: '독특하고 예술적인 분위기',
        weights: { A1: 1, A2: 0, B1: 0, C1: 2, D1: 0, E1: 3, E2: 3, F1: 1, F2: 3 }
      }
    ]
  },
  {
    id: 12,
    part: '사진',
    question: '사진 속에서 표현하고 싶은 나의 모습은?',
    choices: [
      {
        id: '12a',
        text: '진솔하고 자연스러운 모습',
        weights: { A1: 2, A2: 3, B1: 3, C1: 1, D1: 2, E1: 1, E2: 1, F1: 2, F2: 1 }
      },
      {
        id: '12b',
        text: '세련되고 완성도 높은 모습',
        weights: { A1: 1, A2: 1, B1: 1, C1: 3, D1: 2, E1: 2, E2: 2, F1: 1, F2: 2 }
      },
      {
        id: '12c',
        text: '밝고 에너지 넘치는 모습',
        weights: { A1: 0, A2: 2, B1: 1, C1: 1, D1: 3, E1: 2, E2: 1, F1: 3, F2: 2 }
      },
      {
        id: '12d',
        text: '독창적이고 개성 있는 모습',
        weights: { A1: 2, A2: 0, B1: 0, C1: 2, D1: 1, E1: 3, E2: 3, F1: 2, F2: 3 }
      }
    ]
  },
  {
    id: 13,
    part: '사진',
    question: '사진을 찍을 때 선호하는 구도는?',
    choices: [
      {
        id: '13a',
        text: '안정적이고 균형 잡힌 구도',
        weights: { A1: 2, A2: 2, B1: 2, C1: 3, D1: 1, E1: 1, E2: 1, F1: 1, F2: 1 }
      },
      {
        id: '13b',
        text: '따뜻하고 친근한 느낌의 구도',
        weights: { A1: 1, A2: 3, B1: 3, C1: 1, D1: 2, E1: 1, E2: 0, F1: 2, F2: 0 }
      },
      {
        id: '13c',
        text: '역동적이고 움직임이 느껴지는 구도',
        weights: { A1: 0, A2: 1, B1: 1, C1: 1, D1: 3, E1: 2, E2: 2, F1: 3, F2: 2 }
      },
      {
        id: '13d',
        text: '독특하고 실험적인 구도',
        weights: { A1: 1, A2: 0, B1: 0, C1: 2, D1: 1, E1: 3, E2: 3, F1: 2, F2: 3 }
      }
    ]
  },
  {
    id: 14,
    part: '사진',
    question: '사진의 색감은 어떤 것을 선호하나요?',
    choices: [
      {
        id: '14a',
        text: '차분하고 절제된 색감',
        weights: { A1: 3, A2: 1, B1: 2, C1: 3, D1: 0, E1: 1, E2: 2, F1: 0, F2: 1 }
      },
      {
        id: '14b',
        text: '따뜻하고 자연스러운 색감',
        weights: { A1: 1, A2: 3, B1: 3, C1: 1, D1: 1, E1: 1, E2: 1, F1: 2, F2: 1 }
      },
      {
        id: '14c',
        text: '밝고 화사한 색감',
        weights: { A1: 0, A2: 2, B1: 1, C1: 1, D1: 3, E1: 2, E2: 1, F1: 3, F2: 2 }
      },
      {
        id: '14d',
        text: '독특하고 인상적인 색감',
        weights: { A1: 1, A2: 0, B1: 0, C1: 2, D1: 1, E1: 3, E2: 3, F1: 2, F2: 3 }
      }
    ]
  },
  {
    id: 15,
    part: '사진',
    question: '사진 촬영 장소로 선호하는 곳은?',
    choices: [
      {
        id: '15a',
        text: '조용하고 한적한 자연 속',
        weights: { A1: 3, A2: 2, B1: 3, C1: 1, D1: 0, E1: 1, E2: 2, F1: 2, F2: 1 }
      },
      {
        id: '15b',
        text: '따뜻하고 아늑한 실내 공간',
        weights: { A1: 2, A2: 3, B1: 2, C1: 2, D1: 1, E1: 1, E2: 1, F1: 0, F2: 1 }
      },
      {
        id: '15c',
        text: '활기찬 도시의 거리나 광장',
        weights: { A1: 0, A2: 1, B1: 0, C1: 2, D1: 3, E1: 3, E2: 1, F1: 2, F2: 2 }
      },
      {
        id: '15d',
        text: '독특하고 특별한 장소',
        weights: { A1: 1, A2: 0, B1: 1, C1: 2, D1: 1, E1: 2, E2: 3, F1: 3, F2: 3 }
      }
    ]
  },
  {
    id: 16,
    part: '사진',
    question: '사진 속 조명은 어떤 것을 선호하나요?',
    choices: [
      {
        id: '16a',
        text: '부드럽고 자연스러운 조명',
        weights: { A1: 2, A2: 3, B1: 3, C1: 2, D1: 1, E1: 1, E2: 1, F1: 2, F2: 1 }
      },
      {
        id: '16b',
        text: '깔끔하고 명확한 조명',
        weights: { A1: 2, A2: 1, B1: 1, C1: 3, D1: 2, E1: 1, E2: 2, F1: 1, F2: 2 }
      },
      {
        id: '16c',
        text: '밝고 화사한 조명',
        weights: { A1: 0, A2: 2, B1: 2, C1: 1, D1: 3, E1: 2, E2: 1, F1: 3, F2: 2 }
      },
      {
        id: '16d',
        text: '드라마틱하고 극적인 조명',
        weights: { A1: 1, A2: 0, B1: 0, C1: 2, D1: 1, E1: 3, E2: 3, F1: 1, F2: 3 }
      }
    ]
  },
  {
    id: 17,
    part: '사진',
    question: '사진에 포함시키고 싶은 소품이나 요소는?',
    choices: [
      {
        id: '17a',
        text: '최소한의 자연스러운 소품',
        weights: { A1: 3, A2: 2, B1: 3, C1: 2, D1: 1, E1: 1, E2: 1, F1: 1, F2: 1 }
      },
      {
        id: '17b',
        text: '따뜻함을 더하는 아늑한 소품',
        weights: { A1: 1, A2: 3, B1: 2, C1: 1, D1: 1, E1: 1, E2: 0, F1: 1, F2: 0 }
      },
      {
        id: '17c',
        text: '활동적이고 에너지 넘치는 소품',
        weights: { A1: 0, A2: 1, B1: 1, C1: 1, D1: 3, E1: 2, E2: 1, F1: 3, F2: 2 }
      },
      {
        id: '17d',
        text: '독창적이고 예술적인 소품',
        weights: { A1: 1, A2: 0, B1: 0, C1: 2, D1: 1, E1: 3, E2: 3, F1: 2, F2: 3 }
      }
    ]
  },
  {
    id: 18,
    part: '사진',
    question: '사진의 전체적인 느낌으로 원하는 것은?',
    choices: [
      {
        id: '18a',
        text: '평온하고 안정된 느낌',
        weights: { A1: 3, A2: 2, B1: 3, C1: 2, D1: 0, E1: 1, E2: 1, F1: 0, F2: 1 }
      },
      {
        id: '18b',
        text: '따뜻하고 감성적인 느낌',
        weights: { A1: 1, A2: 3, B1: 3, C1: 1, D1: 1, E1: 2, E2: 1, F1: 1, F2: 1 }
      },
      {
        id: '18c',
        text: '활기차고 생동감 있는 느낌',
        weights: { A1: 0, A2: 1, B1: 1, C1: 1, D1: 3, E1: 2, E2: 2, F1: 3, F2: 2 }
      },
      {
        id: '18d',
        text: '신비롭고 예술적인 느낌',
        weights: { A1: 2, A2: 0, B1: 0, C1: 2, D1: 0, E1: 3, E2: 3, F1: 1, F2: 3 }
      }
    ]
  },
  {
    id: 19,
    part: '사진',
    question: '사진을 통해 표현하고 싶은 스토리는?',
    choices: [
      {
        id: '19a',
        text: '조용한 일상의 소중한 순간들',
        weights: { A1: 3, A2: 2, B1: 3, C1: 2, D1: 0, E1: 1, E2: 1, F1: 1, F2: 1 }
      },
      {
        id: '19b',
        text: '사람과의 따뜻한 관계와 소통',
        weights: { A1: 1, A2: 3, B1: 2, C1: 1, D1: 2, E1: 1, E2: 0, F1: 2, F2: 0 }
      },
      {
        id: '19c',
        text: '역동적인 도전과 성취의 이야기',
        weights: { A1: 0, A2: 1, B1: 1, C1: 1, D1: 3, E1: 2, E2: 2, F1: 3, F2: 2 }
      },
      {
        id: '19d',
        text: '독특한 개성과 창의적 표현',
        weights: { A1: 2, A2: 0, B1: 0, C1: 2, D1: 1, E1: 3, E2: 3, F1: 2, F2: 3 }
      }
    ]
  },
  {
    id: 20,
    part: '사진',
    question: '사진을 보는 사람들에게 전달하고 싶은 메시지는?',
    choices: [
      {
        id: '20a',
        text: '고요함과 내면의 평화',
        weights: { A1: 3, A2: 1, B1: 2, C1: 2, D1: 0, E1: 1, E2: 2, F1: 0, F2: 1 }
      },
      {
        id: '20b',
        text: '따뜻함과 인간적인 감동',
        weights: { A1: 1, A2: 3, B1: 3, C1: 1, D1: 2, E1: 2, E2: 1, F1: 2, F2: 1 }
      },
      {
        id: '20c',
        text: '열정과 긍정적인 에너지',
        weights: { A1: 0, A2: 2, B1: 1, C1: 1, D1: 3, E1: 2, E2: 1, F1: 3, F2: 2 }
      },
      {
        id: '20d',
        text: '독창성과 예술적 영감',
        weights: { A1: 2, A2: 0, B1: 0, C1: 2, D1: 0, E1: 3, E2: 3, F1: 2, F2: 3 }
      }
    ]
  },
  {
    id: 21,
    part: '사진',
    question: '최종적으로, 당신이 원하는 사진의 완성도는?',
    choices: [
      {
        id: '21a',
        text: '자연스럽고 진정성 있는 완성도',
        weights: { A1: 2, A2: 3, B1: 3, C1: 1, D1: 1, E1: 1, E2: 1, F1: 2, F2: 1 }
      },
      {
        id: '21b',
        text: '세련되고 완벽한 완성도',
        weights: { A1: 2, A2: 1, B1: 1, C1: 3, D1: 2, E1: 2, E2: 2, F1: 1, F2: 2 }
      },
      {
        id: '21c',
        text: '생동감 넘치고 임팩트 있는 완성도',
        weights: { A1: 0, A2: 1, B1: 1, C1: 1, D1: 3, E1: 2, E2: 2, F1: 3, F2: 2 }
      },
      {
        id: '21d',
        text: '독창적이고 예술적인 완성도',
        weights: { A1: 1, A2: 0, B1: 0, C1: 2, D1: 1, E1: 3, E2: 3, F1: 2, F2: 3 }
      }
    ]
  }
];

// 결과 계산 함수
export function calculatePersonalityType(answers: Record<number, string>): PersonalityType {
  const scores: Record<PersonalityType, number> = {
    A1: 0, A2: 0, B1: 0, C1: 0, D1: 0, E1: 0, E2: 0, F1: 0, F2: 0
  };

  // 각 답변에 대해 가중치 합산
  Object.entries(answers).forEach(([questionId, choiceId]) => {
    const question = quizQuestions.find(q => q.id === parseInt(questionId));
    const choice = question?.choices.find(c => c.id === choiceId);
    
    if (choice) {
      Object.entries(choice.weights).forEach(([type, weight]) => {
        scores[type as PersonalityType] += weight;
      });
    }
  });

  // 가장 높은 점수의 성격유형 반환
  return Object.entries(scores).reduce((a, b) => 
    scores[a[0] as PersonalityType] > scores[b[0] as PersonalityType] ? a : b
  )[0] as PersonalityType;
}

// 각 성격유형별 최종 점수 반환
export function calculateAllScores(answers: Record<number, string>): Record<PersonalityType, number> {
  const scores: Record<PersonalityType, number> = {
    A1: 0, A2: 0, B1: 0, C1: 0, D1: 0, E1: 0, E2: 0, F1: 0, F2: 0
  };

  Object.entries(answers).forEach(([questionId, choiceId]) => {
    const question = quizQuestions.find(q => q.id === parseInt(questionId));
    const choice = question?.choices.find(c => c.id === choiceId);
    
    if (choice) {
      Object.entries(choice.weights).forEach(([type, weight]) => {
        scores[type as PersonalityType] += weight;
      });
    }
  });

  return scores;
}
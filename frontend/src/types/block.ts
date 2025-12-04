export interface Block {
  id: string;
  title: string;
  description: string;
  level: number; // 0이 가장 아래 (기반), 숫자가 클수록 위 (목표)
  order: number; // 같은 레벨 내 순서
  category?: string; // 카테고리
  dependencies?: string[]; // 의존성 블록 ID 목록
}

export interface BlockCreate {
  title: string;
  description: string;
  level: number;
  order: number;
  category?: string;
}


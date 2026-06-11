export type GradeLevel = 6 | 7 | 8 | 9;

export interface GameModule {
  id: string;
  title: string;
  description: string;
  grade: GradeLevel;
  icon: string; // Icon name
}

export interface Fraction {
  numerator: number;
  denominator: number;
}

export enum GameMode {
  EQUALITY = 'equality', // So sánh/Đẳng thức
  ADDITION = 'addition', // Cộng phân số
}

export interface TeacherMessage {
  text: string;
  type: 'intro' | 'success' | 'error' | 'hint' | 'ai';
}
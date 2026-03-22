export type PointsCategory = 'course_completion' | 'participation' | 'daily_login' | 'other';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  type: 'course_completion' | 'participation' | 'milestone' | 'streak' | 'other';
  criteria: {
    type: string;
    target: number;
  };
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface UserPoints {
  total: number;
  byCategory: {
    courseCompletion: number;
    participation: number;
    dailyLogin: number;
    other: number;
  };
  level: number;
  nextLevelPoints: number;
  currentLevelPoints: number;
}

export interface AwardPointsResponse extends UserPoints {
  awarded: number;
  category: PointsCategory;
  reason: string;
  message: string;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  userName: string;
  completionDate: Date;
  certificateUrl: string;
  verificationCode: string;
  issuedBy: string;
  expiresAt?: Date;
}

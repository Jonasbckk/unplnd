export interface PlannerAnswers {
  mood?: string;
  group?: string;
  budget?: string;
  transport?: string;
  time?: string;
  preferences: string[];
  /** Free-text request — when set, the AI plans from the user's own words instead of the chips. */
  request?: string;
}

export interface PlanStop {
  time: string;
  category: string;
  title: string;
  reason: string;
  memoryMoment?: boolean;
  // Real-place fields (present when Google Places powered the plan; 19_ROUTE).
  placeId?: string;
  rating?: number;
  ratingCount?: number;
  priceLevel?: string;
  openNow?: boolean;
  hours?: string;
  address?: string;
  lat?: number;
  lng?: number;
  photoUrl?: string;
  /** Unresolved Google photo names — resolved on demand when the gallery opens. */
  photoNames?: string[];
}

export interface GeneratedPlan {
  title: string;
  summary: string;
  stops: PlanStop[];
  estimatedCost: string;
  duration: string;
  score: number;
}

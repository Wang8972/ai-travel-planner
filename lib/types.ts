export type TripPreference = {
  interests: string[];
  pace?: '轻松' | '适中' | '紧凑';
};

export type TripInput = {
  destination: string;
  days: number;
  budgetCNY?: number;
  people?: number;
  preferences?: TripPreference;
  startDate?: string; // YYYY-MM-DD
};

export type TransitSegment = {
  mode: '高铁' | '火车' | '地铁' | '公交' | '步行' | '出租车' | '轮渡' | '其他';
  lineName?: string;
  durationMinutes?: number;
  distanceKm?: number;
  costCNY?: number;
  from?: string;
  to?: string;
  departureTime?: string;
  arrivalTime?: string;
  tips?: string;
};

export type TransitPlan = {
  summary: string;
  totalDurationMinutes?: number;
  totalCostCNY?: number;
  segments: TransitSegment[];
};

export type LocationPoint = {
  name: string;
  lat: number;
  lng: number;
  address?: string;
};

export type ItineraryItem = {
  day: number;
  title: string;
  description?: string;
  location: LocationPoint;
  time?: string;
  highlights?: string[];
  transit?: TransitPlan;
};

export type HotelRecommendation = {
  name: string;
  rankLabel: string;
  rating: number;
  pricePerNight: number;
  address: string;
  lat: number;
  lng: number;
  tags?: string[];
};

export type RestaurantRecommendation = {
  name: string;
  address?: string;
  cuisine?: string;
  lat?: number;
  lng?: number;
  pricePerPerson?: number;
};

export type TripPlan = {
  id: string;
  createdAt: number;
  input: TripInput;
  itinerary: ItineraryItem[];
  hotels?: HotelRecommendation[];
  restaurants?: RestaurantRecommendation[];
  transport?: string[];
  notes?: string;
  budgetEstimate?: BudgetEstimate;
};

export type Expense = {
  id: string;
  tripId: string;
  createdAt: number;
  category: string; // 交通/住宿/餐饮/门票/购物/其他
  amount: number;
  note?: string;
};

export type BudgetEstimate = {
  total: number;
  breakdown: { category: string; amount: number }[];
  tips?: string[];
};


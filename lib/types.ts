export type TripPreference = {
  interests: string[]; // e.g., ["美食", "亲子", "动漫"]
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

export type ItineraryItem = {
  day: number;
  title: string;
  description?: string;
  location?: { name: string; lat?: number; lng?: number; address?: string };
  time?: string; // HH:mm
};

export type TripPlan = {
  id: string;
  createdAt: number;
  input: TripInput;
  itinerary: ItineraryItem[];
  hotels?: { name: string; address?: string; pricePerNight?: number }[];
  restaurants?: { name: string; address?: string; cuisine?: string }[];
  transport?: string[];
  notes?: string;
  budgetEstimate?: BudgetEstimate;
};

export type Expense = {
  id: string;
  tripId: string;
  createdAt: number;
  category: string; // 交通/住宿/餐饮/门票/购物/其他
  amount: number; // CNY
  note?: string;
};

export type BudgetEstimate = {
  total: number;
  breakdown: { category: string; amount: number }[];
  tips?: string[];
};


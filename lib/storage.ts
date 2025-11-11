import { createStore, get, set } from 'idb-keyval';
import type { TripPlan, Expense } from './types';

const store = createStore('ai-travel-planner', 'kv');

const K = {
  trips: 'trips',
  expenses: 'expenses',
};

export async function listTrips(): Promise<TripPlan[]> {
  return (await get(K.trips, store)) ?? [];
}

export async function saveTrip(plan: TripPlan): Promise<void> {
  const arr = (await get(K.trips, store)) as TripPlan[] | undefined;
  const next = arr ? arr.filter(t => t.id !== plan.id).concat(plan) : [plan];
  await set(K.trips, next, store);
}

export async function getTrip(id: string): Promise<TripPlan | undefined> {
  const arr = (await get(K.trips, store)) as TripPlan[] | undefined;
  return arr?.find(t => t.id === id);
}

export async function deleteTrip(id: string): Promise<void> {
  const arr = (await get(K.trips, store)) as TripPlan[] | undefined;
  const next = (arr ?? []).filter(t => t.id !== id);
  await set(K.trips, next, store);
}

export async function listExpenses(tripId?: string): Promise<Expense[]> {
  const all = ((await get(K.expenses, store)) as Expense[] | undefined) ?? [];
  return tripId ? all.filter(e => e.tripId === tripId) : all;
}

export async function addExpense(e: Expense): Promise<void> {
  const all = ((await get(K.expenses, store)) as Expense[] | undefined) ?? [];
  all.push(e);
  await set(K.expenses, all, store);
}

export async function deleteExpense(id: string): Promise<void> {
  const all = ((await get(K.expenses, store)) as Expense[] | undefined) ?? [];
  const next = all.filter(e => e.id !== id);
  await set(K.expenses, next, store);
}

export type Settings = {
  mapProvider?: 'amap' | 'baidu';
  mapApiKey?: string;
  llmBaseUrl?: string;
  llmApiKey?: string;
  llmModel?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  cloudSync?: boolean;
};

const SETTINGS_KEY = 'settings';

export async function getSettings(): Promise<Settings> {
  return ((await get(SETTINGS_KEY, store)) as Settings | undefined) ?? {};
}

export async function setSettings(s: Settings): Promise<void> {
  await set(SETTINGS_KEY, s, store);
}

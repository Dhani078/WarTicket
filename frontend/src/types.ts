export interface Tier {
  id: string;
  name: string;
  price: number;
  available_stock: number;
  is_sold_out: boolean;
}

export interface EventData {
  id: string;
  title: string;
  venue: string;
  event_date: string;
  tiers: Tier[];
}

export type StepType = 'tiers' | 'queue' | 'checkout' | 'success';

export type PaymentMethod = 'qris' | 'va' | 'cc';

export interface Attendee {
  name: string;
  email: string;
}

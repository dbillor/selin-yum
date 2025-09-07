
export type FeedMethod = 'breast' | 'bottle-breastmilk' | 'formula';
export type BreastSide = 'left' | 'right' | 'both' | 'na';

export interface Feeding {
  id?: number;
  datetime: string; // ISO
  method: FeedMethod;
  side?: BreastSide;
  durationMin?: number; // for breast
  amountMl?: number; // for bottle/formula
  notes?: string;
}

export type DiaperType = 'wet' | 'dirty' | 'mixed';

export interface Diaper {
  id?: number;
  datetime: string;
  type: DiaperType;
  color?: string;
  notes?: string;
}

export interface Sleep {
  id?: number;
  start: string;
  end?: string;
  notes?: string;
}

export interface Growth {
  id?: number;
  datetime: string;
  weightGrams?: number;
  lengthCm?: number;
  headCm?: number;
  notes?: string;
}

export interface Med {
  id?: number;
  datetime: string;
  name: string; // e.g., 'Vitamin D'
  dose: string; // e.g., '400 IU'
  notes?: string;
}

export interface BabyProfile {
  id?: number;
  name: string;
  birthIso: string; // precise birth date time
  timezone?: string;
}

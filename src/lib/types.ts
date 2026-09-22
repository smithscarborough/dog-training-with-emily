export type DogStatus = "pending" | "active" | "paused" | "archived";
export type SessionStatus = "requested" | "confirmed" | "completed" | "cancelled";

export type StudioRow = {
  id: number;
  owner_user_id: string | null;
  name: string;
  email: string;
  phone: string;
  instagram: string;
  facebook: string;
  x_url: string;
};

export type DogRow = {
  id: number;
  owner_user_id: string | null;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  address: string;
  name: string;
  breed: string;
  age_text: string;
  weight_text: string;
  allergies: string;
  sex: string;
  spayed_neutered: string;
  goals_json: string;
  goals_other: string;
  dislikes: string;
  past_experiences: string;
  physical_limitations: string;
  household: string;
  other_pets: string;
  kids_in_home: string;
  vet_info: string;
  preferred_days: string;
  referral_source: string;
  photo_url: string | null;
  status: DogStatus;
  credits: number;
  trainer_private_notes: string;
  created_at: string;
  updated_at: string;
};

export type SessionRow = {
  id: number;
  dog_id: number;
  owner_user_id: string | null;
  session_type: string;
  scheduled_at: string;
  duration_min: number;
  status: SessionStatus;
  location: string;
  owner_notes: string;
  recap: string;
  homework: string;
  trainer_private_notes: string;
  created_at: string;
  updated_at: string;
  dog_name?: string;
  owner_name?: string;
};

export type ProgressRow = {
  id: number;
  dog_id: number;
  skill_key: string;
  rating: number;
  comment: string;
  updated_by: string | null;
  updated_at: string;
};

export type ProgressLogRow = {
  id: number;
  dog_id: number;
  session_id: number | null;
  skill_key: string;
  rating: number;
  comment: string;
  created_by: string | null;
  created_at: string;
};

export type InquiryRow = {
  id: number;
  user_id: string | null;
  name: string;
  dog_name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
};

export type CheckinStatus = "practiced" | "skipped" | "stuck";

export type CheckinRow = {
  id: number;
  dog_id: number;
  owner_user_id: string | null;
  status: CheckinStatus;
  note: string;
  created_at: string;
  updated_at: string;
  dog_name?: string;
  owner_name?: string;
};

export type MePayload = {
  userId: string;
  email: string | null;
  isTrainer: boolean;
  studioClaimed: boolean;
  studio: StudioRow;
  dogs: DogRow[];
};

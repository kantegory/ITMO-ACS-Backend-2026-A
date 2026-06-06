import { CandidateProfile } from "../entities/CandidateProfile";

export const toProfile = (p: CandidateProfile) => ({
  id: p.id,
  user_id: p.userId,
  city: p.city,
  phone: p.phone,
  about: p.about,
  updated_at: p.updatedAt,
});

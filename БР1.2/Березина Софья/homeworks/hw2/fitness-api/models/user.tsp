import "@typespec/http";
import "./common.tsp";

using TypeSpec.Http;

namespace FitnessApi {

  enum UserRole {
    user: "user",
    admin: "admin",
    trainer: "trainer",
  }

  enum Gender {
    male: "male",
    female: "female",
  }

  enum FitnessLevel {
    beginner: "beginner",
    intermediate: "intermediate",
    advanced: "advanced",
    professional: "professional",
  }

  enum ActivityLevel {
    sedentary: "sedentary",
    light: "light",
    moderate: "moderate",
    active: "active",
    very_active: "very_active",
  }

  model User {
    id: string;
    @format("email")
    email: string;
    role: UserRole;
    @format("date-time")
    created_at: string;
    @format("date-time")
    updated_at: string;
  }

  model UserProfile {
    id: string;
    user_id: string;
    full_name?: string;
    @format("date")
    birth_date?: string;
    gender?: Gender;
    fitness_level?: FitnessLevel;
    height_cm?: float32;
    weight_kg?: float32;
    activity_level?: ActivityLevel;
    avatar_url?: string;
  }

  model RegisterRequest {
    @format("email")
    email: string;
    @minLength(6)
    password: string;
    full_name: string;
  }

  model LoginRequest {
    @format("email")
    email: string;
    password: string;
  }

  model AuthResponse {
    user: User;
    access_token: string;
    refresh_token: string;
  }

  model RefreshRequest {
    refresh_token: string;
  }

  model UpdateProfileRequest {
    full_name?: string;
    @format("date")
    birth_date?: string;
    gender?: Gender;
    fitness_level?: FitnessLevel;
    height_cm?: float32;
    weight_kg?: float32;
    activity_level?: ActivityLevel;
    avatar_url?: string;
  }

  model ChangePasswordRequest {
    current_password: string;
    @minLength(6)
    new_password: string;
  }
}
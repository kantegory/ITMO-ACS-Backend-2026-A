import "@typespec/http";
import "./common.tsp";

using TypeSpec.Http;

namespace FitnessApi {

  model UserProgress {
    id: string;
    user_id: string;
    @format("date")
    date: string;
    height_cm?: float32;
    weight_kg: float32;
    muscle_mass_kg?: float32;
  }

  model CreateProgressRequest {
    @format("date")
    date: string;
    height_cm?: float32;
    weight_kg: float32;
    muscle_mass_kg?: float32;
  }

  model ProgressStats {
    weight_change: float32;
    muscle_change: float32;
    start_date: string;
    end_date: string;
    measurements: {
      date: string;
      weight_kg: float32;
      muscle_mass_kg?: float32;
    }[];
  }
}
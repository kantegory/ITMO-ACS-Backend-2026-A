import "@typespec/http";

namespace FitnessApi {

  model ErrorResponse {
    error: string;
    message: string;
    status_code: int32;
  }

  model Timestamps {
    @format("date-time")
    created_at: string;

    @format("date-time")
    updated_at: string;
  }

  model ResourceId {
    id: string;
  }
}
import "./common.tsp";

namespace RestaurantBookingApi;

model UserProfile {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

model UserProfileResponse {
  data: UserProfile;
}

model UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  currentPassword?: string;
  password?: string;
}

model ReviewAuthor {
  id: string;
  firstName: string;
  lastName: string;
}

model ReservationUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

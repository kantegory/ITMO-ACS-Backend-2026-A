import "@typespec/http";
using TypeSpec.Http;

namespace RentalService {

model Error {
  code: string;
  message: string;
}

model User {
  id: int32;
  name: string;
  email: string;
  phone: string;
  another_contact: string;
  created_at: utcDateTime;
}

model Property {
  id: int32;
  title: string;
  description: string;
  price_per_month: float64;
  square: float32;
  type: string;
  owner_id: int32;
}

model Location {
  address: string;
  city: string;
  country: string;
  metro_station?: string;
  latitude: float64;
  longitude: float64;
}

model Booking {
  id: int32;
  property_id: int32;
  tenant_id: int32;
  start_date: plainDate;
  end_date: plainDate;
  status: string;
  details: string;
}

model BookingRequest {
  id: int32;
  property_id: int32;
  tenant_id: int32;
  creation_time: utcDateTime;
  comments: string;
}

model Payment {
  id: int32;
  booking_id: int32;
  amount: float64;
  status: string;
}

model Message {
  id: int32;
  sender_id: int32;
  content: string;
  sent_at: utcDateTime;
}

model Conversation {
  id: int32;
  user1_id: int32;
  user2_id: int32;
}

model Review {
  id: int32;
  user_id: int32;
  property_id: int32;
  rating: int32;
  comment: string;
}


model BadRequest {
  @statusCode status: 400;
  body: Error;
}

model Unauthorized {
  @statusCode status: 401;
  body: Error;
}

model Forbidden {
  @statusCode status: 403;
  body: Error;
}

model NotFound {
  @statusCode status: 404;
  body: Error;
}

}
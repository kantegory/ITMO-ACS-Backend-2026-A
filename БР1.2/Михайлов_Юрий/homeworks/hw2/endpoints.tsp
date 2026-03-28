import "@typespec/http";
using TypeSpec.Http;

namespace RentalService {

// auth

@tag("Auth")
@route("/auth")
interface AuthApi {

  @post
  op register(
    @body body: {
      name: string;
      email: string;
      password: string;
      phone: string;
      another_contact: string;
    }
  ): { id: int32; email: string } | BadRequest;

  @post
  @route("/login")
  op login(
    @body body: {
      email: string;
      password: string;
    }
  ): { token: string } | Unauthorized;
}


// users

@tag("Users")
@route("/users")
interface UsersApi {

  @get
  @route("/me")
  op getMe(): User | Unauthorized;

  @patch
  @route("/me")
  op updateMe(
    @body body: {
      name?: string;
      phone?: string;
      another_contact?: string;
    }
  ): { success: boolean } | Unauthorized | BadRequest;
}

// properties

@tag("Properties")
@route("/properties")
interface PropertiesApi {

  @get
  op list(
    @query city?: string,
    @query minPrice?: float64,
    @query maxPrice?: float64,
    @query type?: string
  ): {
    id: int32;
    title: string;
    price_per_month: float64;
    type: string;
    city: string;
  }[];

  @get
  @route("/{id}")
  op get(@path id: int32): {
    id: int32;
    title: string;
    description: string;
    price_per_month: float64;
    square: float32;
    type: string;
    owner_id: int32;
    location: Location;
    images: { url: string }[];
  } | NotFound;

  @post
  op create(
    @body body: {
      title: string;
      description: string;
      price_per_month: float64;
      square: float32;
      type: string;
      location: Location;
    }
  ): { id: int32 } | Unauthorized | BadRequest;

  @put
  @route("/{id}")
  op update(
    @path id: int32,
    @body body: {
      title: string;
      description: string;
      price_per_month: float64;
      square: float32;
      type: string;
    }
  ): { success: boolean } | Unauthorized | Forbidden | NotFound;

  @delete
  @route("/{id}")
  op delete(@path id: int32): { success: boolean } | Unauthorized | Forbidden | NotFound;

  @get
  @route("/{id}/reviews")
  op getReviews(@path id: int32): Review[] | NotFound;
}


// booking

@tag("booking")
@route("/booking-requests")
interface BookingRequestApi {

  @post
  op create(
    @body body: {
      property_id: int32;
      comments: string;
    }
  ): { id: int32 } | Unauthorized | NotFound;

  @get
  @route("/my")
  op my(): BookingRequest[] | Unauthorized;

  @get
  @route("/property/{id}")
  op byProperty(@path id: int32): BookingRequest[] | Unauthorized | NotFound;
}

@tag("booking")
@route("/bookings")
interface BookingApi {

  @post
  op create(
    @body body: {
      property_id: int32;
      tenant_id: int32;
      start_date: plainDate;
      end_date: plainDate;
      details: string;
    }
  ): { id: int32 } | Unauthorized | Forbidden | BadRequest;

  @get
  @route("/my")
  op my(): Booking[] | Unauthorized;

  @get
  @route("/{id}")
  op get(@path id: int32): Booking | Unauthorized | Forbidden | NotFound;
}


// messaging

@tag("messages")
@route("/conversations")
interface ConversationApi {

  @get
  op list(): Conversation[] | Unauthorized;

  @get
  @route("/{id}/messages")
  op messages(@path id: int32): Message[] | Unauthorized | Forbidden;
}

@tag("messages")
@route("/messages")
interface MessageApi {

  @post
  op send(
    @body body: {
      conversation_id: int32;
      content: string;
    }
  ): { id: int32 } | Unauthorized | Forbidden;
}


// payments

@tag("payments")
@route("/payments")
interface PaymentsApi {

  @post
  op create(
    @body body: {
      booking_id: int32;
      amount: float64;
    }
  ): { id: int32 } | Unauthorized | NotFound;

  @get
  @route("/my")
  op my(): Payment[] | Unauthorized;
}

// reviews

@tag("reviews")
@route("/reviews")
interface ReviewsApi {

  @post
  op create(
    @body body: {
      property_id: int32;
      rating: int32;
      comment: string;
    }
  ): { id: int32 } | Unauthorized | NotFound;
}

}
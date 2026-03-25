import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;

@service
@server("http://localhost:8080/api/v1", "Local")
namespace RentalService {

  alias Id = int64;

  model NoContent {}

  enum RentMode { DAILY, MONTHLY }
  enum HouseType { STUDIO, ONE_ROOM, TWO_ROOM, FOUR_ROOM, FIVE_ROOM, SIX_ROOM }
  enum BookingStatus { PENDING, ACCEPTED, CANCELED, COMPLETED }
  enum RentStatus { NEW, IN_PROGRESS, CLOSED }
  enum CommunicationMethod { CHAT, CALL }


  model ErrorResponse {
    code: string;
    message: string;
    details?: Record<unknown>;
  }

  model FieldError {
    field: string;
    message: string;
  }

  model MethodArgumentNotValidException {
    code: "VALIDATION_ERROR";
    message: string;
    fieldErrors: FieldError[];
  }

  @error model UnauthorizedException extends ErrorResponse {}
  @error model ForbiddenException extends ErrorResponse {}
  @error model NotFoundException extends ErrorResponse {}
  @error model ConflictException extends ErrorResponse {}
  @error model BusinessException extends ErrorResponse {}

  model ValidationErrorResult {
    @statusCode status: 422;
    @body body: MethodArgumentNotValidException;
    }

    model UnauthorizedResult {
    @statusCode status: 401;
    @body body: UnauthorizedException;
    }

    model ForbiddenResult {
    @statusCode status: 403;
    @body body: ForbiddenException;
    }

    model NotFoundResult {
    @statusCode status: 404;
    @body body: NotFoundException;
    }

    model ConflictResult {
    @statusCode status: 409;
    @body body: ConflictException;
    }

  model SortOrder {
    property: string;
    direction: "ASC" | "DESC";
    ignoreCase?: boolean;
    nullHandling?: "NATIVE" | "NULLS_FIRST" | "NULLS_LAST";
  }

  model SortInfo {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  }

  model PageableInfo {
    pageNumber: int32;
    pageSize: int32;
    offset: int64;
    paged: boolean;
    unpaged: boolean;
    sort: SortInfo;
  }

  model Page<T> {
    content: T[];
    pageable: PageableInfo;

    totalElements: int64;
    totalPages: int32;

    last: boolean;
    first: boolean;
    number: int32;     // current page index
    size: int32;       // size requested
    numberOfElements: int32;
    empty: boolean;

    sort: SortInfo;
  }

  model PageRequestParams {
    @query page?: int32;
    @query size?: int32;
    @query sort?: string[];
  }

  namespace Auth {
    model RegisterRequest {
      @format("email")
      email: string;
      @minLength(3)
      @maxLength(50)
      username: string;
      @pattern("^[+]?[0-9]+$")
      phone: string;
      @minLength(6)
      password: string;
    }

    model RegisterResponse {
      id: Id;
      email: string;
      username: string;
      phone: string;
      verified: boolean;
      createdAt: utcDateTime;
    }

    model LoginRequest {
      @minLength(1)
      @format("email")
      email: string;
      @minLength(6)
      password: string;
    }

    model TokensResponse {
      accessToken: string;
      refreshToken: string;
      tokenType: "Bearer";
      accessExpiresIn: string;
      refreshExpiresIn: string;
    }

    model RefreshRequest { refreshToken: string; }
    model LogoutRequest { refreshToken: string; }

    model EmailConfirmRequest { token: string; }

    // Authentication
    @tag("Authentication")
    namespace Authentication {

        @route("/auth/register")
        @post
        op register(@body request: RegisterRequest): {
        @statusCode status: 201;
        @body body: RegisterResponse;
        } | ValidationErrorResult | ConflictResult;

        @route("/auth/login")
        @post
        op login(@body request: LoginRequest): {
        @statusCode status: 200;
        @body body: TokensResponse;
        } | ValidationErrorResult | UnauthorizedResult;

        @useAuth(BearerAuth)
        @route("/auth/refresh")
        @post
        op refresh(@body request: RefreshRequest): {
        @statusCode status: 200;
        @body body: TokensResponse;
        } | ValidationErrorResult | UnauthorizedResult;

        @useAuth(BearerAuth)
        @route("/auth/logout")
        @post
        op logout(@body request: LogoutRequest): {
        @statusCode status: 204;
        } | ValidationErrorResult | UnauthorizedResult;

        @useAuth(BearerAuth)
        @route("/users/email/confirm")
        @post
        op confirmEmail(@body request: EmailConfirmRequest): {
        @statusCode status: 204;
        } | ValidationErrorResult | NotFoundResult | ConflictResult | UnauthorizedResult;
    }
  }

  // Users

  @tag("Users")
  namespace Users {

    model UserMeResponse {
      id: Id;
      email: string;
      username: string;
      phone: string;
      verified: boolean;
      createdAt: utcDateTime;
    }

    model UpdateMeRequest {
      @minLength(3)
      @maxLength(50)
      username?: string;
      @format("email")
      email?: string;
      @pattern("^[+]?[0-9]+$")
      phone?: string;
      @minLength(6)
      password?: string;
    }

    model UserProfileResponse {
      id: Id;
      username: string;
      phone: string;
      verified: boolean;
      createdAt: utcDateTime;
      ownedListings: RentalService.Listings.ListingResponse[];  // Вся недвижимость пользователя
      guestBookingHistory: RentalService.Bookings.BookingResponse[];  // История бронирований как гость
      guestRentHistory: RentalService.Rents.RentResponse[];  // История аренды как гость
      ownerBookingHistory: RentalService.Bookings.BookingResponse[];  // История бронирований как владелец
      ownerRentHistory: RentalService.Rents.RentResponse[];  // История аренды как владелец
    }

    @useAuth(BearerAuth)
    @route("/users/me")
    @get
    op getMe(): {
      @statusCode status: 200;
      @body body: UserMeResponse;
    } | UnauthorizedException;

    @useAuth(BearerAuth)
    @route("/users/me")
    @patch
    op updateMe(@body request: UpdateMeRequest): {
      @statusCode status: 200;
      @body body: UserMeResponse;
    } | MethodArgumentNotValidException | UnauthorizedException | ConflictException;

    @useAuth(BearerAuth)
    @route("/users/me/email/verify")
    @post
    op resendVerifyEmail(): {
      @statusCode status: 204;
    } | UnauthorizedException;

    @useAuth(BearerAuth)
    @route("/users/me/profile")
    @get
    op getProfile(): {
      @statusCode status: 200;
      @body body: UserProfileResponse;
    } | UnauthorizedException | NotFoundException;
  }

  // Listings

  @tag("Listings")
  namespace Listings {
    model CreateListingRequest {
      rentMode: RentMode;
      @minLength(3)
      @maxLength(100)
      title: string;
      description?: string;
      @minLength(5)
      address: string;
      latitude?: float64;
      longitude?: float64;
      houseType: HouseType;
    }

    model UpdateListingRequest {
      @minLength(3)
      @maxLength(100)
      title?: string;
      description?: string;
      @minLength(5)
      address?: string;
      latitude?: float64;
      longitude?: float64;
      houseType?: HouseType;
      isActive?: boolean;
    }

    model ListingResponse {
      id: Id;
      ownerId: Id;
      rentMode: RentMode;
      title: string;
      description: string;
      address: string;
      lat: float64;
      lng: float64;
      houseType: HouseType;
      isActive: boolean;
      createdAt: utcDateTime;
    }

    model ListingDaily {
      listingId: Id;
      pricePerNight: float64;
      minNights: int32;
      maxNights?: int32;
      checkInTime?: string;
      checkOutTime?: string;
    }

    model ListingMonthly {
      listingId: Id;
      pricePerMonth: float64;
      deposit: float64;
      communalPayments: boolean;
      minMonth?: int32;
    }

    model Photo {
      id: Id;
      listingId: Id;
      url: string;
      uploadedAt: utcDateTime;
      isMain: boolean;
    }

    model ListingDetailsResponse {
      listing: ListingResponse;
      daily?: ListingDaily;
      monthly?: ListingMonthly;
      photos: Photo[];
    }

    @useAuth(BearerAuth)
    @route("/listings")
    @post
    op create(@body request: CreateListingRequest): {
      @statusCode status: 201;
      @body body: ListingResponse;
    } | MethodArgumentNotValidException | UnauthorizedException;

    @route("/listings")
    @get
    op search(
      @query rentMode?: RentMode,
      @query houseType?: HouseType,
      @query priceMin?: float64,
      @query priceMax?: float64,
      @query lat?: float64,
      @query lng?: float64,
      @query radiusKm?: float64,
      @query startDate?: plainDate,
      @query endDate?: plainDate,
      ...PageRequestParams
    ): {
      @statusCode status: 200;
      @body body: Page<ListingResponse>;
    } | MethodArgumentNotValidException;

    @route("/listings/{listingId}")
    @get
    op get(@path listingId: Id): {
      @statusCode status: 200;
      @body body: ListingDetailsResponse;
    } | NotFoundException;

    @useAuth(BearerAuth)
    @route("/listings/{listingId}")
    @patch
    op update(@path listingId: Id, @body request: UpdateListingRequest): {
      @statusCode status: 200;
      @body body: ListingResponse;
    } | MethodArgumentNotValidException | UnauthorizedException | ForbiddenException | NotFoundException | ConflictException;

    @useAuth(BearerAuth)
    @route("/listings/{listingId}/deactivate")
    @post
    op deactivate(@path listingId: Id): {
      @statusCode status: 204;
    } | UnauthorizedException | ForbiddenException | NotFoundException;

    @useAuth(BearerAuth)
    @route("/listings/{listingId}/activate")
    @post
    op activate(@path listingId: Id): {
      @statusCode status: 204;
    } | UnauthorizedException | ForbiddenException | NotFoundException;

    // Photos
    model AddPhotoRequest { url: string; isMain?: boolean; }
    model UpdatePhotoRequest { isMain?: boolean; }

    @useAuth(BearerAuth)
    @route("/listings/{listingId}/photos")
    @post
    op addPhoto(@path listingId: Id, @body request: AddPhotoRequest): {
      @statusCode status: 201;
      @body body: Photo;
    } | MethodArgumentNotValidException | UnauthorizedException | ForbiddenException | NotFoundException;

    @route("/listings/{listingId}/photos")
    @get
    op listPhotos(@path listingId: Id): {
      @statusCode status: 200;
      @body body: Photo[];
    } | NotFoundException;

    @useAuth(BearerAuth)
    @route("/listings/{listingId}/photos/{photoId}")
    @patch
    op updatePhoto(@path listingId: Id, @path photoId: Id, @body request: UpdatePhotoRequest): {
      @statusCode status: 200;
      @body body: Photo;
    } | MethodArgumentNotValidException | UnauthorizedException | ForbiddenException | NotFoundException | ConflictException;

    @useAuth(BearerAuth)
    @route("/listings/{listingId}/photos/{photoId}")
    @delete
    op deletePhoto(@path listingId: Id, @path photoId: Id): {
      @statusCode status: 204;
    } | UnauthorizedException | ForbiddenException | NotFoundException;
  }

  // Bookings

  @tag("Bookings")
  namespace Bookings {
    model CreateBookingRequest {
      listingId: Id;
      startDate: plainDate;
      endDate: plainDate;
    }

    model BookingResponse {
      id: Id;
      listingId: Id;
      guestId: Id;
      status: BookingStatus;
      startDate: plainDate;
      endDate: plainDate;
      pricePerNightSnapshot: float64;
      totalAmount: float64;
      createdAt: utcDateTime;
    }

    @useAuth(BearerAuth)
    @route("/bookings")
    @post
    op create(@body request: CreateBookingRequest): {
      @statusCode status: 201;
      @body body: BookingResponse;
    } | MethodArgumentNotValidException | UnauthorizedException | ConflictException | BusinessException;

    @useAuth(BearerAuth)
    @route("/bookings")
    @get
    op list(
      @query status?: BookingStatus,
      ...PageRequestParams
    ): {
      @statusCode status: 200;
      @body body: Page<BookingResponse>;
    } | UnauthorizedException;

    @useAuth(BearerAuth)
    @route("/bookings/{bookingId}")
    @get
    op get(@path bookingId: Id): {
      @statusCode status: 200;
      @body body: BookingResponse;
    } | UnauthorizedException | ForbiddenException | NotFoundException;

    @useAuth(BearerAuth)
    @route("/bookings/{bookingId}/cancel")
    @post
    op cancel(@path bookingId: Id): {
      @statusCode status: 200;
      @body body: BookingResponse;
    } | UnauthorizedException | ForbiddenException | NotFoundException | ConflictException;

    @useAuth(BearerAuth)
    @route("/bookings/{bookingId}/complete")
    @post
    op complete(@path bookingId: Id): {
      @statusCode status: 200;
      @body body: BookingResponse;
    } | UnauthorizedException | ForbiddenException | NotFoundException | ConflictException;
  }

  // Rents (MONTHLY)

  @tag("Rents")
  namespace Rents {
    model CreateRentRequest {
      listingId: Id;
      communicationMethod: CommunicationMethod;
    }

    model UpdateRentRequest {
      status?: RentStatus;
      communicationMethod?: CommunicationMethod;
    }

    model RentResponse {
      id: Id;
      listingId: Id;
      guestId: Id;
      communicationMethod: CommunicationMethod;
      status: RentStatus;
      createdAt: utcDateTime;
    }

    @useAuth(BearerAuth)
    @route("/rents")
    @post
    op create(@body request: CreateRentRequest): {
      @statusCode status: 201;
      @body body: RentResponse;
    } | MethodArgumentNotValidException | UnauthorizedException | BusinessException;

    @useAuth(BearerAuth)
    @route("/rents")
    @get
    op list(
      @query status?: RentStatus,
      ...PageRequestParams
    ): {
      @statusCode status: 200;
      @body body: Page<RentResponse>;
    } | UnauthorizedException;

    @useAuth(BearerAuth)
    @route("/rents/{rentId}")
    @get
    op get(@path rentId: Id): {
      @statusCode status: 200;
      @body body: RentResponse;
    } | UnauthorizedException | ForbiddenException | NotFoundException;

    @useAuth(BearerAuth)
    @route("/rents/{rentId}")
    @patch
    op update(@path rentId: Id, @body request: UpdateRentRequest): {
      @statusCode status: 200;
      @body body: RentResponse;
    } | MethodArgumentNotValidException | UnauthorizedException | ForbiddenException | NotFoundException | ConflictException;

    @useAuth(BearerAuth)
    @route("/rents/{rentId}/close")
    @post
    op close(@path rentId: Id): {
      @statusCode status: 200;
      @body body: RentResponse;
    } | UnauthorizedException | ForbiddenException | NotFoundException | ConflictException;
  }

  // Chats + Messages

  @tag("Chats")
  namespace Chats {
    model CreateChatRequest {
      otherUserId: Id;
    }

    model ChatResponse {
      id: Id;
      user1Id: Id;
      user2Id: Id;
      createdAt: utcDateTime;
    }

    @useAuth(BearerAuth)
    @route("/chats")
    @post
    op create(@body request: CreateChatRequest): {
      @statusCode status: 201;
      @body body: ChatResponse;
    } | MethodArgumentNotValidException | UnauthorizedException | NotFoundException | ConflictException;

    @useAuth(BearerAuth)
    @route("/chats")
    @get
    op list(...PageRequestParams): {
      @statusCode status: 200;
      @body body: Page<ChatResponse>;
    } | UnauthorizedException;
  }

  @tag("Messages")
  namespace Messages {
    model SendMessageRequest { content: string; }

    model MessageResponse {
      id: Id;
      chatId: Id;
      senderId?: Id;
      content: string;
      createdAt: utcDateTime;
    }

    @useAuth(BearerAuth)
    @route("/chats/{chatId}/messages")
    @get
    op list(
      @path chatId: Id,
      ...PageRequestParams
    ): {
      @statusCode status: 200;
      @body body: Page<MessageResponse>;
    } | UnauthorizedException | ForbiddenException | NotFoundException;

    @useAuth(BearerAuth)
    @route("/chats/{chatId}/messages")
    @post
    op send(@path chatId: Id, @body request: SendMessageRequest): {
      @statusCode status: 201;
      @body body: MessageResponse;
    } | MethodArgumentNotValidException | UnauthorizedException | ForbiddenException | NotFoundException;
  }
}
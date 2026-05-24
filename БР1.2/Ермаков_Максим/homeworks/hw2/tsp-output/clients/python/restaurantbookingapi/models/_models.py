# pylint: disable=too-many-lines
# coding=utf-8
# pylint: disable=useless-super-delegation

from typing import Any, List, Literal, Mapping, Optional, TYPE_CHECKING, Union, overload

from .._utils.model_base import Model as _Model, rest_field

if TYPE_CHECKING:
    from .. import models as _models


class ActionSuccessResponse(_Model):
    """ActionSuccessResponse.

    :ivar message: Required.
    :vartype message: str
    """

    message: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        message: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class AuthPayload(_Model):
    """AuthPayload.

    :ivar user: Required.
    :vartype user: ~restaurantbookingapi.models.AuthUser
    :ivar tokens: Required.
    :vartype tokens: ~restaurantbookingapi.models.AuthTokenPayload
    """

    user: "_models.AuthUser" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    tokens: "_models.AuthTokenPayload" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        user: "_models.AuthUser",
        tokens: "_models.AuthTokenPayload",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class AuthTokenPayload(_Model):
    """AuthTokenPayload.

    :ivar access_token: Required.
    :vartype access_token: str
    :ivar refresh_token: Required.
    :vartype refresh_token: str
    :ivar token_type: Required. Default value is "Bearer".
    :vartype token_type: str
    :ivar expires_in: Required.
    :vartype expires_in: int
    """

    access_token: str = rest_field(name="accessToken", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    refresh_token: str = rest_field(name="refreshToken", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    token_type: Literal["Bearer"] = rest_field(
        name="tokenType", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required. Default value is \"Bearer\"."""
    expires_in: int = rest_field(name="expiresIn", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        access_token: str,
        refresh_token: str,
        expires_in: int,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.token_type: Literal["Bearer"] = "Bearer"


class AuthUser(_Model):
    """AuthUser.

    :ivar id: Required.
    :vartype id: str
    :ivar role: Required. Known values are: "ADMIN" and "USER".
    :vartype role: str or ~restaurantbookingapi.models.UserRole
    :ivar first_name: Required.
    :vartype first_name: str
    :ivar last_name: Required.
    :vartype last_name: str
    :ivar email: Required.
    :vartype email: str
    :ivar phone: Required.
    :vartype phone: str
    :ivar is_verified: Required.
    :vartype is_verified: bool
    :ivar created_at: Required.
    :vartype created_at: str
    :ivar updated_at: Required.
    :vartype updated_at: str
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    role: Union[str, "_models.UserRole"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required. Known values are: \"ADMIN\" and \"USER\"."""
    first_name: str = rest_field(name="firstName", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    last_name: str = rest_field(name="lastName", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    email: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    phone: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    is_verified: bool = rest_field(name="isVerified", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    created_at: str = rest_field(name="createdAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    updated_at: str = rest_field(name="updatedAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        role: Union[str, "_models.UserRole"],
        first_name: str,
        last_name: str,
        email: str,
        phone: str,
        is_verified: bool,
        created_at: str,
        updated_at: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class AvailableTable(_Model):
    """AvailableTable.

    :ivar id: Required.
    :vartype id: str
    :ivar table_number: Required.
    :vartype table_number: str
    :ivar capacity: Required.
    :vartype capacity: int
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    table_number: str = rest_field(name="tableNumber", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    capacity: int = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        table_number: str,
        capacity: int,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CancelReservationRequest(_Model):
    """CancelReservationRequest.

    :ivar reason:
    :vartype reason: str
    """

    reason: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        reason: Optional[str] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ConflictError(_Model):
    """ConflictError.

    :ivar code: Required. Default value is "CONFLICT".
    :vartype code: str
    :ivar message: Required.
    :vartype message: str
    """

    code: Literal["CONFLICT"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required. Default value is \"CONFLICT\"."""
    message: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        message: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.code: Literal["CONFLICT"] = "CONFLICT"


class CreateLocationRequest(_Model):
    """CreateLocationRequest.

    :ivar city: Required.
    :vartype city: str
    :ivar address: Required.
    :vartype address: str
    :ivar district:
    :vartype district: str
    :ivar metro_station:
    :vartype metro_station: str
    """

    city: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    address: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    district: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    metro_station: Optional[str] = rest_field(
        name="metroStation", visibility=["read", "create", "update", "delete", "query"]
    )

    @overload
    def __init__(
        self,
        *,
        city: str,
        address: str,
        district: Optional[str] = None,
        metro_station: Optional[str] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateLocationResponse(_Model):
    """CreateLocationResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.Location
    """

    data: "_models.Location" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.Location",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateMenuCategoryRequest(_Model):
    """CreateMenuCategoryRequest.

    :ivar title: Required.
    :vartype title: str
    """

    title: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        title: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateMenuCategoryResponse(_Model):
    """CreateMenuCategoryResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.MenuCategory
    """

    data: "_models.MenuCategory" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.MenuCategory",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateMenuItemRequest(_Model):
    """CreateMenuItemRequest.

    :ivar title: Required.
    :vartype title: str
    :ivar description:
    :vartype description: str
    :ivar price: Required.
    :vartype price: float
    :ivar weight:
    :vartype weight: str
    :ivar is_available:
    :vartype is_available: bool
    """

    title: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    description: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    price: float = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    weight: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    is_available: Optional[bool] = rest_field(
        name="isAvailable", visibility=["read", "create", "update", "delete", "query"]
    )

    @overload
    def __init__(
        self,
        *,
        title: str,
        price: float,
        description: Optional[str] = None,
        weight: Optional[str] = None,
        is_available: Optional[bool] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateMenuItemResponse(_Model):
    """CreateMenuItemResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.MenuItem
    """

    data: "_models.MenuItem" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.MenuItem",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateReservationRequest(_Model):
    """CreateReservationRequest.

    :ivar restaurant_id: Required.
    :vartype restaurant_id: str
    :ivar table_id: Required.
    :vartype table_id: str
    :ivar reservation_date: Required.
    :vartype reservation_date: str
    :ivar reservation_time: Required.
    :vartype reservation_time: str
    :ivar guests_count: Required.
    :vartype guests_count: int
    :ivar comment:
    :vartype comment: str
    """

    restaurant_id: str = rest_field(name="restaurantId", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    table_id: str = rest_field(name="tableId", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    reservation_date: str = rest_field(
        name="reservationDate", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required."""
    reservation_time: str = rest_field(
        name="reservationTime", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required."""
    guests_count: int = rest_field(name="guestsCount", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    comment: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        restaurant_id: str,
        table_id: str,
        reservation_date: str,
        reservation_time: str,
        guests_count: int,
        comment: Optional[str] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateReservationResponse(_Model):
    """CreateReservationResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.Reservation
    """

    data: "_models.Reservation" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.Reservation",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateRestaurantPhotoRequest(_Model):
    """CreateRestaurantPhotoRequest.

    :ivar image_url: Required.
    :vartype image_url: str
    :ivar is_main:
    :vartype is_main: bool
    """

    image_url: str = rest_field(name="imageUrl", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    is_main: Optional[bool] = rest_field(name="isMain", visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        image_url: str,
        is_main: Optional[bool] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateRestaurantPhotoResponse(_Model):
    """CreateRestaurantPhotoResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.RestaurantPhoto
    """

    data: "_models.RestaurantPhoto" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.RestaurantPhoto",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateRestaurantRequest(_Model):
    """CreateRestaurantRequest.

    :ivar location_id: Required.
    :vartype location_id: str
    :ivar price_category: Required. Known values are: "LOW", "MEDIUM", and "HIGH".
    :vartype price_category: str or ~restaurantbookingapi.models.PriceCategory
    :ivar title: Required.
    :vartype title: str
    :ivar description:
    :vartype description: str
    :ivar phone: Required.
    :vartype phone: str
    :ivar email:
    :vartype email: str
    :ivar open_time: Required.
    :vartype open_time: str
    :ivar close_time: Required.
    :vartype close_time: str
    :ivar cuisine_ids:
    :vartype cuisine_ids: list[str]
    :ivar is_published:
    :vartype is_published: bool
    """

    location_id: str = rest_field(name="locationId", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    price_category: Union[str, "_models.PriceCategory"] = rest_field(
        name="priceCategory", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required. Known values are: \"LOW\", \"MEDIUM\", and \"HIGH\"."""
    title: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    description: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    phone: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    email: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    open_time: str = rest_field(name="openTime", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    close_time: str = rest_field(name="closeTime", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    cuisine_ids: Optional[List[str]] = rest_field(
        name="cuisineIds", visibility=["read", "create", "update", "delete", "query"]
    )
    is_published: Optional[bool] = rest_field(
        name="isPublished", visibility=["read", "create", "update", "delete", "query"]
    )

    @overload
    def __init__(
        self,
        *,
        location_id: str,
        price_category: Union[str, "_models.PriceCategory"],
        title: str,
        phone: str,
        open_time: str,
        close_time: str,
        description: Optional[str] = None,
        email: Optional[str] = None,
        cuisine_ids: Optional[List[str]] = None,
        is_published: Optional[bool] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateRestaurantResponse(_Model):
    """CreateRestaurantResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.RestaurantDetail
    """

    data: "_models.RestaurantDetail" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.RestaurantDetail",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateRestaurantReviewRequest(_Model):
    """CreateRestaurantReviewRequest.

    :ivar rating: Required.
    :vartype rating: float
    :ivar comment: Required.
    :vartype comment: str
    """

    rating: float = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    comment: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        rating: float,
        comment: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateRestaurantReviewResponse(_Model):
    """CreateRestaurantReviewResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.RestaurantReview
    """

    data: "_models.RestaurantReview" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.RestaurantReview",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateRestaurantTableRequest(_Model):
    """CreateRestaurantTableRequest.

    :ivar table_number: Required.
    :vartype table_number: str
    :ivar capacity: Required.
    :vartype capacity: int
    :ivar is_active:
    :vartype is_active: bool
    """

    table_number: str = rest_field(name="tableNumber", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    capacity: int = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    is_active: Optional[bool] = rest_field(name="isActive", visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        table_number: str,
        capacity: int,
        is_active: Optional[bool] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CreateRestaurantTableResponse(_Model):
    """CreateRestaurantTableResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.RestaurantTable
    """

    data: "_models.RestaurantTable" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.RestaurantTable",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class Cuisine(_Model):
    """Cuisine.

    :ivar id: Required.
    :vartype id: str
    :ivar title: Required.
    :vartype title: str
    :ivar created_at: Required.
    :vartype created_at: str
    :ivar updated_at: Required.
    :vartype updated_at: str
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    title: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    created_at: str = rest_field(name="createdAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    updated_at: str = rest_field(name="updatedAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        title: str,
        created_at: str,
        updated_at: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class CuisineListResponse(_Model):
    """CuisineListResponse.

    :ivar data: Required.
    :vartype data: list[~restaurantbookingapi.models.Cuisine]
    """

    data: List["_models.Cuisine"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: List["_models.Cuisine"],
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ErrorDetail(_Model):
    """ErrorDetail.

    :ivar field:
    :vartype field: str
    :ivar issue: Required.
    :vartype issue: str
    """

    field: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    issue: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        issue: str,
        field: Optional[str] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ForbiddenError(_Model):
    """ForbiddenError.

    :ivar code: Required. Default value is "FORBIDDEN".
    :vartype code: str
    :ivar message: Required.
    :vartype message: str
    """

    code: Literal["FORBIDDEN"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required. Default value is \"FORBIDDEN\"."""
    message: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        message: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.code: Literal["FORBIDDEN"] = "FORBIDDEN"


class Location(_Model):
    """Location.

    :ivar id: Required.
    :vartype id: str
    :ivar city: Required.
    :vartype city: str
    :ivar address: Required.
    :vartype address: str
    :ivar district:
    :vartype district: str
    :ivar metro_station:
    :vartype metro_station: str
    :ivar created_at: Required.
    :vartype created_at: str
    :ivar updated_at: Required.
    :vartype updated_at: str
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    city: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    address: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    district: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    metro_station: Optional[str] = rest_field(
        name="metroStation", visibility=["read", "create", "update", "delete", "query"]
    )
    created_at: str = rest_field(name="createdAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    updated_at: str = rest_field(name="updatedAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        city: str,
        address: str,
        created_at: str,
        updated_at: str,
        district: Optional[str] = None,
        metro_station: Optional[str] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class LocationListResponse(_Model):
    """LocationListResponse.

    :ivar data: Required.
    :vartype data: list[~restaurantbookingapi.models.Location]
    """

    data: List["_models.Location"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: List["_models.Location"],
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class LocationResponse(_Model):
    """LocationResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.Location
    """

    data: "_models.Location" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.Location",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class LoginRequest(_Model):
    """LoginRequest.

    :ivar email: Required.
    :vartype email: str
    :ivar password: Required.
    :vartype password: str
    """

    email: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    password: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        email: str,
        password: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class LoginResponse(_Model):
    """LoginResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.AuthPayload
    """

    data: "_models.AuthPayload" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.AuthPayload",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class MenuCategory(_Model):
    """MenuCategory.

    :ivar id: Required.
    :vartype id: str
    :ivar restaurant_id: Required.
    :vartype restaurant_id: str
    :ivar title: Required.
    :vartype title: str
    :ivar items_property: Required.
    :vartype items_property: list[~restaurantbookingapi.models.MenuItem]
    :ivar created_at: Required.
    :vartype created_at: str
    :ivar updated_at: Required.
    :vartype updated_at: str
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    restaurant_id: str = rest_field(name="restaurantId", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    title: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    items_property: List["_models.MenuItem"] = rest_field(
        name="items", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required."""
    created_at: str = rest_field(name="createdAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    updated_at: str = rest_field(name="updatedAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        restaurant_id: str,
        title: str,
        items_property: List["_models.MenuItem"],
        created_at: str,
        updated_at: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class MenuCategoryResponse(_Model):
    """MenuCategoryResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.MenuCategory
    """

    data: "_models.MenuCategory" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.MenuCategory",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class MenuItem(_Model):
    """MenuItem.

    :ivar id: Required.
    :vartype id: str
    :ivar title: Required.
    :vartype title: str
    :ivar description:
    :vartype description: str
    :ivar price: Required.
    :vartype price: float
    :ivar weight:
    :vartype weight: str
    :ivar is_available: Required.
    :vartype is_available: bool
    :ivar created_at: Required.
    :vartype created_at: str
    :ivar updated_at: Required.
    :vartype updated_at: str
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    title: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    description: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    price: float = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    weight: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    is_available: bool = rest_field(name="isAvailable", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    created_at: str = rest_field(name="createdAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    updated_at: str = rest_field(name="updatedAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        title: str,
        price: float,
        is_available: bool,
        created_at: str,
        updated_at: str,
        description: Optional[str] = None,
        weight: Optional[str] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class MenuItemResponse(_Model):
    """MenuItemResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.MenuItem
    """

    data: "_models.MenuItem" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.MenuItem",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class NotFoundError(_Model):
    """NotFoundError.

    :ivar code: Required. Default value is "NOT_FOUND".
    :vartype code: str
    :ivar message: Required.
    :vartype message: str
    """

    code: Literal["NOT_FOUND"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required. Default value is \"NOT_FOUND\"."""
    message: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        message: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.code: Literal["NOT_FOUND"] = "NOT_FOUND"


class PaginationMeta(_Model):
    """PaginationMeta.

    :ivar page: Required.
    :vartype page: int
    :ivar limit: Required.
    :vartype limit: int
    :ivar total_items: Required.
    :vartype total_items: int
    :ivar total_pages: Required.
    :vartype total_pages: int
    """

    page: int = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    limit: int = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    total_items: int = rest_field(name="totalItems", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    total_pages: int = rest_field(name="totalPages", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        page: int,
        limit: int,
        total_items: int,
        total_pages: int,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class PriceCategoryItem(_Model):
    """PriceCategoryItem.

    :ivar code: Required. Known values are: "LOW", "MEDIUM", and "HIGH".
    :vartype code: str or ~restaurantbookingapi.models.PriceCategory
    :ivar label: Required.
    :vartype label: str
    """

    code: Union[str, "_models.PriceCategory"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required. Known values are: \"LOW\", \"MEDIUM\", and \"HIGH\"."""
    label: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        code: Union[str, "_models.PriceCategory"],
        label: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class PriceCategoryListResponse(_Model):
    """PriceCategoryListResponse.

    :ivar data: Required.
    :vartype data: list[~restaurantbookingapi.models.PriceCategoryItem]
    """

    data: List["_models.PriceCategoryItem"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: List["_models.PriceCategoryItem"],
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RegisterRequest(_Model):
    """RegisterRequest.

    :ivar first_name: Required.
    :vartype first_name: str
    :ivar last_name: Required.
    :vartype last_name: str
    :ivar email: Required.
    :vartype email: str
    :ivar phone: Required.
    :vartype phone: str
    :ivar password: Required.
    :vartype password: str
    :ivar password_confirmation: Required.
    :vartype password_confirmation: str
    """

    first_name: str = rest_field(name="firstName", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    last_name: str = rest_field(name="lastName", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    email: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    phone: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    password: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    password_confirmation: str = rest_field(
        name="passwordConfirmation", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required."""

    @overload
    def __init__(
        self,
        *,
        first_name: str,
        last_name: str,
        email: str,
        phone: str,
        password: str,
        password_confirmation: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RegisterResponse(_Model):
    """RegisterResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.AuthPayload
    """

    data: "_models.AuthPayload" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.AuthPayload",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class Reservation(_Model):
    """Reservation.

    :ivar id: Required.
    :vartype id: str
    :ivar user: Required.
    :vartype user: ~restaurantbookingapi.models.ReservationUserInfo
    :ivar restaurant: Required.
    :vartype restaurant: ~restaurantbookingapi.models.ReservationRestaurantInfo
    :ivar table: Required.
    :vartype table: ~restaurantbookingapi.models.ReservationTableInfo
    :ivar status: Required. Known values are: "PENDING", "CONFIRMED", "CANCELLED", and "COMPLETED".
    :vartype status: str or ~restaurantbookingapi.models.ReservationStatus
    :ivar reservation_date: Required.
    :vartype reservation_date: str
    :ivar reservation_time: Required.
    :vartype reservation_time: str
    :ivar guests_count: Required.
    :vartype guests_count: int
    :ivar comment:
    :vartype comment: str
    :ivar created_at: Required.
    :vartype created_at: str
    :ivar updated_at: Required.
    :vartype updated_at: str
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    user: "_models.ReservationUserInfo" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    restaurant: "_models.ReservationRestaurantInfo" = rest_field(
        visibility=["read", "create", "update", "delete", "query"]
    )
    """Required."""
    table: "_models.ReservationTableInfo" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    status: Union[str, "_models.ReservationStatus"] = rest_field(
        visibility=["read", "create", "update", "delete", "query"]
    )
    """Required. Known values are: \"PENDING\", \"CONFIRMED\", \"CANCELLED\", and \"COMPLETED\"."""
    reservation_date: str = rest_field(
        name="reservationDate", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required."""
    reservation_time: str = rest_field(
        name="reservationTime", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required."""
    guests_count: int = rest_field(name="guestsCount", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    comment: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    created_at: str = rest_field(name="createdAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    updated_at: str = rest_field(name="updatedAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        user: "_models.ReservationUserInfo",
        restaurant: "_models.ReservationRestaurantInfo",
        table: "_models.ReservationTableInfo",
        status: Union[str, "_models.ReservationStatus"],
        reservation_date: str,
        reservation_time: str,
        guests_count: int,
        created_at: str,
        updated_at: str,
        comment: Optional[str] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ReservationListQuery(_Model):
    """ReservationListQuery.

    :ivar status: Known values are: "PENDING", "CONFIRMED", "CANCELLED", and "COMPLETED".
    :vartype status: str or ~restaurantbookingapi.models.ReservationStatus
    :ivar from_date:
    :vartype from_date: str
    :ivar to_date:
    :vartype to_date: str
    :ivar page:
    :vartype page: int
    :ivar limit:
    :vartype limit: int
    """

    status: Optional[Union[str, "_models.ReservationStatus"]] = rest_field(
        visibility=["read", "create", "update", "delete", "query"]
    )
    """Known values are: \"PENDING\", \"CONFIRMED\", \"CANCELLED\", and \"COMPLETED\"."""
    from_date: Optional[str] = rest_field(name="fromDate", visibility=["read", "create", "update", "delete", "query"])
    to_date: Optional[str] = rest_field(name="toDate", visibility=["read", "create", "update", "delete", "query"])
    page: Optional[int] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    limit: Optional[int] = rest_field(visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        status: Optional[Union[str, "_models.ReservationStatus"]] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        page: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ReservationListResponse(_Model):
    """ReservationListResponse.

    :ivar data: Required.
    :vartype data: list[~restaurantbookingapi.models.Reservation]
    :ivar meta: Required.
    :vartype meta: ~restaurantbookingapi.models.PaginationMeta
    """

    data: List["_models.Reservation"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    meta: "_models.PaginationMeta" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: List["_models.Reservation"],
        meta: "_models.PaginationMeta",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ReservationResponse(_Model):
    """ReservationResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.Reservation
    """

    data: "_models.Reservation" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.Reservation",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ReservationRestaurantInfo(_Model):
    """ReservationRestaurantInfo.

    :ivar id: Required.
    :vartype id: str
    :ivar title: Required.
    :vartype title: str
    :ivar location: Required.
    :vartype location: ~restaurantbookingapi.models.Location
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    title: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    location: "_models.Location" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        title: str,
        location: "_models.Location",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ReservationStatusItem(_Model):
    """ReservationStatusItem.

    :ivar code: Required. Known values are: "PENDING", "CONFIRMED", "CANCELLED", and "COMPLETED".
    :vartype code: str or ~restaurantbookingapi.models.ReservationStatus
    :ivar label: Required.
    :vartype label: str
    """

    code: Union[str, "_models.ReservationStatus"] = rest_field(
        visibility=["read", "create", "update", "delete", "query"]
    )
    """Required. Known values are: \"PENDING\", \"CONFIRMED\", \"CANCELLED\", and \"COMPLETED\"."""
    label: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        code: Union[str, "_models.ReservationStatus"],
        label: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ReservationStatusListResponse(_Model):
    """ReservationStatusListResponse.

    :ivar data: Required.
    :vartype data: list[~restaurantbookingapi.models.ReservationStatusItem]
    """

    data: List["_models.ReservationStatusItem"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: List["_models.ReservationStatusItem"],
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ReservationTableInfo(_Model):
    """ReservationTableInfo.

    :ivar id: Required.
    :vartype id: str
    :ivar table_number: Required.
    :vartype table_number: str
    :ivar capacity: Required.
    :vartype capacity: int
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    table_number: str = rest_field(name="tableNumber", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    capacity: int = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        table_number: str,
        capacity: int,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ReservationUserInfo(_Model):
    """ReservationUserInfo.

    :ivar id: Required.
    :vartype id: str
    :ivar first_name: Required.
    :vartype first_name: str
    :ivar last_name: Required.
    :vartype last_name: str
    :ivar email: Required.
    :vartype email: str
    :ivar phone: Required.
    :vartype phone: str
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    first_name: str = rest_field(name="firstName", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    last_name: str = rest_field(name="lastName", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    email: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    phone: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        first_name: str,
        last_name: str,
        email: str,
        phone: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantAvailabilityQuery(_Model):
    """RestaurantAvailabilityQuery.

    :ivar reservation_date: Required.
    :vartype reservation_date: str
    :ivar reservation_time: Required.
    :vartype reservation_time: str
    :ivar guests_count: Required.
    :vartype guests_count: int
    """

    reservation_date: str = rest_field(
        name="reservationDate", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required."""
    reservation_time: str = rest_field(
        name="reservationTime", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required."""
    guests_count: int = rest_field(name="guestsCount", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        reservation_date: str,
        reservation_time: str,
        guests_count: int,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantAvailabilityResponse(_Model):
    """RestaurantAvailabilityResponse.

    :ivar restaurant_id: Required.
    :vartype restaurant_id: str
    :ivar reservation_date: Required.
    :vartype reservation_date: str
    :ivar reservation_time: Required.
    :vartype reservation_time: str
    :ivar guests_count: Required.
    :vartype guests_count: int
    :ivar data: Required.
    :vartype data: list[~restaurantbookingapi.models.AvailableTable]
    """

    restaurant_id: str = rest_field(name="restaurantId", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    reservation_date: str = rest_field(
        name="reservationDate", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required."""
    reservation_time: str = rest_field(
        name="reservationTime", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required."""
    guests_count: int = rest_field(name="guestsCount", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    data: List["_models.AvailableTable"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        restaurant_id: str,
        reservation_date: str,
        reservation_time: str,
        guests_count: int,
        data: List["_models.AvailableTable"],
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantCard(_Model):
    """RestaurantCard.

    :ivar id: Required.
    :vartype id: str
    :ivar title: Required.
    :vartype title: str
    :ivar description:
    :vartype description: str
    :ivar phone: Required.
    :vartype phone: str
    :ivar email:
    :vartype email: str
    :ivar open_time: Required.
    :vartype open_time: str
    :ivar close_time: Required.
    :vartype close_time: str
    :ivar avg_rating: Required.
    :vartype avg_rating: float
    :ivar price_category: Required. Known values are: "LOW", "MEDIUM", and "HIGH".
    :vartype price_category: str or ~restaurantbookingapi.models.PriceCategory
    :ivar location: Required.
    :vartype location: ~restaurantbookingapi.models.Location
    :ivar cuisines: Required.
    :vartype cuisines: list[~restaurantbookingapi.models.Cuisine]
    :ivar main_photo:
    :vartype main_photo: ~restaurantbookingapi.models.RestaurantPhoto
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    title: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    description: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    phone: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    email: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    open_time: str = rest_field(name="openTime", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    close_time: str = rest_field(name="closeTime", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    avg_rating: float = rest_field(name="avgRating", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    price_category: Union[str, "_models.PriceCategory"] = rest_field(
        name="priceCategory", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required. Known values are: \"LOW\", \"MEDIUM\", and \"HIGH\"."""
    location: "_models.Location" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    cuisines: List["_models.Cuisine"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    main_photo: Optional["_models.RestaurantPhoto"] = rest_field(
        name="mainPhoto", visibility=["read", "create", "update", "delete", "query"]
    )

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        title: str,
        phone: str,
        open_time: str,
        close_time: str,
        avg_rating: float,
        price_category: Union[str, "_models.PriceCategory"],
        location: "_models.Location",
        cuisines: List["_models.Cuisine"],
        description: Optional[str] = None,
        email: Optional[str] = None,
        main_photo: Optional["_models.RestaurantPhoto"] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantDetail(RestaurantCard):
    """RestaurantDetail.

    :ivar id: Required.
    :vartype id: str
    :ivar title: Required.
    :vartype title: str
    :ivar description:
    :vartype description: str
    :ivar phone: Required.
    :vartype phone: str
    :ivar email:
    :vartype email: str
    :ivar open_time: Required.
    :vartype open_time: str
    :ivar close_time: Required.
    :vartype close_time: str
    :ivar avg_rating: Required.
    :vartype avg_rating: float
    :ivar price_category: Required. Known values are: "LOW", "MEDIUM", and "HIGH".
    :vartype price_category: str or ~restaurantbookingapi.models.PriceCategory
    :ivar location: Required.
    :vartype location: ~restaurantbookingapi.models.Location
    :ivar cuisines: Required.
    :vartype cuisines: list[~restaurantbookingapi.models.Cuisine]
    :ivar main_photo:
    :vartype main_photo: ~restaurantbookingapi.models.RestaurantPhoto
    :ivar is_published: Required.
    :vartype is_published: bool
    :ivar tables: Required.
    :vartype tables: list[~restaurantbookingapi.models.RestaurantTable]
    :ivar photos: Required.
    :vartype photos: list[~restaurantbookingapi.models.RestaurantPhoto]
    :ivar menu: Required.
    :vartype menu: list[~restaurantbookingapi.models.MenuCategory]
    :ivar reviews_summary: Required.
    :vartype reviews_summary: ~restaurantbookingapi.models.ReviewsSummary
    :ivar created_at: Required.
    :vartype created_at: str
    :ivar updated_at: Required.
    :vartype updated_at: str
    """

    is_published: bool = rest_field(name="isPublished", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    tables: List["_models.RestaurantTable"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    photos: List["_models.RestaurantPhoto"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    menu: List["_models.MenuCategory"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    reviews_summary: "_models.ReviewsSummary" = rest_field(
        name="reviewsSummary", visibility=["read", "create", "update", "delete", "query"]
    )
    """Required."""
    created_at: str = rest_field(name="createdAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    updated_at: str = rest_field(name="updatedAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        title: str,
        phone: str,
        open_time: str,
        close_time: str,
        avg_rating: float,
        price_category: Union[str, "_models.PriceCategory"],
        location: "_models.Location",
        cuisines: List["_models.Cuisine"],
        is_published: bool,
        tables: List["_models.RestaurantTable"],
        photos: List["_models.RestaurantPhoto"],
        menu: List["_models.MenuCategory"],
        reviews_summary: "_models.ReviewsSummary",
        created_at: str,
        updated_at: str,
        description: Optional[str] = None,
        email: Optional[str] = None,
        main_photo: Optional["_models.RestaurantPhoto"] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantDetailResponse(_Model):
    """RestaurantDetailResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.RestaurantDetail
    """

    data: "_models.RestaurantDetail" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.RestaurantDetail",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantListResponse(_Model):
    """RestaurantListResponse.

    :ivar data: Required.
    :vartype data: list[~restaurantbookingapi.models.RestaurantCard]
    :ivar meta: Required.
    :vartype meta: ~restaurantbookingapi.models.PaginationMeta
    """

    data: List["_models.RestaurantCard"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    meta: "_models.PaginationMeta" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: List["_models.RestaurantCard"],
        meta: "_models.PaginationMeta",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantMenuResponse(_Model):
    """RestaurantMenuResponse.

    :ivar restaurant_id: Required.
    :vartype restaurant_id: str
    :ivar data: Required.
    :vartype data: list[~restaurantbookingapi.models.MenuCategory]
    """

    restaurant_id: str = rest_field(name="restaurantId", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    data: List["_models.MenuCategory"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        restaurant_id: str,
        data: List["_models.MenuCategory"],
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantPhoto(_Model):
    """RestaurantPhoto.

    :ivar id: Required.
    :vartype id: str
    :ivar image_url: Required.
    :vartype image_url: str
    :ivar is_main: Required.
    :vartype is_main: bool
    :ivar created_at: Required.
    :vartype created_at: str
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    image_url: str = rest_field(name="imageUrl", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    is_main: bool = rest_field(name="isMain", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    created_at: str = rest_field(name="createdAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        image_url: str,
        is_main: bool,
        created_at: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantPhotoListResponse(_Model):
    """RestaurantPhotoListResponse.

    :ivar restaurant_id: Required.
    :vartype restaurant_id: str
    :ivar data: Required.
    :vartype data: list[~restaurantbookingapi.models.RestaurantPhoto]
    """

    restaurant_id: str = rest_field(name="restaurantId", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    data: List["_models.RestaurantPhoto"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        restaurant_id: str,
        data: List["_models.RestaurantPhoto"],
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantPhotoResponse(_Model):
    """RestaurantPhotoResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.RestaurantPhoto
    """

    data: "_models.RestaurantPhoto" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.RestaurantPhoto",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantReview(_Model):
    """RestaurantReview.

    :ivar id: Required.
    :vartype id: str
    :ivar user: Required.
    :vartype user: ~restaurantbookingapi.models.ReviewAuthor
    :ivar rating: Required.
    :vartype rating: float
    :ivar comment: Required.
    :vartype comment: str
    :ivar created_at: Required.
    :vartype created_at: str
    :ivar updated_at: Required.
    :vartype updated_at: str
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    user: "_models.ReviewAuthor" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    rating: float = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    comment: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    created_at: str = rest_field(name="createdAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    updated_at: str = rest_field(name="updatedAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        user: "_models.ReviewAuthor",
        rating: float,
        comment: str,
        created_at: str,
        updated_at: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantReviewListQuery(_Model):
    """RestaurantReviewListQuery.

    :ivar page:
    :vartype page: int
    :ivar limit:
    :vartype limit: int
    """

    page: Optional[int] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    limit: Optional[int] = rest_field(visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        page: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantReviewListResponse(_Model):
    """RestaurantReviewListResponse.

    :ivar data: Required.
    :vartype data: list[~restaurantbookingapi.models.RestaurantReview]
    :ivar meta: Required.
    :vartype meta: ~restaurantbookingapi.models.PaginationMeta
    """

    data: List["_models.RestaurantReview"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    meta: "_models.PaginationMeta" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: List["_models.RestaurantReview"],
        meta: "_models.PaginationMeta",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantReviewResponse(_Model):
    """RestaurantReviewResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.RestaurantReview
    """

    data: "_models.RestaurantReview" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.RestaurantReview",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantTable(_Model):
    """RestaurantTable.

    :ivar id: Required.
    :vartype id: str
    :ivar table_number: Required.
    :vartype table_number: str
    :ivar capacity: Required.
    :vartype capacity: int
    :ivar is_active: Required.
    :vartype is_active: bool
    :ivar created_at: Required.
    :vartype created_at: str
    :ivar updated_at: Required.
    :vartype updated_at: str
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    table_number: str = rest_field(name="tableNumber", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    capacity: int = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    is_active: bool = rest_field(name="isActive", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    created_at: str = rest_field(name="createdAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    updated_at: str = rest_field(name="updatedAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        table_number: str,
        capacity: int,
        is_active: bool,
        created_at: str,
        updated_at: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RestaurantTableResponse(_Model):
    """RestaurantTableResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.RestaurantTable
    """

    data: "_models.RestaurantTable" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.RestaurantTable",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ReviewAuthor(_Model):
    """ReviewAuthor.

    :ivar id: Required.
    :vartype id: str
    :ivar first_name: Required.
    :vartype first_name: str
    :ivar last_name: Required.
    :vartype last_name: str
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    first_name: str = rest_field(name="firstName", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    last_name: str = rest_field(name="lastName", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        first_name: str,
        last_name: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ReviewsSummary(_Model):
    """ReviewsSummary.

    :ivar total_reviews: Required.
    :vartype total_reviews: int
    :ivar avg_rating: Required.
    :vartype avg_rating: float
    """

    total_reviews: int = rest_field(name="totalReviews", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    avg_rating: float = rest_field(name="avgRating", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        total_reviews: int,
        avg_rating: float,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class RoleItem(_Model):
    """RoleItem.

    :ivar code: Required. Known values are: "ADMIN" and "USER".
    :vartype code: str or ~restaurantbookingapi.models.UserRole
    :ivar label: Required.
    :vartype label: str
    """

    code: Union[str, "_models.UserRole"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required. Known values are: \"ADMIN\" and \"USER\"."""
    label: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        code: Union[str, "_models.UserRole"],
        label: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class SearchRestaurantsQuery(_Model):
    """SearchRestaurantsQuery.

    :ivar city:
    :vartype city: str
    :ivar district:
    :vartype district: str
    :ivar metro_station:
    :vartype metro_station: str
    :ivar cuisine_id:
    :vartype cuisine_id: str
    :ivar price_category: Known values are: "LOW", "MEDIUM", and "HIGH".
    :vartype price_category: str or ~restaurantbookingapi.models.PriceCategory
    :ivar reservation_date:
    :vartype reservation_date: str
    :ivar reservation_time:
    :vartype reservation_time: str
    :ivar guests_count:
    :vartype guests_count: int
    :ivar page:
    :vartype page: int
    :ivar limit:
    :vartype limit: int
    """

    city: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    district: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    metro_station: Optional[str] = rest_field(
        name="metroStation", visibility=["read", "create", "update", "delete", "query"]
    )
    cuisine_id: Optional[str] = rest_field(name="cuisineId", visibility=["read", "create", "update", "delete", "query"])
    price_category: Optional[Union[str, "_models.PriceCategory"]] = rest_field(
        name="priceCategory", visibility=["read", "create", "update", "delete", "query"]
    )
    """Known values are: \"LOW\", \"MEDIUM\", and \"HIGH\"."""
    reservation_date: Optional[str] = rest_field(
        name="reservationDate", visibility=["read", "create", "update", "delete", "query"]
    )
    reservation_time: Optional[str] = rest_field(
        name="reservationTime", visibility=["read", "create", "update", "delete", "query"]
    )
    guests_count: Optional[int] = rest_field(
        name="guestsCount", visibility=["read", "create", "update", "delete", "query"]
    )
    page: Optional[int] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    limit: Optional[int] = rest_field(visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        city: Optional[str] = None,
        district: Optional[str] = None,
        metro_station: Optional[str] = None,
        cuisine_id: Optional[str] = None,
        price_category: Optional[Union[str, "_models.PriceCategory"]] = None,
        reservation_date: Optional[str] = None,
        reservation_time: Optional[str] = None,
        guests_count: Optional[int] = None,
        page: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ServerError(_Model):
    """ServerError.

    :ivar code: Required. Default value is "SERVER_ERROR".
    :vartype code: str
    :ivar message: Required.
    :vartype message: str
    """

    code: Literal["SERVER_ERROR"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required. Default value is \"SERVER_ERROR\"."""
    message: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        message: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.code: Literal["SERVER_ERROR"] = "SERVER_ERROR"


class UnauthorizedError(_Model):
    """UnauthorizedError.

    :ivar code: Required. Default value is "UNAUTHORIZED".
    :vartype code: str
    :ivar message: Required.
    :vartype message: str
    """

    code: Literal["UNAUTHORIZED"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required. Default value is \"UNAUTHORIZED\"."""
    message: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        message: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.code: Literal["UNAUTHORIZED"] = "UNAUTHORIZED"


class UpdateLocationRequest(_Model):
    """UpdateLocationRequest.

    :ivar city:
    :vartype city: str
    :ivar address:
    :vartype address: str
    :ivar district:
    :vartype district: str
    :ivar metro_station:
    :vartype metro_station: str
    """

    city: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    address: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    district: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    metro_station: Optional[str] = rest_field(
        name="metroStation", visibility=["read", "create", "update", "delete", "query"]
    )

    @overload
    def __init__(
        self,
        *,
        city: Optional[str] = None,
        address: Optional[str] = None,
        district: Optional[str] = None,
        metro_station: Optional[str] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UpdateMenuCategoryRequest(_Model):
    """UpdateMenuCategoryRequest.

    :ivar title:
    :vartype title: str
    """

    title: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        title: Optional[str] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UpdateMenuItemRequest(_Model):
    """UpdateMenuItemRequest.

    :ivar title:
    :vartype title: str
    :ivar description:
    :vartype description: str
    :ivar price:
    :vartype price: float
    :ivar weight:
    :vartype weight: str
    :ivar is_available:
    :vartype is_available: bool
    """

    title: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    description: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    price: Optional[float] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    weight: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    is_available: Optional[bool] = rest_field(
        name="isAvailable", visibility=["read", "create", "update", "delete", "query"]
    )

    @overload
    def __init__(
        self,
        *,
        title: Optional[str] = None,
        description: Optional[str] = None,
        price: Optional[float] = None,
        weight: Optional[str] = None,
        is_available: Optional[bool] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UpdateReservationRequest(_Model):
    """UpdateReservationRequest.

    :ivar table_id:
    :vartype table_id: str
    :ivar reservation_date:
    :vartype reservation_date: str
    :ivar reservation_time:
    :vartype reservation_time: str
    :ivar guests_count:
    :vartype guests_count: int
    :ivar comment:
    :vartype comment: str
    """

    table_id: Optional[str] = rest_field(name="tableId", visibility=["read", "create", "update", "delete", "query"])
    reservation_date: Optional[str] = rest_field(
        name="reservationDate", visibility=["read", "create", "update", "delete", "query"]
    )
    reservation_time: Optional[str] = rest_field(
        name="reservationTime", visibility=["read", "create", "update", "delete", "query"]
    )
    guests_count: Optional[int] = rest_field(
        name="guestsCount", visibility=["read", "create", "update", "delete", "query"]
    )
    comment: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        table_id: Optional[str] = None,
        reservation_date: Optional[str] = None,
        reservation_time: Optional[str] = None,
        guests_count: Optional[int] = None,
        comment: Optional[str] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UpdateReservationStatusRequest(_Model):
    """UpdateReservationStatusRequest.

    :ivar status: Required. Known values are: "PENDING", "CONFIRMED", "CANCELLED", and "COMPLETED".
    :vartype status: str or ~restaurantbookingapi.models.ReservationStatus
    """

    status: Union[str, "_models.ReservationStatus"] = rest_field(
        visibility=["read", "create", "update", "delete", "query"]
    )
    """Required. Known values are: \"PENDING\", \"CONFIRMED\", \"CANCELLED\", and \"COMPLETED\"."""

    @overload
    def __init__(
        self,
        *,
        status: Union[str, "_models.ReservationStatus"],
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UpdateRestaurantPhotoRequest(_Model):
    """UpdateRestaurantPhotoRequest.

    :ivar image_url:
    :vartype image_url: str
    :ivar is_main:
    :vartype is_main: bool
    """

    image_url: Optional[str] = rest_field(name="imageUrl", visibility=["read", "create", "update", "delete", "query"])
    is_main: Optional[bool] = rest_field(name="isMain", visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        image_url: Optional[str] = None,
        is_main: Optional[bool] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UpdateRestaurantPublicationRequest(_Model):
    """UpdateRestaurantPublicationRequest.

    :ivar is_published: Required.
    :vartype is_published: bool
    """

    is_published: bool = rest_field(name="isPublished", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        is_published: bool,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UpdateRestaurantRequest(_Model):
    """UpdateRestaurantRequest.

    :ivar location_id:
    :vartype location_id: str
    :ivar price_category: Known values are: "LOW", "MEDIUM", and "HIGH".
    :vartype price_category: str or ~restaurantbookingapi.models.PriceCategory
    :ivar title:
    :vartype title: str
    :ivar description:
    :vartype description: str
    :ivar phone:
    :vartype phone: str
    :ivar email:
    :vartype email: str
    :ivar open_time:
    :vartype open_time: str
    :ivar close_time:
    :vartype close_time: str
    :ivar cuisine_ids:
    :vartype cuisine_ids: list[str]
    """

    location_id: Optional[str] = rest_field(
        name="locationId", visibility=["read", "create", "update", "delete", "query"]
    )
    price_category: Optional[Union[str, "_models.PriceCategory"]] = rest_field(
        name="priceCategory", visibility=["read", "create", "update", "delete", "query"]
    )
    """Known values are: \"LOW\", \"MEDIUM\", and \"HIGH\"."""
    title: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    description: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    phone: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    email: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    open_time: Optional[str] = rest_field(name="openTime", visibility=["read", "create", "update", "delete", "query"])
    close_time: Optional[str] = rest_field(name="closeTime", visibility=["read", "create", "update", "delete", "query"])
    cuisine_ids: Optional[List[str]] = rest_field(
        name="cuisineIds", visibility=["read", "create", "update", "delete", "query"]
    )

    @overload
    def __init__(
        self,
        *,
        location_id: Optional[str] = None,
        price_category: Optional[Union[str, "_models.PriceCategory"]] = None,
        title: Optional[str] = None,
        description: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        open_time: Optional[str] = None,
        close_time: Optional[str] = None,
        cuisine_ids: Optional[List[str]] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UpdateRestaurantReviewRequest(_Model):
    """UpdateRestaurantReviewRequest.

    :ivar rating:
    :vartype rating: float
    :ivar comment:
    :vartype comment: str
    """

    rating: Optional[float] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    comment: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        rating: Optional[float] = None,
        comment: Optional[str] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UpdateRestaurantTableRequest(_Model):
    """UpdateRestaurantTableRequest.

    :ivar table_number:
    :vartype table_number: str
    :ivar capacity:
    :vartype capacity: int
    :ivar is_active:
    :vartype is_active: bool
    """

    table_number: Optional[str] = rest_field(
        name="tableNumber", visibility=["read", "create", "update", "delete", "query"]
    )
    capacity: Optional[int] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    is_active: Optional[bool] = rest_field(name="isActive", visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        table_number: Optional[str] = None,
        capacity: Optional[int] = None,
        is_active: Optional[bool] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UpdateUserProfileRequest(_Model):
    """UpdateUserProfileRequest.

    :ivar first_name:
    :vartype first_name: str
    :ivar last_name:
    :vartype last_name: str
    :ivar phone:
    :vartype phone: str
    :ivar current_password:
    :vartype current_password: str
    :ivar password:
    :vartype password: str
    """

    first_name: Optional[str] = rest_field(name="firstName", visibility=["read", "create", "update", "delete", "query"])
    last_name: Optional[str] = rest_field(name="lastName", visibility=["read", "create", "update", "delete", "query"])
    phone: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    current_password: Optional[str] = rest_field(
        name="currentPassword", visibility=["read", "create", "update", "delete", "query"]
    )
    password: Optional[str] = rest_field(visibility=["read", "create", "update", "delete", "query"])

    @overload
    def __init__(
        self,
        *,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        phone: Optional[str] = None,
        current_password: Optional[str] = None,
        password: Optional[str] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UserProfile(_Model):
    """UserProfile.

    :ivar id: Required.
    :vartype id: str
    :ivar role: Required. Known values are: "ADMIN" and "USER".
    :vartype role: str or ~restaurantbookingapi.models.UserRole
    :ivar first_name: Required.
    :vartype first_name: str
    :ivar last_name: Required.
    :vartype last_name: str
    :ivar email: Required.
    :vartype email: str
    :ivar phone: Required.
    :vartype phone: str
    :ivar is_verified: Required.
    :vartype is_verified: bool
    :ivar created_at: Required.
    :vartype created_at: str
    :ivar updated_at: Required.
    :vartype updated_at: str
    """

    id: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    role: Union[str, "_models.UserRole"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required. Known values are: \"ADMIN\" and \"USER\"."""
    first_name: str = rest_field(name="firstName", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    last_name: str = rest_field(name="lastName", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    email: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    phone: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    is_verified: bool = rest_field(name="isVerified", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    created_at: str = rest_field(name="createdAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    updated_at: str = rest_field(name="updatedAt", visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        id: str,  # pylint: disable=redefined-builtin
        role: Union[str, "_models.UserRole"],
        first_name: str,
        last_name: str,
        email: str,
        phone: str,
        is_verified: bool,
        created_at: str,
        updated_at: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UserProfileResponse(_Model):
    """UserProfileResponse.

    :ivar data: Required.
    :vartype data: ~restaurantbookingapi.models.UserProfile
    """

    data: "_models.UserProfile" = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: "_models.UserProfile",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UserRoleListResponse(_Model):
    """UserRoleListResponse.

    :ivar data: Required.
    :vartype data: list[~restaurantbookingapi.models.RoleItem]
    """

    data: List["_models.RoleItem"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""

    @overload
    def __init__(
        self,
        *,
        data: List["_models.RoleItem"],
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ValidationError(_Model):
    """ValidationError.

    :ivar code: Required. Default value is "VALIDATION_ERROR".
    :vartype code: str
    :ivar message: Required.
    :vartype message: str
    :ivar details:
    :vartype details: list[~restaurantbookingapi.models.ErrorDetail]
    """

    code: Literal["VALIDATION_ERROR"] = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required. Default value is \"VALIDATION_ERROR\"."""
    message: str = rest_field(visibility=["read", "create", "update", "delete", "query"])
    """Required."""
    details: Optional[List["_models.ErrorDetail"]] = rest_field(
        visibility=["read", "create", "update", "delete", "query"]
    )

    @overload
    def __init__(
        self,
        *,
        message: str,
        details: Optional[List["_models.ErrorDetail"]] = None,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.code: Literal["VALIDATION_ERROR"] = "VALIDATION_ERROR"

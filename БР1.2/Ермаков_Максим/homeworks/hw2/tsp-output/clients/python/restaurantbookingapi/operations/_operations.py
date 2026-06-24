# pylint: disable=too-many-lines
# coding=utf-8
from collections.abc import MutableMapping
from io import IOBase
import json
from typing import Any, Callable, Dict, IO, Optional, TypeVar, Union, overload

from corehttp.exceptions import (
    ClientAuthenticationError,
    HttpResponseError,
    ResourceExistsError,
    ResourceNotFoundError,
    ResourceNotModifiedError,
    StreamClosedError,
    StreamConsumedError,
    map_error,
)
from corehttp.rest import HttpRequest, HttpResponse
from corehttp.runtime import PipelineClient
from corehttp.runtime.pipeline import PipelineResponse
from corehttp.utils import case_insensitive_dict

from .. import models as _models
from .._configuration import RestaurantBookingApiClientConfiguration
from .._utils.model_base import SdkJSONEncoder, _deserialize, _failsafe_deserialize
from .._utils.serialization import Deserializer, Serializer

JSON = MutableMapping[str, Any]
T = TypeVar("T")
ClsType = Optional[Callable[[PipelineResponse[HttpRequest, HttpResponse], T, Dict[str, Any]], Any]]

_SERIALIZER = Serializer()
_SERIALIZER.client_side_validation = False


def build_auth_api_register_request(**kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/auth/register"

    # Construct headers
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="POST", url=_url, headers=_headers, **kwargs)


def build_auth_api_login_request(**kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/auth/login"

    # Construct headers
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="POST", url=_url, headers=_headers, **kwargs)


def build_auth_api_logout_request(*, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/auth/logout"

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="POST", url=_url, headers=_headers, **kwargs)


def build_users_api_get_profile_request(*, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/users/me"

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, headers=_headers, **kwargs)


def build_users_api_update_profile_request(*, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/users/me"

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="PATCH", url=_url, headers=_headers, **kwargs)


def build_reference_api_list_cuisines_request(**kwargs: Any) -> HttpRequest:  # pylint: disable=name-too-long
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/reference/cuisines"

    # Construct headers
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, headers=_headers, **kwargs)


def build_reference_api_list_locations_request(**kwargs: Any) -> HttpRequest:  # pylint: disable=name-too-long
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/reference/locations"

    # Construct headers
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, headers=_headers, **kwargs)


def build_reference_api_list_price_categories_request(**kwargs: Any) -> HttpRequest:  # pylint: disable=name-too-long
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/reference/price-categories"

    # Construct headers
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, headers=_headers, **kwargs)


def build_reference_api_list_reservation_statuses_request(  # pylint: disable=name-too-long
    **kwargs: Any,
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/reference/reservation-statuses"

    # Construct headers
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, headers=_headers, **kwargs)


def build_reference_api_list_roles_request(**kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/reference/roles"

    # Construct headers
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, headers=_headers, **kwargs)


def build_restaurants_api_search_request(
    *, filters: Optional[_models.SearchRestaurantsQuery] = None, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
    _params = case_insensitive_dict(kwargs.pop("params", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/restaurants"

    # Construct parameters
    if filters is not None:
        _params["filters"] = _SERIALIZER.query("filters", filters, "SearchRestaurantsQuery")

    # Construct headers
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, params=_params, headers=_headers, **kwargs)


def build_restaurants_api_get_by_id_request(restaurant_id: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/restaurants/{restaurantId}"
    path_format_arguments = {
        "restaurantId": _SERIALIZER.url("restaurant_id", restaurant_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, headers=_headers, **kwargs)


def build_restaurants_api_get_menu_request(restaurant_id: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/restaurants/{restaurantId}/menu"
    path_format_arguments = {
        "restaurantId": _SERIALIZER.url("restaurant_id", restaurant_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, headers=_headers, **kwargs)


def build_restaurants_api_get_photos_request(restaurant_id: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/restaurants/{restaurantId}/photos"
    path_format_arguments = {
        "restaurantId": _SERIALIZER.url("restaurant_id", restaurant_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, headers=_headers, **kwargs)


def build_restaurants_api_get_reviews_request(  # pylint: disable=name-too-long
    restaurant_id: str, *, query: Optional[_models.RestaurantReviewListQuery] = None, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
    _params = case_insensitive_dict(kwargs.pop("params", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/restaurants/{restaurantId}/reviews"
    path_format_arguments = {
        "restaurantId": _SERIALIZER.url("restaurant_id", restaurant_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct parameters
    if query is not None:
        _params["query"] = _SERIALIZER.query("query", query, "RestaurantReviewListQuery")

    # Construct headers
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, params=_params, headers=_headers, **kwargs)


def build_restaurants_api_create_review_request(  # pylint: disable=name-too-long
    restaurant_id: str, *, authorization: str, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/restaurants/{restaurantId}/reviews"
    path_format_arguments = {
        "restaurantId": _SERIALIZER.url("restaurant_id", restaurant_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="POST", url=_url, headers=_headers, **kwargs)


def build_restaurants_api_update_review_request(  # pylint: disable=name-too-long
    restaurant_id: str, review_id: str, *, authorization: str, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/restaurants/{restaurantId}/reviews/{reviewId}"
    path_format_arguments = {
        "restaurantId": _SERIALIZER.url("restaurant_id", restaurant_id, "str"),
        "reviewId": _SERIALIZER.url("review_id", review_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="PATCH", url=_url, headers=_headers, **kwargs)


def build_restaurants_api_get_availability_request(  # pylint: disable=name-too-long
    restaurant_id: str, *, query: _models.RestaurantAvailabilityQuery, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
    _params = case_insensitive_dict(kwargs.pop("params", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/restaurants/{restaurantId}/availability"
    path_format_arguments = {
        "restaurantId": _SERIALIZER.url("restaurant_id", restaurant_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct parameters
    _params["query"] = _SERIALIZER.query("query", query, "RestaurantAvailabilityQuery")

    # Construct headers
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, params=_params, headers=_headers, **kwargs)


def build_reservations_api_list_request(
    *, authorization: str, query: Optional[_models.ReservationListQuery] = None, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
    _params = case_insensitive_dict(kwargs.pop("params", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/reservations"

    # Construct parameters
    if query is not None:
        _params["query"] = _SERIALIZER.query("query", query, "ReservationListQuery")

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, params=_params, headers=_headers, **kwargs)


def build_reservations_api_create_request(*, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/reservations"

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="POST", url=_url, headers=_headers, **kwargs)


def build_reservations_api_get_by_id_request(reservation_id: str, *, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/reservations/{reservationId}"
    path_format_arguments = {
        "reservationId": _SERIALIZER.url("reservation_id", reservation_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="GET", url=_url, headers=_headers, **kwargs)


def build_reservations_api_update_request(reservation_id: str, *, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/reservations/{reservationId}"
    path_format_arguments = {
        "reservationId": _SERIALIZER.url("reservation_id", reservation_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="PATCH", url=_url, headers=_headers, **kwargs)


def build_reservations_api_cancel_request(reservation_id: str, *, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/reservations/{reservationId}/cancel"
    path_format_arguments = {
        "reservationId": _SERIALIZER.url("reservation_id", reservation_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="POST", url=_url, headers=_headers, **kwargs)


def build_admin_api_create_location_request(*, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/locations"

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="POST", url=_url, headers=_headers, **kwargs)


def build_admin_api_update_location_request(location_id: str, *, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/locations/{locationId}"
    path_format_arguments = {
        "locationId": _SERIALIZER.url("location_id", location_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="PATCH", url=_url, headers=_headers, **kwargs)


def build_admin_api_create_restaurant_request(  # pylint: disable=name-too-long
    *, authorization: str, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/restaurants"

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="POST", url=_url, headers=_headers, **kwargs)


def build_admin_api_update_restaurant_request(  # pylint: disable=name-too-long
    restaurant_id: str, *, authorization: str, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/restaurants/{restaurantId}"
    path_format_arguments = {
        "restaurantId": _SERIALIZER.url("restaurant_id", restaurant_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="PATCH", url=_url, headers=_headers, **kwargs)


def build_admin_api_update_restaurant_publication_request(  # pylint: disable=name-too-long
    restaurant_id: str, *, authorization: str, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/restaurants/{restaurantId}/publication"
    path_format_arguments = {
        "restaurantId": _SERIALIZER.url("restaurant_id", restaurant_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="PATCH", url=_url, headers=_headers, **kwargs)


def build_admin_api_create_table_request(restaurant_id: str, *, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/restaurants/{restaurantId}/tables"
    path_format_arguments = {
        "restaurantId": _SERIALIZER.url("restaurant_id", restaurant_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="POST", url=_url, headers=_headers, **kwargs)


def build_admin_api_update_table_request(table_id: str, *, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/tables/{tableId}"
    path_format_arguments = {
        "tableId": _SERIALIZER.url("table_id", table_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="PATCH", url=_url, headers=_headers, **kwargs)


def build_admin_api_create_menu_category_request(  # pylint: disable=name-too-long
    restaurant_id: str, *, authorization: str, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/restaurants/{restaurantId}/menu-categories"
    path_format_arguments = {
        "restaurantId": _SERIALIZER.url("restaurant_id", restaurant_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="POST", url=_url, headers=_headers, **kwargs)


def build_admin_api_update_menu_category_request(  # pylint: disable=name-too-long
    menu_category_id: str, *, authorization: str, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/menu-categories/{menuCategoryId}"
    path_format_arguments = {
        "menuCategoryId": _SERIALIZER.url("menu_category_id", menu_category_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="PATCH", url=_url, headers=_headers, **kwargs)


def build_admin_api_create_menu_item_request(
    menu_category_id: str, *, authorization: str, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/menu-categories/{menuCategoryId}/items"
    path_format_arguments = {
        "menuCategoryId": _SERIALIZER.url("menu_category_id", menu_category_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="POST", url=_url, headers=_headers, **kwargs)


def build_admin_api_update_menu_item_request(menu_item_id: str, *, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/menu-items/{menuItemId}"
    path_format_arguments = {
        "menuItemId": _SERIALIZER.url("menu_item_id", menu_item_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="PATCH", url=_url, headers=_headers, **kwargs)


def build_admin_api_create_photo_request(restaurant_id: str, *, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/restaurants/{restaurantId}/photos"
    path_format_arguments = {
        "restaurantId": _SERIALIZER.url("restaurant_id", restaurant_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="POST", url=_url, headers=_headers, **kwargs)


def build_admin_api_update_photo_request(photo_id: str, *, authorization: str, **kwargs: Any) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/photos/{photoId}"
    path_format_arguments = {
        "photoId": _SERIALIZER.url("photo_id", photo_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="PATCH", url=_url, headers=_headers, **kwargs)


def build_admin_api_update_reservation_status_request(  # pylint: disable=name-too-long
    reservation_id: str, *, authorization: str, **kwargs: Any
) -> HttpRequest:
    _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})

    content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
    accept = _headers.pop("Accept", "application/json")

    # Construct URL
    _url = "/api/v1/admin/reservations/{reservationId}/status"
    path_format_arguments = {
        "reservationId": _SERIALIZER.url("reservation_id", reservation_id, "str"),
    }

    _url: str = _url.format(**path_format_arguments)  # type: ignore

    # Construct headers
    _headers["Authorization"] = _SERIALIZER.header("authorization", authorization, "str")
    if content_type is not None:
        _headers["Content-Type"] = _SERIALIZER.header("content_type", content_type, "str")
    _headers["Accept"] = _SERIALIZER.header("accept", accept, "str")

    return HttpRequest(method="PATCH", url=_url, headers=_headers, **kwargs)


class AuthApiOperations:
    """
    .. warning::
        **DO NOT** instantiate this class directly.

        Instead, you should access the following operations through
        :class:`~restaurantbookingapi.RestaurantBookingApiClient`'s
        :attr:`auth_api` attribute.
    """

    def __init__(self, *args, **kwargs) -> None:
        input_args = list(args)
        self._client: PipelineClient = input_args.pop(0) if input_args else kwargs.pop("client")
        self._config: RestaurantBookingApiClientConfiguration = (
            input_args.pop(0) if input_args else kwargs.pop("config")
        )
        self._serialize: Serializer = input_args.pop(0) if input_args else kwargs.pop("serializer")
        self._deserialize: Deserializer = input_args.pop(0) if input_args else kwargs.pop("deserializer")

    @overload
    def register(
        self, body: _models.RegisterRequest, *, content_type: str = "application/json", **kwargs: Any
    ) -> _models.RegisterResponse:
        """register.

        :param body: Required.
        :type body: ~restaurantbookingapi.models.RegisterRequest
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RegisterResponse. The RegisterResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RegisterResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def register(
        self, body: JSON, *, content_type: str = "application/json", **kwargs: Any
    ) -> _models.RegisterResponse:
        """register.

        :param body: Required.
        :type body: JSON
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RegisterResponse. The RegisterResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RegisterResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def register(
        self, body: IO[bytes], *, content_type: str = "application/json", **kwargs: Any
    ) -> _models.RegisterResponse:
        """register.

        :param body: Required.
        :type body: IO[bytes]
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RegisterResponse. The RegisterResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RegisterResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def register(
        self, body: Union[_models.RegisterRequest, JSON, IO[bytes]], **kwargs: Any
    ) -> _models.RegisterResponse:
        """register.

        :param body: Is one of the following types: RegisterRequest, JSON, IO[bytes] Required.
        :type body: ~restaurantbookingapi.models.RegisterRequest or JSON or IO[bytes]
        :return: RegisterResponse. The RegisterResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RegisterResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            404: ResourceNotFoundError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.RegisterResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_auth_api_register_request(
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [201]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.RegisterResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def login(
        self, body: _models.LoginRequest, *, content_type: str = "application/json", **kwargs: Any
    ) -> _models.LoginResponse:
        """login.

        :param body: Required.
        :type body: ~restaurantbookingapi.models.LoginRequest
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: LoginResponse. The LoginResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.LoginResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def login(self, body: JSON, *, content_type: str = "application/json", **kwargs: Any) -> _models.LoginResponse:
        """login.

        :param body: Required.
        :type body: JSON
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: LoginResponse. The LoginResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.LoginResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def login(self, body: IO[bytes], *, content_type: str = "application/json", **kwargs: Any) -> _models.LoginResponse:
        """login.

        :param body: Required.
        :type body: IO[bytes]
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: LoginResponse. The LoginResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.LoginResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def login(self, body: Union[_models.LoginRequest, JSON, IO[bytes]], **kwargs: Any) -> _models.LoginResponse:
        """login.

        :param body: Is one of the following types: LoginRequest, JSON, IO[bytes] Required.
        :type body: ~restaurantbookingapi.models.LoginRequest or JSON or IO[bytes]
        :return: LoginResponse. The LoginResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.LoginResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.LoginResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_auth_api_login_request(
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.LoginResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    def logout(self, *, authorization: str, **kwargs: Any) -> _models.ActionSuccessResponse:
        """logout.

        :keyword authorization: Required.
        :paramtype authorization: str
        :return: ActionSuccessResponse. The ActionSuccessResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ActionSuccessResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.ActionSuccessResponse] = kwargs.pop("cls", None)

        _request = build_auth_api_logout_request(
            authorization=authorization,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.ActionSuccessResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore


class UsersApiOperations:
    """
    .. warning::
        **DO NOT** instantiate this class directly.

        Instead, you should access the following operations through
        :class:`~restaurantbookingapi.RestaurantBookingApiClient`'s
        :attr:`users_api` attribute.
    """

    def __init__(self, *args, **kwargs) -> None:
        input_args = list(args)
        self._client: PipelineClient = input_args.pop(0) if input_args else kwargs.pop("client")
        self._config: RestaurantBookingApiClientConfiguration = (
            input_args.pop(0) if input_args else kwargs.pop("config")
        )
        self._serialize: Serializer = input_args.pop(0) if input_args else kwargs.pop("serializer")
        self._deserialize: Deserializer = input_args.pop(0) if input_args else kwargs.pop("deserializer")

    def get_profile(self, *, authorization: str, **kwargs: Any) -> _models.UserProfileResponse:
        """get_profile.

        :keyword authorization: Required.
        :paramtype authorization: str
        :return: UserProfileResponse. The UserProfileResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.UserProfileResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.UserProfileResponse] = kwargs.pop("cls", None)

        _request = build_users_api_get_profile_request(
            authorization=authorization,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.UserProfileResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def update_profile(
        self,
        body: _models.UpdateUserProfileRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.UserProfileResponse:
        """update_profile.

        :param body: Required.
        :type body: ~restaurantbookingapi.models.UpdateUserProfileRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: UserProfileResponse. The UserProfileResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.UserProfileResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_profile(
        self, body: JSON, *, authorization: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.UserProfileResponse:
        """update_profile.

        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: UserProfileResponse. The UserProfileResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.UserProfileResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_profile(
        self, body: IO[bytes], *, authorization: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.UserProfileResponse:
        """update_profile.

        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: UserProfileResponse. The UserProfileResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.UserProfileResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def update_profile(
        self, body: Union[_models.UpdateUserProfileRequest, JSON, IO[bytes]], *, authorization: str, **kwargs: Any
    ) -> _models.UserProfileResponse:
        """update_profile.

        :param body: Is one of the following types: UpdateUserProfileRequest, JSON, IO[bytes] Required.
        :type body: ~restaurantbookingapi.models.UpdateUserProfileRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: UserProfileResponse. The UserProfileResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.UserProfileResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            404: ResourceNotFoundError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.UserProfileResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_users_api_update_profile_request(
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.UserProfileResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore


class ReferenceApiOperations:
    """
    .. warning::
        **DO NOT** instantiate this class directly.

        Instead, you should access the following operations through
        :class:`~restaurantbookingapi.RestaurantBookingApiClient`'s
        :attr:`reference_api` attribute.
    """

    def __init__(self, *args, **kwargs) -> None:
        input_args = list(args)
        self._client: PipelineClient = input_args.pop(0) if input_args else kwargs.pop("client")
        self._config: RestaurantBookingApiClientConfiguration = (
            input_args.pop(0) if input_args else kwargs.pop("config")
        )
        self._serialize: Serializer = input_args.pop(0) if input_args else kwargs.pop("serializer")
        self._deserialize: Deserializer = input_args.pop(0) if input_args else kwargs.pop("deserializer")

    def list_cuisines(self, **kwargs: Any) -> _models.CuisineListResponse:
        """list_cuisines.

        :return: CuisineListResponse. The CuisineListResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.CuisineListResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.CuisineListResponse] = kwargs.pop("cls", None)

        _request = build_reference_api_list_cuisines_request(
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.CuisineListResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    def list_locations(self, **kwargs: Any) -> _models.LocationListResponse:
        """list_locations.

        :return: LocationListResponse. The LocationListResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.LocationListResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.LocationListResponse] = kwargs.pop("cls", None)

        _request = build_reference_api_list_locations_request(
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.LocationListResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    def list_price_categories(self, **kwargs: Any) -> _models.PriceCategoryListResponse:
        """list_price_categories.

        :return: PriceCategoryListResponse. The PriceCategoryListResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.PriceCategoryListResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.PriceCategoryListResponse] = kwargs.pop("cls", None)

        _request = build_reference_api_list_price_categories_request(
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.PriceCategoryListResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    def list_reservation_statuses(self, **kwargs: Any) -> _models.ReservationStatusListResponse:
        """list_reservation_statuses.

        :return: ReservationStatusListResponse. The ReservationStatusListResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationStatusListResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.ReservationStatusListResponse] = kwargs.pop("cls", None)

        _request = build_reference_api_list_reservation_statuses_request(
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.ReservationStatusListResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    def list_roles(self, **kwargs: Any) -> _models.UserRoleListResponse:
        """list_roles.

        :return: UserRoleListResponse. The UserRoleListResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.UserRoleListResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.UserRoleListResponse] = kwargs.pop("cls", None)

        _request = build_reference_api_list_roles_request(
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.UserRoleListResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore


class RestaurantsApiOperations:
    """
    .. warning::
        **DO NOT** instantiate this class directly.

        Instead, you should access the following operations through
        :class:`~restaurantbookingapi.RestaurantBookingApiClient`'s
        :attr:`restaurants_api` attribute.
    """

    def __init__(self, *args, **kwargs) -> None:
        input_args = list(args)
        self._client: PipelineClient = input_args.pop(0) if input_args else kwargs.pop("client")
        self._config: RestaurantBookingApiClientConfiguration = (
            input_args.pop(0) if input_args else kwargs.pop("config")
        )
        self._serialize: Serializer = input_args.pop(0) if input_args else kwargs.pop("serializer")
        self._deserialize: Deserializer = input_args.pop(0) if input_args else kwargs.pop("deserializer")

    def search(
        self, *, filters: Optional[_models.SearchRestaurantsQuery] = None, **kwargs: Any
    ) -> _models.RestaurantListResponse:
        """search.

        :keyword filters: Default value is None.
        :paramtype filters: ~restaurantbookingapi.models.SearchRestaurantsQuery
        :return: RestaurantListResponse. The RestaurantListResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantListResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.RestaurantListResponse] = kwargs.pop("cls", None)

        _request = build_restaurants_api_search_request(
            filters=filters,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.RestaurantListResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    def get_by_id(self, restaurant_id: str, **kwargs: Any) -> _models.RestaurantDetailResponse:
        """get_by_id.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :return: RestaurantDetailResponse. The RestaurantDetailResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantDetailResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.RestaurantDetailResponse] = kwargs.pop("cls", None)

        _request = build_restaurants_api_get_by_id_request(
            restaurant_id=restaurant_id,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.RestaurantDetailResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    def get_menu(self, restaurant_id: str, **kwargs: Any) -> _models.RestaurantMenuResponse:
        """get_menu.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :return: RestaurantMenuResponse. The RestaurantMenuResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantMenuResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.RestaurantMenuResponse] = kwargs.pop("cls", None)

        _request = build_restaurants_api_get_menu_request(
            restaurant_id=restaurant_id,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.RestaurantMenuResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    def get_photos(self, restaurant_id: str, **kwargs: Any) -> _models.RestaurantPhotoListResponse:
        """get_photos.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :return: RestaurantPhotoListResponse. The RestaurantPhotoListResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantPhotoListResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.RestaurantPhotoListResponse] = kwargs.pop("cls", None)

        _request = build_restaurants_api_get_photos_request(
            restaurant_id=restaurant_id,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.RestaurantPhotoListResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    def get_reviews(
        self, restaurant_id: str, *, query: Optional[_models.RestaurantReviewListQuery] = None, **kwargs: Any
    ) -> _models.RestaurantReviewListResponse:
        """get_reviews.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :keyword query: Default value is None.
        :paramtype query: ~restaurantbookingapi.models.RestaurantReviewListQuery
        :return: RestaurantReviewListResponse. The RestaurantReviewListResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantReviewListResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.RestaurantReviewListResponse] = kwargs.pop("cls", None)

        _request = build_restaurants_api_get_reviews_request(
            restaurant_id=restaurant_id,
            query=query,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.RestaurantReviewListResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def create_review(
        self,
        restaurant_id: str,
        body: _models.CreateRestaurantReviewRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateRestaurantReviewResponse:
        """create_review.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.CreateRestaurantReviewRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateRestaurantReviewResponse. The CreateRestaurantReviewResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantReviewResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_review(
        self,
        restaurant_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateRestaurantReviewResponse:
        """create_review.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateRestaurantReviewResponse. The CreateRestaurantReviewResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantReviewResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_review(
        self,
        restaurant_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateRestaurantReviewResponse:
        """create_review.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateRestaurantReviewResponse. The CreateRestaurantReviewResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantReviewResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def create_review(
        self,
        restaurant_id: str,
        body: Union[_models.CreateRestaurantReviewRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.CreateRestaurantReviewResponse:
        """create_review.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Is one of the following types: CreateRestaurantReviewRequest, JSON, IO[bytes]
         Required.
        :type body: ~restaurantbookingapi.models.CreateRestaurantReviewRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: CreateRestaurantReviewResponse. The CreateRestaurantReviewResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantReviewResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.CreateRestaurantReviewResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_restaurants_api_create_review_request(
            restaurant_id=restaurant_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [201]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.CreateRestaurantReviewResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def update_review(
        self,
        restaurant_id: str,
        review_id: str,
        body: _models.UpdateRestaurantReviewRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantReviewResponse:
        """update_review.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param review_id: Required.
        :type review_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.UpdateRestaurantReviewRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantReviewResponse. The RestaurantReviewResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantReviewResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_review(
        self,
        restaurant_id: str,
        review_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantReviewResponse:
        """update_review.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param review_id: Required.
        :type review_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantReviewResponse. The RestaurantReviewResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantReviewResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_review(
        self,
        restaurant_id: str,
        review_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantReviewResponse:
        """update_review.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param review_id: Required.
        :type review_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantReviewResponse. The RestaurantReviewResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantReviewResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def update_review(
        self,
        restaurant_id: str,
        review_id: str,
        body: Union[_models.UpdateRestaurantReviewRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.RestaurantReviewResponse:
        """update_review.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param review_id: Required.
        :type review_id: str
        :param body: Is one of the following types: UpdateRestaurantReviewRequest, JSON, IO[bytes]
         Required.
        :type body: ~restaurantbookingapi.models.UpdateRestaurantReviewRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: RestaurantReviewResponse. The RestaurantReviewResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantReviewResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.RestaurantReviewResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_restaurants_api_update_review_request(
            restaurant_id=restaurant_id,
            review_id=review_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.RestaurantReviewResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    def get_availability(
        self, restaurant_id: str, *, query: _models.RestaurantAvailabilityQuery, **kwargs: Any
    ) -> _models.RestaurantAvailabilityResponse:
        """get_availability.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :keyword query: Required.
        :paramtype query: ~restaurantbookingapi.models.RestaurantAvailabilityQuery
        :return: RestaurantAvailabilityResponse. The RestaurantAvailabilityResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantAvailabilityResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.RestaurantAvailabilityResponse] = kwargs.pop("cls", None)

        _request = build_restaurants_api_get_availability_request(
            restaurant_id=restaurant_id,
            query=query,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.RestaurantAvailabilityResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore


class ReservationsApiOperations:
    """
    .. warning::
        **DO NOT** instantiate this class directly.

        Instead, you should access the following operations through
        :class:`~restaurantbookingapi.RestaurantBookingApiClient`'s
        :attr:`reservations_api` attribute.
    """

    def __init__(self, *args, **kwargs) -> None:
        input_args = list(args)
        self._client: PipelineClient = input_args.pop(0) if input_args else kwargs.pop("client")
        self._config: RestaurantBookingApiClientConfiguration = (
            input_args.pop(0) if input_args else kwargs.pop("config")
        )
        self._serialize: Serializer = input_args.pop(0) if input_args else kwargs.pop("serializer")
        self._deserialize: Deserializer = input_args.pop(0) if input_args else kwargs.pop("deserializer")

    def list(
        self, *, authorization: str, query: Optional[_models.ReservationListQuery] = None, **kwargs: Any
    ) -> _models.ReservationListResponse:
        """list.

        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword query: Default value is None.
        :paramtype query: ~restaurantbookingapi.models.ReservationListQuery
        :return: ReservationListResponse. The ReservationListResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationListResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.ReservationListResponse] = kwargs.pop("cls", None)

        _request = build_reservations_api_list_request(
            authorization=authorization,
            query=query,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.ReservationListResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def create(
        self,
        body: _models.CreateReservationRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateReservationResponse:
        """create.

        :param body: Required.
        :type body: ~restaurantbookingapi.models.CreateReservationRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateReservationResponse. The CreateReservationResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create(
        self, body: JSON, *, authorization: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.CreateReservationResponse:
        """create.

        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateReservationResponse. The CreateReservationResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create(
        self, body: IO[bytes], *, authorization: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.CreateReservationResponse:
        """create.

        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateReservationResponse. The CreateReservationResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def create(
        self, body: Union[_models.CreateReservationRequest, JSON, IO[bytes]], *, authorization: str, **kwargs: Any
    ) -> _models.CreateReservationResponse:
        """create.

        :param body: Is one of the following types: CreateReservationRequest, JSON, IO[bytes] Required.
        :type body: ~restaurantbookingapi.models.CreateReservationRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: CreateReservationResponse. The CreateReservationResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.CreateReservationResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_reservations_api_create_request(
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [201]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.CreateReservationResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    def get_by_id(self, reservation_id: str, *, authorization: str, **kwargs: Any) -> _models.ReservationResponse:
        """get_by_id.

        :param reservation_id: Required.
        :type reservation_id: str
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls: ClsType[_models.ReservationResponse] = kwargs.pop("cls", None)

        _request = build_reservations_api_get_by_id_request(
            reservation_id=reservation_id,
            authorization=authorization,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.ReservationResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def update(
        self,
        reservation_id: str,
        body: _models.UpdateReservationRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.ReservationResponse:
        """update.

        :param reservation_id: Required.
        :type reservation_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.UpdateReservationRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update(
        self,
        reservation_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.ReservationResponse:
        """update.

        :param reservation_id: Required.
        :type reservation_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update(
        self,
        reservation_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.ReservationResponse:
        """update.

        :param reservation_id: Required.
        :type reservation_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def update(
        self,
        reservation_id: str,
        body: Union[_models.UpdateReservationRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.ReservationResponse:
        """update.

        :param reservation_id: Required.
        :type reservation_id: str
        :param body: Is one of the following types: UpdateReservationRequest, JSON, IO[bytes] Required.
        :type body: ~restaurantbookingapi.models.UpdateReservationRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.ReservationResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_reservations_api_update_request(
            reservation_id=reservation_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.ReservationResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def cancel(
        self,
        reservation_id: str,
        body: _models.CancelReservationRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.ReservationResponse:
        """cancel.

        :param reservation_id: Required.
        :type reservation_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.CancelReservationRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def cancel(
        self,
        reservation_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.ReservationResponse:
        """cancel.

        :param reservation_id: Required.
        :type reservation_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def cancel(
        self,
        reservation_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.ReservationResponse:
        """cancel.

        :param reservation_id: Required.
        :type reservation_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def cancel(
        self,
        reservation_id: str,
        body: Union[_models.CancelReservationRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.ReservationResponse:
        """cancel.

        :param reservation_id: Required.
        :type reservation_id: str
        :param body: Is one of the following types: CancelReservationRequest, JSON, IO[bytes] Required.
        :type body: ~restaurantbookingapi.models.CancelReservationRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.ReservationResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_reservations_api_cancel_request(
            reservation_id=reservation_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.ReservationResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore


class AdminApiOperations:
    """
    .. warning::
        **DO NOT** instantiate this class directly.

        Instead, you should access the following operations through
        :class:`~restaurantbookingapi.RestaurantBookingApiClient`'s
        :attr:`admin_api` attribute.
    """

    def __init__(self, *args, **kwargs) -> None:
        input_args = list(args)
        self._client: PipelineClient = input_args.pop(0) if input_args else kwargs.pop("client")
        self._config: RestaurantBookingApiClientConfiguration = (
            input_args.pop(0) if input_args else kwargs.pop("config")
        )
        self._serialize: Serializer = input_args.pop(0) if input_args else kwargs.pop("serializer")
        self._deserialize: Deserializer = input_args.pop(0) if input_args else kwargs.pop("deserializer")

    @overload
    def create_location(
        self,
        body: _models.CreateLocationRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateLocationResponse:
        """create_location.

        :param body: Required.
        :type body: ~restaurantbookingapi.models.CreateLocationRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateLocationResponse. The CreateLocationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateLocationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_location(
        self, body: JSON, *, authorization: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.CreateLocationResponse:
        """create_location.

        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateLocationResponse. The CreateLocationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateLocationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_location(
        self, body: IO[bytes], *, authorization: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.CreateLocationResponse:
        """create_location.

        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateLocationResponse. The CreateLocationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateLocationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def create_location(
        self, body: Union[_models.CreateLocationRequest, JSON, IO[bytes]], *, authorization: str, **kwargs: Any
    ) -> _models.CreateLocationResponse:
        """create_location.

        :param body: Is one of the following types: CreateLocationRequest, JSON, IO[bytes] Required.
        :type body: ~restaurantbookingapi.models.CreateLocationRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: CreateLocationResponse. The CreateLocationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateLocationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            404: ResourceNotFoundError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.CreateLocationResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_create_location_request(
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [201]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.CreateLocationResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def update_location(
        self,
        location_id: str,
        body: _models.UpdateLocationRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.LocationResponse:
        """update_location.

        :param location_id: Required.
        :type location_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.UpdateLocationRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: LocationResponse. The LocationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.LocationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_location(
        self, location_id: str, body: JSON, *, authorization: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.LocationResponse:
        """update_location.

        :param location_id: Required.
        :type location_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: LocationResponse. The LocationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.LocationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_location(
        self,
        location_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.LocationResponse:
        """update_location.

        :param location_id: Required.
        :type location_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: LocationResponse. The LocationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.LocationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def update_location(
        self,
        location_id: str,
        body: Union[_models.UpdateLocationRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.LocationResponse:
        """update_location.

        :param location_id: Required.
        :type location_id: str
        :param body: Is one of the following types: UpdateLocationRequest, JSON, IO[bytes] Required.
        :type body: ~restaurantbookingapi.models.UpdateLocationRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: LocationResponse. The LocationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.LocationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.LocationResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_update_location_request(
            location_id=location_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.LocationResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def create_restaurant(
        self,
        body: _models.CreateRestaurantRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateRestaurantResponse:
        """create_restaurant.

        :param body: Required.
        :type body: ~restaurantbookingapi.models.CreateRestaurantRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateRestaurantResponse. The CreateRestaurantResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_restaurant(
        self, body: JSON, *, authorization: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.CreateRestaurantResponse:
        """create_restaurant.

        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateRestaurantResponse. The CreateRestaurantResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_restaurant(
        self, body: IO[bytes], *, authorization: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.CreateRestaurantResponse:
        """create_restaurant.

        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateRestaurantResponse. The CreateRestaurantResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def create_restaurant(
        self, body: Union[_models.CreateRestaurantRequest, JSON, IO[bytes]], *, authorization: str, **kwargs: Any
    ) -> _models.CreateRestaurantResponse:
        """create_restaurant.

        :param body: Is one of the following types: CreateRestaurantRequest, JSON, IO[bytes] Required.
        :type body: ~restaurantbookingapi.models.CreateRestaurantRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: CreateRestaurantResponse. The CreateRestaurantResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            404: ResourceNotFoundError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.CreateRestaurantResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_create_restaurant_request(
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [201]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.CreateRestaurantResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def update_restaurant(
        self,
        restaurant_id: str,
        body: _models.UpdateRestaurantRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantDetailResponse:
        """update_restaurant.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.UpdateRestaurantRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantDetailResponse. The RestaurantDetailResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantDetailResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_restaurant(
        self,
        restaurant_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantDetailResponse:
        """update_restaurant.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantDetailResponse. The RestaurantDetailResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantDetailResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_restaurant(
        self,
        restaurant_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantDetailResponse:
        """update_restaurant.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantDetailResponse. The RestaurantDetailResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantDetailResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def update_restaurant(
        self,
        restaurant_id: str,
        body: Union[_models.UpdateRestaurantRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.RestaurantDetailResponse:
        """update_restaurant.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Is one of the following types: UpdateRestaurantRequest, JSON, IO[bytes] Required.
        :type body: ~restaurantbookingapi.models.UpdateRestaurantRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: RestaurantDetailResponse. The RestaurantDetailResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantDetailResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.RestaurantDetailResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_update_restaurant_request(
            restaurant_id=restaurant_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.RestaurantDetailResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def update_restaurant_publication(
        self,
        restaurant_id: str,
        body: _models.UpdateRestaurantPublicationRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantDetailResponse:
        """update_restaurant_publication.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.UpdateRestaurantPublicationRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantDetailResponse. The RestaurantDetailResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantDetailResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_restaurant_publication(
        self,
        restaurant_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantDetailResponse:
        """update_restaurant_publication.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantDetailResponse. The RestaurantDetailResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantDetailResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_restaurant_publication(
        self,
        restaurant_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantDetailResponse:
        """update_restaurant_publication.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantDetailResponse. The RestaurantDetailResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantDetailResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def update_restaurant_publication(
        self,
        restaurant_id: str,
        body: Union[_models.UpdateRestaurantPublicationRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.RestaurantDetailResponse:
        """update_restaurant_publication.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Is one of the following types: UpdateRestaurantPublicationRequest, JSON, IO[bytes]
         Required.
        :type body: ~restaurantbookingapi.models.UpdateRestaurantPublicationRequest or JSON or
         IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: RestaurantDetailResponse. The RestaurantDetailResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantDetailResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.RestaurantDetailResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_update_restaurant_publication_request(
            restaurant_id=restaurant_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.RestaurantDetailResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def create_table(
        self,
        restaurant_id: str,
        body: _models.CreateRestaurantTableRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateRestaurantTableResponse:
        """create_table.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.CreateRestaurantTableRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateRestaurantTableResponse. The CreateRestaurantTableResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantTableResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_table(
        self,
        restaurant_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateRestaurantTableResponse:
        """create_table.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateRestaurantTableResponse. The CreateRestaurantTableResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantTableResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_table(
        self,
        restaurant_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateRestaurantTableResponse:
        """create_table.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateRestaurantTableResponse. The CreateRestaurantTableResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantTableResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def create_table(
        self,
        restaurant_id: str,
        body: Union[_models.CreateRestaurantTableRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.CreateRestaurantTableResponse:
        """create_table.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Is one of the following types: CreateRestaurantTableRequest, JSON, IO[bytes]
         Required.
        :type body: ~restaurantbookingapi.models.CreateRestaurantTableRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: CreateRestaurantTableResponse. The CreateRestaurantTableResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantTableResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.CreateRestaurantTableResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_create_table_request(
            restaurant_id=restaurant_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [201]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.CreateRestaurantTableResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def update_table(
        self,
        table_id: str,
        body: _models.UpdateRestaurantTableRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantTableResponse:
        """update_table.

        :param table_id: Required.
        :type table_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.UpdateRestaurantTableRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantTableResponse. The RestaurantTableResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantTableResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_table(
        self, table_id: str, body: JSON, *, authorization: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.RestaurantTableResponse:
        """update_table.

        :param table_id: Required.
        :type table_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantTableResponse. The RestaurantTableResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantTableResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_table(
        self,
        table_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantTableResponse:
        """update_table.

        :param table_id: Required.
        :type table_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantTableResponse. The RestaurantTableResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantTableResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def update_table(
        self,
        table_id: str,
        body: Union[_models.UpdateRestaurantTableRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.RestaurantTableResponse:
        """update_table.

        :param table_id: Required.
        :type table_id: str
        :param body: Is one of the following types: UpdateRestaurantTableRequest, JSON, IO[bytes]
         Required.
        :type body: ~restaurantbookingapi.models.UpdateRestaurantTableRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: RestaurantTableResponse. The RestaurantTableResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantTableResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.RestaurantTableResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_update_table_request(
            table_id=table_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.RestaurantTableResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def create_menu_category(
        self,
        restaurant_id: str,
        body: _models.CreateMenuCategoryRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateMenuCategoryResponse:
        """create_menu_category.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.CreateMenuCategoryRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateMenuCategoryResponse. The CreateMenuCategoryResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateMenuCategoryResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_menu_category(
        self,
        restaurant_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateMenuCategoryResponse:
        """create_menu_category.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateMenuCategoryResponse. The CreateMenuCategoryResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateMenuCategoryResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_menu_category(
        self,
        restaurant_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateMenuCategoryResponse:
        """create_menu_category.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateMenuCategoryResponse. The CreateMenuCategoryResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateMenuCategoryResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def create_menu_category(
        self,
        restaurant_id: str,
        body: Union[_models.CreateMenuCategoryRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.CreateMenuCategoryResponse:
        """create_menu_category.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Is one of the following types: CreateMenuCategoryRequest, JSON, IO[bytes]
         Required.
        :type body: ~restaurantbookingapi.models.CreateMenuCategoryRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: CreateMenuCategoryResponse. The CreateMenuCategoryResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateMenuCategoryResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.CreateMenuCategoryResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_create_menu_category_request(
            restaurant_id=restaurant_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [201]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.CreateMenuCategoryResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def update_menu_category(
        self,
        menu_category_id: str,
        body: _models.UpdateMenuCategoryRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.MenuCategoryResponse:
        """update_menu_category.

        :param menu_category_id: Required.
        :type menu_category_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.UpdateMenuCategoryRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: MenuCategoryResponse. The MenuCategoryResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.MenuCategoryResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_menu_category(
        self,
        menu_category_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.MenuCategoryResponse:
        """update_menu_category.

        :param menu_category_id: Required.
        :type menu_category_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: MenuCategoryResponse. The MenuCategoryResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.MenuCategoryResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_menu_category(
        self,
        menu_category_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.MenuCategoryResponse:
        """update_menu_category.

        :param menu_category_id: Required.
        :type menu_category_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: MenuCategoryResponse. The MenuCategoryResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.MenuCategoryResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def update_menu_category(
        self,
        menu_category_id: str,
        body: Union[_models.UpdateMenuCategoryRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.MenuCategoryResponse:
        """update_menu_category.

        :param menu_category_id: Required.
        :type menu_category_id: str
        :param body: Is one of the following types: UpdateMenuCategoryRequest, JSON, IO[bytes]
         Required.
        :type body: ~restaurantbookingapi.models.UpdateMenuCategoryRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: MenuCategoryResponse. The MenuCategoryResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.MenuCategoryResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.MenuCategoryResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_update_menu_category_request(
            menu_category_id=menu_category_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.MenuCategoryResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def create_menu_item(
        self,
        menu_category_id: str,
        body: _models.CreateMenuItemRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateMenuItemResponse:
        """create_menu_item.

        :param menu_category_id: Required.
        :type menu_category_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.CreateMenuItemRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateMenuItemResponse. The CreateMenuItemResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateMenuItemResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_menu_item(
        self,
        menu_category_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateMenuItemResponse:
        """create_menu_item.

        :param menu_category_id: Required.
        :type menu_category_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateMenuItemResponse. The CreateMenuItemResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateMenuItemResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_menu_item(
        self,
        menu_category_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateMenuItemResponse:
        """create_menu_item.

        :param menu_category_id: Required.
        :type menu_category_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateMenuItemResponse. The CreateMenuItemResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateMenuItemResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def create_menu_item(
        self,
        menu_category_id: str,
        body: Union[_models.CreateMenuItemRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.CreateMenuItemResponse:
        """create_menu_item.

        :param menu_category_id: Required.
        :type menu_category_id: str
        :param body: Is one of the following types: CreateMenuItemRequest, JSON, IO[bytes] Required.
        :type body: ~restaurantbookingapi.models.CreateMenuItemRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: CreateMenuItemResponse. The CreateMenuItemResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateMenuItemResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.CreateMenuItemResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_create_menu_item_request(
            menu_category_id=menu_category_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [201]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.CreateMenuItemResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def update_menu_item(
        self,
        menu_item_id: str,
        body: _models.UpdateMenuItemRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.MenuItemResponse:
        """update_menu_item.

        :param menu_item_id: Required.
        :type menu_item_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.UpdateMenuItemRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: MenuItemResponse. The MenuItemResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.MenuItemResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_menu_item(
        self,
        menu_item_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.MenuItemResponse:
        """update_menu_item.

        :param menu_item_id: Required.
        :type menu_item_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: MenuItemResponse. The MenuItemResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.MenuItemResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_menu_item(
        self,
        menu_item_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.MenuItemResponse:
        """update_menu_item.

        :param menu_item_id: Required.
        :type menu_item_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: MenuItemResponse. The MenuItemResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.MenuItemResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def update_menu_item(
        self,
        menu_item_id: str,
        body: Union[_models.UpdateMenuItemRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.MenuItemResponse:
        """update_menu_item.

        :param menu_item_id: Required.
        :type menu_item_id: str
        :param body: Is one of the following types: UpdateMenuItemRequest, JSON, IO[bytes] Required.
        :type body: ~restaurantbookingapi.models.UpdateMenuItemRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: MenuItemResponse. The MenuItemResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.MenuItemResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.MenuItemResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_update_menu_item_request(
            menu_item_id=menu_item_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.MenuItemResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def create_photo(
        self,
        restaurant_id: str,
        body: _models.CreateRestaurantPhotoRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateRestaurantPhotoResponse:
        """create_photo.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.CreateRestaurantPhotoRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateRestaurantPhotoResponse. The CreateRestaurantPhotoResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantPhotoResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_photo(
        self,
        restaurant_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateRestaurantPhotoResponse:
        """create_photo.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateRestaurantPhotoResponse. The CreateRestaurantPhotoResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantPhotoResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def create_photo(
        self,
        restaurant_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.CreateRestaurantPhotoResponse:
        """create_photo.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: CreateRestaurantPhotoResponse. The CreateRestaurantPhotoResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantPhotoResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def create_photo(
        self,
        restaurant_id: str,
        body: Union[_models.CreateRestaurantPhotoRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.CreateRestaurantPhotoResponse:
        """create_photo.

        :param restaurant_id: Required.
        :type restaurant_id: str
        :param body: Is one of the following types: CreateRestaurantPhotoRequest, JSON, IO[bytes]
         Required.
        :type body: ~restaurantbookingapi.models.CreateRestaurantPhotoRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: CreateRestaurantPhotoResponse. The CreateRestaurantPhotoResponse is compatible with
         MutableMapping
        :rtype: ~restaurantbookingapi.models.CreateRestaurantPhotoResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.CreateRestaurantPhotoResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_create_photo_request(
            restaurant_id=restaurant_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [201]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.CreateRestaurantPhotoResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def update_photo(
        self,
        photo_id: str,
        body: _models.UpdateRestaurantPhotoRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantPhotoResponse:
        """update_photo.

        :param photo_id: Required.
        :type photo_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.UpdateRestaurantPhotoRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantPhotoResponse. The RestaurantPhotoResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantPhotoResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_photo(
        self, photo_id: str, body: JSON, *, authorization: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.RestaurantPhotoResponse:
        """update_photo.

        :param photo_id: Required.
        :type photo_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantPhotoResponse. The RestaurantPhotoResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantPhotoResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_photo(
        self,
        photo_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.RestaurantPhotoResponse:
        """update_photo.

        :param photo_id: Required.
        :type photo_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: RestaurantPhotoResponse. The RestaurantPhotoResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantPhotoResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def update_photo(
        self,
        photo_id: str,
        body: Union[_models.UpdateRestaurantPhotoRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.RestaurantPhotoResponse:
        """update_photo.

        :param photo_id: Required.
        :type photo_id: str
        :param body: Is one of the following types: UpdateRestaurantPhotoRequest, JSON, IO[bytes]
         Required.
        :type body: ~restaurantbookingapi.models.UpdateRestaurantPhotoRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: RestaurantPhotoResponse. The RestaurantPhotoResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.RestaurantPhotoResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.RestaurantPhotoResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_update_photo_request(
            photo_id=photo_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.RestaurantPhotoResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    def update_reservation_status(
        self,
        reservation_id: str,
        body: _models.UpdateReservationStatusRequest,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.ReservationResponse:
        """update_reservation_status.

        :param reservation_id: Required.
        :type reservation_id: str
        :param body: Required.
        :type body: ~restaurantbookingapi.models.UpdateReservationStatusRequest
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_reservation_status(
        self,
        reservation_id: str,
        body: JSON,
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.ReservationResponse:
        """update_reservation_status.

        :param reservation_id: Required.
        :type reservation_id: str
        :param body: Required.
        :type body: JSON
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    def update_reservation_status(
        self,
        reservation_id: str,
        body: IO[bytes],
        *,
        authorization: str,
        content_type: str = "application/json",
        **kwargs: Any,
    ) -> _models.ReservationResponse:
        """update_reservation_status.

        :param reservation_id: Required.
        :type reservation_id: str
        :param body: Required.
        :type body: IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    def update_reservation_status(
        self,
        reservation_id: str,
        body: Union[_models.UpdateReservationStatusRequest, JSON, IO[bytes]],
        *,
        authorization: str,
        **kwargs: Any,
    ) -> _models.ReservationResponse:
        """update_reservation_status.

        :param reservation_id: Required.
        :type reservation_id: str
        :param body: Is one of the following types: UpdateReservationStatusRequest, JSON, IO[bytes]
         Required.
        :type body: ~restaurantbookingapi.models.UpdateReservationStatusRequest or JSON or IO[bytes]
        :keyword authorization: Required.
        :paramtype authorization: str
        :return: ReservationResponse. The ReservationResponse is compatible with MutableMapping
        :rtype: ~restaurantbookingapi.models.ReservationResponse
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.ReservationResponse] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_admin_api_update_reservation_status_request(
            reservation_id=reservation_id,
            authorization=authorization,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = None
            if response.status_code == 401:
                error = _failsafe_deserialize(_models.UnauthorizedError, response.json())
                raise ClientAuthenticationError(response=response, model=error)
            if response.status_code == 403:
                error = _failsafe_deserialize(_models.ForbiddenError, response.json())
            elif response.status_code == 404:
                error = _failsafe_deserialize(_models.NotFoundError, response.json())
                raise ResourceNotFoundError(response=response, model=error)
            if response.status_code == 409:
                error = _failsafe_deserialize(_models.ConflictError, response.json())
                raise ResourceExistsError(response=response, model=error)
            if response.status_code == 422:
                error = _failsafe_deserialize(_models.ValidationError, response.json())
            elif response.status_code == 500:
                error = _failsafe_deserialize(_models.ServerError, response.json())
            raise HttpResponseError(response=response, model=error)

        if _stream:
            deserialized = response.iter_bytes()
        else:
            deserialized = _deserialize(_models.ReservationResponse, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

# coding=utf-8

from enum import Enum
from corehttp.utils import CaseInsensitiveEnumMeta


class PriceCategory(str, Enum, metaclass=CaseInsensitiveEnumMeta):
    """Type of PriceCategory."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ReservationStatus(str, Enum, metaclass=CaseInsensitiveEnumMeta):
    """Type of ReservationStatus."""

    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class UserRole(str, Enum, metaclass=CaseInsensitiveEnumMeta):
    """Type of UserRole."""

    ADMIN = "ADMIN"
    USER = "USER"

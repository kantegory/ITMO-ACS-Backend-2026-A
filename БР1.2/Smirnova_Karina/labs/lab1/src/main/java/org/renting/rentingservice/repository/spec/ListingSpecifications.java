package org.renting.rentingservice.repository.spec;

import jakarta.persistence.criteria.*;
import org.renting.rentingservice.domain.entity.*;
import org.renting.rentingservice.domain.enums.BookingStatus;
import org.renting.rentingservice.domain.enums.HouseType;
import org.renting.rentingservice.domain.enums.RentMode;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;

public final class ListingSpecifications {

    private ListingSpecifications() {
    }

    public static Specification<ListingEntity> activeOnly() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }

    public static Specification<ListingEntity> rentMode(RentMode rentMode) {
        return (root, query, cb) ->
                rentMode == null ? cb.conjunction() : cb.equal(root.get("rentMode"), rentMode);
    }

    public static Specification<ListingEntity> houseType(HouseType houseType) {
        return (root, query, cb) ->
                houseType == null ? cb.conjunction() : cb.equal(root.get("houseType"), houseType);
    }

    public static Specification<ListingEntity> priceRange(RentMode rentMode, BigDecimal priceMin, BigDecimal priceMax) {
        return (root, query, cb) -> {
            if (priceMin == null && priceMax == null) {
                return cb.conjunction();
            }
            if (rentMode == RentMode.DAILY) {
                Join<ListingEntity, ListingDailyEntity> daily = root.join("daily", JoinType.INNER);
                Predicate p = cb.conjunction();
                if (priceMin != null) {
                    p = cb.and(p, cb.ge(daily.get("pricePerNight"), priceMin));
                }
                if (priceMax != null) {
                    p = cb.and(p, cb.le(daily.get("pricePerNight"), priceMax));
                }
                return p;
            }
            if (rentMode == RentMode.MONTHLY) {
                Join<ListingEntity, ListingMonthlyEntity> monthly = root.join("monthly", JoinType.INNER);
                Predicate p = cb.conjunction();
                if (priceMin != null) {
                    p = cb.and(p, cb.ge(monthly.get("pricePerMonth"), priceMin));
                }
                if (priceMax != null) {
                    p = cb.and(p, cb.le(monthly.get("pricePerMonth"), priceMax));
                }
                return p;
            }
            return cb.conjunction();
        };
    }

    public static Specification<ListingEntity> availableBetween(LocalDate startDate, LocalDate endDate) {
        return (root, query, cb) -> {
            if (startDate == null || endDate == null) {
                return cb.conjunction();
            }
            query.distinct(true);
            Subquery<Long> sub = query.subquery(Long.class);
            Root<BookingEntity> bookingRoot = sub.from(BookingEntity.class);
            sub.select(bookingRoot.get("listing").get("id"));
            sub.where(
                    cb.equal(bookingRoot.get("listing"), root),
                    bookingRoot.get("status").in(Arrays.asList(BookingStatus.PENDING, BookingStatus.ACCEPTED)),
                    cb.lessThan(bookingRoot.get("startDate"), endDate),
                    cb.greaterThan(bookingRoot.get("endDate"), startDate)
            );
            return cb.not(root.get("id").in(sub));
        };
    }

    public static Specification<ListingEntity> withinRadius(double lat, double lng, double radiusKm) {
        return (root, query, cb) -> {
            if (radiusKm <= 0) {
                return cb.conjunction();
            }
            double radiusMeters = radiusKm * 1000.0;
            return cb.isTrue(
                    cb.function(
                            "ST_DWithin",
                            Boolean.class,
                            root.get("location"),
                            cb.function(
                                    "ST_SetSRID",
                                    Object.class,
                                    cb.function("ST_MakePoint", Object.class, cb.literal(lng), cb.literal(lat)),
                                    cb.literal(4326)
                            ),
                            cb.literal(radiusMeters)
                    )
            );
        };
    }
}

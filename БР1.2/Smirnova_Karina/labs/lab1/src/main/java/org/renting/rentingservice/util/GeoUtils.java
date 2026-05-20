package org.renting.rentingservice.util;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

public final class GeoUtils {

    private static final GeometryFactory GEOMETRY_FACTORY =
            new GeometryFactory(new PrecisionModel(), 4326);

    private GeoUtils() {
    }

    public static Point point(double lat, double lng) {
        return GEOMETRY_FACTORY.createPoint(new Coordinate(lng, lat));
    }

    public static Double latitude(Point point) {
        return point == null ? null : point.getY();
    }

    public static Double longitude(Point point) {
        return point == null ? null : point.getX();
    }
}

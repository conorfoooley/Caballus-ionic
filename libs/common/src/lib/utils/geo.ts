import { GeoPoint } from "../models/base/geo-point";

export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Gets the bounding rectangle for a given polygon with no padding added
 *
 * @param polygon one or more disjoint polygons for which the bounding box will
 * encase.
 * @param throwError
 */
export function getBoundingRectangle(polygon: GeoPoint[], throwError: boolean = true): Rectangle {
    if (polygon.length === 0 && throwError) {
        throw new Error('Invalid path: zero sized');
    }

    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;

    for (const { latitude, longitude } of polygon) {
        if (left > latitude) {
            left = latitude;
        }
        if (top > longitude) {
            top = longitude;
        }
        if (right < latitude) {
            right = latitude;
        }
        if (bottom < longitude) {
            bottom = longitude;
        }
    }

    return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
    };
}

/**
 * Gets the centerpoint of a polygon
 *
 * If the polygon is drawn on a 2d plane, this is the point that would appear
 * to be roughly in the center of the region.
 */
export function getCenterpoint(polygon: GeoPoint[], throwError: boolean = true): GeoPoint {
    // Just taking the center of the bounding rectangle for now. A proper
    // centroid would require significantly more math. Since this is all for
    // user-presentation purposes, the extra accuracy likely won't make much of
    // a difference.

    const boundingRectangle = getBoundingRectangle(polygon, throwError);
    const centerX = boundingRectangle.x + boundingRectangle.width / 2;
    const centerY = boundingRectangle.y + boundingRectangle.height / 2;

    return new GeoPoint({
        latitude: centerX,
        longitude: centerY
    });
}

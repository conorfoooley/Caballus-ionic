import { MongoGeoPoint } from './mongo-geo-point';
import { immerable } from 'immer';

/**
 * Latitude and longitude that is congruent with the interface provided by
 * Google Maps server-side APIs
 */
interface LatLng {
    lat: number;
    lng: number;
}

const MAX_LONGITUDE = 180;
const MIN_LONGITUDE = -180;
const MAX_LATITUDE = 90;
const MIN_LATITUDE = -90;

export class GeoPoint {
    public static [immerable] = true;

    public longitude: number;
    public latitude: number;
    public altitude: number;

    constructor(params?: Partial<GeoPoint>) {
        if (params) {
            this.longitude = typeof params.longitude === 'number' &&
                params.longitude >= MIN_LONGITUDE && params.longitude <= MAX_LONGITUDE
                    ? params.longitude
                    : this.longitude;
            this.latitude = typeof params.latitude === 'number' &&
                params.latitude >= MIN_LATITUDE && params.latitude <= MAX_LATITUDE
                    ? params.latitude
                    : this.latitude;
            this.altitude = typeof params.altitude === 'number'
                ? params.altitude
                : this.altitude;
        }
    }

    public toMongoGeoPoint(): MongoGeoPoint {
        return new MongoGeoPoint({coordinates: [this.longitude, this.latitude]});
    }

    public toLatLng(): LatLng {
        return { lat: this.latitude, lng: this.longitude };
    }

    public toString(): string {
        if (!this.latitude || !this.longitude) {
            throw new Error('Invalid GeoPoint');
        }

        return `${this.latitude},${this.longitude}`;
    }

    public static fromLatLng(source: LatLng, altitude = 0): GeoPoint {
        return new GeoPoint({
            latitude: source.lat,
            longitude: source.lng,
            altitude
        });
    }
}

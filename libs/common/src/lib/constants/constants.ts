import { BehaviorSubject } from 'rxjs';

export const THOUSAND = 1000;

export const RIDE_POSITION_INTERVAL_MILLISEC = 3000;
export const MAX_CHARS = 250;
export const EARTH_RADIUS_KILOMETERS = 6371.071;
// Temporary non-const to allow real-time modification for testing
export const RIDE_POSITION_DISTANCE_FILTER_METERS = 1;
export const RIDE_POSITION_MINIMUM_ACCURACY_METERS = 50;
export const RIDE_POSITION_DISTANCE_FILTER_METERS$ = new BehaviorSubject(
    RIDE_POSITION_DISTANCE_FILTER_METERS
);
export const RIDE_POSITION_MINIMUM_ACCURACY_METERS$ = new BehaviorSubject(
    RIDE_POSITION_MINIMUM_ACCURACY_METERS
);
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = SECONDS_PER_MINUTE * MS_PER_SECOND;
export const MS_PER_HOUR = MINUTES_PER_HOUR * MS_PER_MINUTE;
export const KM_PER_MILE = 1.60934;
export const MILE_PER_METER = KM_PER_MILE * THOUSAND;
export const M_TO_FT = 3.28084;
export const MAX_PINNED_IMAGES = 5;
export const BLUE_COLOR = 'rgb(64, 119, 255)';
export const BLUE_COLOR_ALPHA = 'rgba(64, 119, 255, 0.8)';
export const RED_COLOR = 'rgb(239,37,37)';
export const RED_COLOR_ALPHA = 'rgba(239,37,37,0.3)';
// JWPlayer gives options of 40, 120, 320, and up
export const THUMBNAIL_PIXEL_DIMENSIONS = 120;
export const PHONE_VALIDATION_PATTERN = '^((\\+91-?)|0)?[0-9]{10}$';
export const BYTES_PER_MB = 1048576;
export const HANDS_TO_METER = 0.1016;
export const LBS_TO_KG = 0.45359237;
export const METER_TO_HANDS = 9.84252;
export const KG_TO_LBS = 2.20462;
export const WEB_APP_VERSION = '1.0.0';
export const RIDE_HISTORY_DEFAULT_FETCH_LIMIT = 5;
export const MINIMUM_RIDE_DURATION = 30000;
export const FILE_UPLOAD_CHUNK_SIZE: number = 10485760 // 10 MB;
export const ENABLE_VERIFIED_ACCOUNT_GATE = false;
export const EVALUATION_LOCK_TIME_IN_HOUR = 72;

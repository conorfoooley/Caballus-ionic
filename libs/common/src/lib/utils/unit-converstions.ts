import {
    KM_PER_MILE,
    M_TO_FT,
    MINUTES_PER_HOUR,
    BYTES_PER_MB,
    HANDS_TO_METER,
    LBS_TO_KG,
    KG_TO_LBS,
    METER_TO_HANDS,
    MILE_PER_METER
} from '../constants';

export function kilometersToMiles(k: number): number {
    return k / KM_PER_MILE;
}

export function metersToFeet(meters: number): number {
    return meters * M_TO_FT;
}

export function minutesToHours(m: number): number {
    return m / MINUTES_PER_HOUR;
}

export function bytesToMB(bytes: number): number {
    return bytes / BYTES_PER_MB;
}

export function milesToKilometers(k: number): number {
    return k * KM_PER_MILE;
}

export function milesToMeters(m: number): number {
    return m * MILE_PER_METER;
}

export function handsToMeter(h: number): number {
    return h * HANDS_TO_METER;
}

export function lbsToKg(l: number): number {
    return l * LBS_TO_KG;
}

export function meterToHands(m: number): number {
    return m * METER_TO_HANDS;
}

export function kgToLbs(l: number): number {
    return l * KG_TO_LBS;
}

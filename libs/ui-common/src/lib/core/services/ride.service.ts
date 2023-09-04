import { Injectable } from "@angular/core";
import {
  Body,
  Delete,
  Get,
  HttpService,
  Patch,
  Path,
  Post,
} from "@rfx/ngx-http";
import { from, Observable, switchMap } from "rxjs";
import { Gait, RideCategory } from "../enums";
import { Ride, RideGaitMetrics, RidePath } from "../models";
import {
  flatMap,
  GaitNumbers,
  getBoundingRectangle
  } from "@caballus/common";
import * as jsonToFormData from "json-form-data";
import { tap } from "rxjs/operators";

interface StartRideDto {
  _id: string;
  startDateTime: Date;
  horseIds: string[];
}

interface EndRideDto {
  _id: string;
  endDateTime: Date;
  startDateTime: Date;
  horseIds: string[];
}

interface PathDto {
  startDateTime: Date;
  endDateTime: Date;
  wayPoints: WayPointDto[];
}

interface WayPointDto {
  timestamp: Date;
  longitude: number;
  latitude: number;
}

interface GaitMetricDto {
  gait: Gait;
  metric: number;
}

interface RideGaitMetricsDto {
  horseId: string;
  metrics: GaitMetricDto[];
}

interface RideDetailsDto {
  distanceKilometers: number;
  category: RideCategory;
  notes?: string;
  paths: PathDto[];
  calculatedGaitMinutes: RideGaitMetricsDto[];
  manualGaitMinutes: RideGaitMetricsDto[];
  calculatedGaitKilometers: RideGaitMetricsDto[];
  _id: string;
  endDateTime?: Date;
  startDateTime?: Date;
  horseIds?: string[];
  location?: string;
}

interface RideEntryDto {
  _id: string;
  horseIds?: string[];
  distanceKilometers: number;
  category: RideCategory;
  notes?: string;
  endDateTime?: Date;
  startDateTime?: Date;
  name?: string;
}

@Injectable({
  providedIn: "root"
})
export class RideService extends HttpService {
  @Get("/ride/final")
  public finalRide(): Observable<any> {
    return null;
  }

  @Post("/ride/start")
  public startRide(@Body() dto: StartRideDto): Observable<string> {
    return null;
  }

  @Post("/ride/createEmptyRide")
  public createEmptyRide(): Observable<Ride> {
    return null;
  }

  public updateEntryRide(@Body() dto: RideEntryDto): Observable<Ride> {
    const formData = jsonToFormData(dto);
    return from(this._generateRidePicture([])).pipe(
      tap((pictureFile) =>
        formData.append("ridePicture", pictureFile)
      ),
      switchMap(() => this._http.post<Ride>("/ride/updateEntryRide", formData))
    );
  }

  @Patch("/ride/end")
  public endRide(@Body() dto: EndRideDto): Observable<void> {
    return null;
  }

  @Delete("/ride/:id")
  public deleteRide(@Path("id") id: string): Observable<void> {
    return null;
  }

  @Delete("/ride/deleteEntyRide/:rideId")
  public deleteEntyRide(@Path("rideId") rideId: string): Observable<void> {
    return null;
  }

  public saveRideDetails(ride: Ride): Observable<void> {
    const formData = jsonToFormData(this._rideToRideDetailsDto(ride));
    return from(this._generateRidePicture(ride.paths)).pipe(
      tap((pictureFile) =>
        formData.append("ridePicture", pictureFile)
      ),
      switchMap(() => this._http.patch<void>("/ride/details", formData))
    );
  }

  private _rideToRideDetailsDto(r: Ride): RideDetailsDto {
    const gaitNumbersToDto = (gn: GaitNumbers): GaitMetricDto[] => {
      const arr = [];
      for (const m of Gait.members) {
        const key = Gait[m];
        arr.push({ gait: m, metric: gn[m] });
      }
      return arr;
    };
    const rideGaitMetricsToDto = (m: RideGaitMetrics): RideGaitMetricsDto => ({
      horseId: m.horseId,
      metrics: gaitNumbersToDto(m.metrics)
    });
    return {
      distanceKilometers: r.distanceKilometers,
      category: r.category,
      notes: r.notes ? r.notes : null,
      paths: r.paths,
      calculatedGaitMinutes: r.calculatedGaitMinutes.map((cgm) =>
        rideGaitMetricsToDto(cgm)
      ),
      manualGaitMinutes: r.manualGaitMinutes.map((mgm) =>
        rideGaitMetricsToDto(mgm)
      ),
      calculatedGaitKilometers: r.calculatedGaitKilometers.map((cgk) =>
        rideGaitMetricsToDto(cgk)
      ),
      _id: r._id,
      endDateTime: r.endDateTime ? new Date(r.endDateTime) : null,
      startDateTime: r.startDateTime ? new Date(r.startDateTime) : null,
      horseIds: r.horseIdentities.map((identity) => identity._id)
    };
  }

  private _generateRidePicture(paths: RidePath[]): Promise<File> {
    return new Promise((resolve, reject) => {
      // Create a hidden canvas element
      const canvas = document.createElement("canvas");
      canvas.style.display = "none";

      // Set the canvas size
      canvas.width = 200;
      canvas.height = 200;

      // Get the canvas context
      const ctx = canvas.getContext("2d");

      // Draw a circle on the canvas
      const geoPoints = flatMap(paths, (path) => path.wayPoints);
      const boundingRect = getBoundingRectangle(geoPoints, false);
      const scale = Math.min(canvas.width, canvas.height);
      // Draw background
      ctx.fillStyle = "#d3eccb";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw path
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();

      for (const { latitude, longitude } of geoPoints) {
        const x = ((latitude - boundingRect.x) / boundingRect.width) * scale;
        const y = ((longitude - boundingRect.y) / boundingRect.height) * scale;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.closePath();

      canvas.toBlob(
        (blob) =>
          resolve(new File([blob], `${new Date().getTime()}_ride.png`, { type: "image/png" })),
        "image/png"
      );
    });
  }

  @Post("/ride/saveOngoingRide")
  public saveOngoingRide(@Body("id") id: string): Observable<void> {
    return null;
  }
}

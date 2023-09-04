import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from "@angular/core";
import { LocationService, ModalService } from "@ion-caballus/core/services";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { environment } from "@ion-caballus/env";
import { GeoPoint, WayPoint } from "@caballus/common";
import { Location } from "@capacitor-community/background-geolocation";
import { Ride } from "@caballus/ui-common";
import { flatMap } from "lodash";

@Component({
  selector: 'caballus-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() public ride!: Ride;

  @Input()
  public centerPosition: GeoPoint | Location | null | undefined;

  @Input()
  public myLivePosition: GeoPoint | Location | null | undefined;

  @Input()
  public mapZoom = 16;

  @Input()
  public fitBounds = false;

  @Input()
  public showChangeMapParamsControl = false;

  @Input()
  public showGpsStrengthControl = false;

  @Input()
  public showRestButton = true;

  public minZoom = 1;
  public defaultMapZoom: number = 3;

  public mapOptions: google.maps.MapOptions = {
    zoomControlOptions: {
      position: 6.0
    },
    zoom: this.defaultMapZoom, // Shows the whole US
    mapId: Date.now().toString(),
    panControl: true,
    minZoom: this.minZoom,
    keyboardShortcuts: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true
  };

  public polyLineOptions: google.maps.PolylineOptions = {
    strokeWeight: 3,
    strokeColor: '#ff0000',
    geodesic: true,
    clickable: false,
    draggable: false,
    editable: false
  };

  public mapTypeId: google.maps.MapTypeId = google.maps.MapTypeId.TERRAIN;

  // Geographic center of the continental US
  public defaultMapCenter: google.maps.LatLngLiteral = {
    lat: 39.828346055387314,
    lng: -98.57947953300369
  };

  public centerPosition$: BehaviorSubject<google.maps.LatLngLiteral> = new BehaviorSubject<google.maps.LatLngLiteral>(null);
  public myLivePosition$: BehaviorSubject<google.maps.LatLngLiteral> = new BehaviorSubject<google.maps.LatLngLiteral>(null);
  public vertices$: BehaviorSubject<google.maps.LatLngLiteral[]> =
    new BehaviorSubject<google.maps.LatLngLiteral[]>([]);
  public isDebugBuild = !environment.production;

  private _onDestroy$: Subject<void> = new Subject();

  public gpsStrength$: Observable<
    'gps-weak' | 'gps-average' | 'gps-strong' | undefined
  > = this._locationService.accuracy$.pipe(
    takeUntil(this._onDestroy$),
    map((accuracy) => {
      const strongAverageThreshold = 15;
      const averageWeakThreshold = 35;
      if (typeof accuracy === 'undefined' || accuracy < 0) {
        return undefined;
      } else if (accuracy < strongAverageThreshold) {
        return 'gps-strong';
      } else if (accuracy < averageWeakThreshold) {
        return 'gps-average';
      } else {
        return 'gps-weak';
      }
    })
  );

  private _map!: google.maps.Map;

  constructor(
    private readonly _modalService: ModalService,
    private readonly _locationService: LocationService,
    private readonly _changeDetectorRef: ChangeDetectorRef
  ) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ('centerPosition' in changes && changes.centerPosition.currentValue) {
      this.centerPosition$.next({
        lat: changes.centerPosition.currentValue.latitude,
        lng: changes.centerPosition.currentValue.longitude
      });
    }

    if ('myLivePosition' in changes && changes.myLivePosition.currentValue) {
      this.myLivePosition$.next({
        lat: changes.myLivePosition.currentValue.latitude,
        lng: changes.myLivePosition.currentValue.longitude
      });
    }

    if ('ride' in changes && !(changes.ride.firstChange) && this._map) {
      this._updateMap(changes.ride.currentValue);
    }
  }

  public ngAfterViewInit() {
    if (this.ride) {
      this._updateMap(this.ride);
    }
  }

  public mapInitialized(map: google.maps.Map): void {
    this._map = map;
  }

  public ngOnDestroy(): void {
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }

  public changeParameters(): void {
    this._modalService.configureGpsParametersModal().subscribe();
  }

  /**
   * The resetClicked function resets the map to its default state.
   * @return Void
   */
  public resetClicked(): void {
    if (this._map) {
      this._map.setZoom(this.mapZoom);
      this._map.setCenter({
        lat: this.centerPosition?.latitude || this.defaultMapCenter.lat,
        lng: this.centerPosition?.longitude || this.defaultMapCenter.lng
      });
    }
  }

  /**
   * The _updateMap function is called whenever the ride$ observable emits a new value.
   * It takes the Ride object and extracts all of its WayPoints, then it creates an array of objects with lat/lng properties.
   * This array is emitted to the vertices$ observable which will cause any subscribers to be notified that there are new values available.
   * @param ride: Ride Get the waypoints from the ride object
   * @return Nothing
   *
   */
  private _updateMap(ride: Ride): void {
    try {
      if (ride) {
        const wayPoints = flatMap(ride.paths, 'wayPoints') as WayPoint[];
        this.vertices$.next(
          wayPoints.map((wp: any) => ({ lat: wp.latitude, lng: wp.longitude }))
        );

        if (this.fitBounds) {
          const bounds = new google.maps.LatLngBounds();
          wayPoints.forEach((wp: any) => {
            bounds.extend({
              lat: wp.latitude,
              lng: wp.longitude
            });
          });

          this._map.fitBounds(bounds, 5);
          this._changeDetectorRef.detectChanges();
        }
      } else {
        this.vertices$.next([]);
      }
    } catch (e) {
      console.log(e);
      this.centerPosition$.next(this.defaultMapCenter);
    }
  }
}

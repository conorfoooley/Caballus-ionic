import { Injectable } from "@angular/core";
import { MediaMetadata } from "@caballus/ui-common";
import { from, Observable, of } from "rxjs";
import { FileSelectorPlugin } from "@ion-caballus/core/plugins";
import { catchError, map } from "rxjs/operators";
import { Capacitor } from "@capacitor/core";

@Injectable({
  providedIn: "root"
})
export class VideoService {
  public moveRideVideoToThePermanentLocation(
    metaData: MediaMetadata
  ): Observable<{
    mediaId: string;
    newPath: string;
  }> {
    if (Capacitor.isNativePlatform()) {
      return from(
        FileSelectorPlugin.MoveVideoFileToPermanentLocation({
          filePath: metaData.filePath
        })
      ).pipe(
        map((result) => ({
          mediaId: metaData.mediaId,
          newPath: result.newPath
        })),
        catchError((err) => {
          console.log(err);
          return of(err);
        })
      );
    }

    return of({
      mediaId: metaData.mediaId,
      newPath: metaData.filePath
    });
  }
}

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException} from "@nestjs/common";
import { ObjectId } from "@rfx/njs-db/mongo";
import {
  HorseIdentity,
  HorseIdentityWithGaits,
  HorsePermission,
  MediaCollectionName,
  MediaDocumentType,
  Ride,
  RideCategory,
  RideEntryType,
  RideGaitMetrics,
  RidePath,
  RideStatus,
  UploadedFileObject,
  User
} from "@caballus/api-common";
import { RideRepository } from "./ride.repository";
import { UserToHorseCacheRepository } from "./user-to-horse-cache.repository";
import { MediaService } from "../media-dal/media.service";
import { HorseRepository } from "./horse.repository";

@Injectable()
export class RideService {
  constructor(
    private readonly _rideRepo: RideRepository,
    private readonly _userToHorseCacheRepository: UserToHorseCacheRepository,
    private readonly _mediaService: MediaService,
    private readonly _horseRepo: HorseRepository
  ) {
  }

  /**
   * Gets an active ride by their id
   *
   * @param id
   * @returns The ride or null if not found
   */
  public async getRideById(id: ObjectId): Promise<Ride> {
    return this._rideRepo.getRideById(id);
  }

  /**
   * Gets an active ride by their id
   *
   * @param lUser
   * @returns The ride or null if not found
   */
  public async getFinalRide(lUser: User): Promise<Ride> {
    return this._rideRepo.getFinalRide(lUser._id);
  }

  /**
   * Create a Ride at the specified start time with specified horses
   *
   * @param _id
   * @param startDateTime
   * @param horseIds
   * @param lUser
   * @returns The ride id
   *
   * @throws BadRequestException if user is not connected to horse
   * @throws BadRequestException if user does not have ride permission for the horses
   */
  public async createRide(
    _id: ObjectId,
    startDateTime: Date,
    horseIds: ObjectId[],
    lUser: User
  ): Promise<ObjectId> {
    /*
        _id of new document is defined on mobile app
        side before being sent to server
    */

    const horses = await this._horseRepo.getHorsesByIdList(horseIds);

    const ride = new Ride({
      _id,
      startDateTime,
      riderIdentity: lUser.toIdentity(),
      rideStatus: RideStatus.InProgress
    });
    ride.horseIdentities = horses.map(
      (h) =>
        new HorseIdentityWithGaits({
          ...h.toIdentity(),
          gaitsKilometersPerHourSnapshot: h.gaitsKilometersPerHour
        })
    );
    return this._rideRepo.createRide(ride);
  }

  public async createEmptyRide(user: User): Promise<Ride> {
    const rideId = await this._rideRepo.createRide(
      new Ride({
        entryType: RideEntryType.Manual,
        riderIdentity: user.toIdentity()
      })
    );
    return await this._rideRepo.getRideById(rideId);
  }

  /**
   * Get horseIdentities from logged in user's cache
   *
   * @param horseIds
   * @param lUser
   * @returns Array of HorseIdentitiy
   *
   * @throws BadRequestException if user is not connected to horse
   * @throws BadRequestException if user does not have ride permission for the horses
   */
  private async getHorseIdentitiesFromCache(
    horseIds: ObjectId[],
    lUser: User
  ): Promise<HorseIdentity[]> {
    const identities = [];
    const userCache =
      await this._userToHorseCacheRepository.getUserToHorseCache(lUser._id);
    for (const h of horseIds) {
      const relationSummary = userCache.summaries.find((s) =>
        s.horseIdentity._id.equals(h)
      );
      if (!relationSummary) {
        throw new BadRequestException("User is not connected to horse: " + h);
      }
      if (
        !relationSummary.horseRoleReference.permissions.includes(
          HorsePermission.HorseRide
        )
      ) {
        throw new BadRequestException(
          "User does not have permission to ride horse: " + h
        );
      }
      identities.push(relationSummary.horseIdentity);
    }
    return identities;
  }

  /**
   * End a Ride
   * Sets the endDateTime and updates RideStatus to complete
   *
   * @param id
   * @param details
   * @param lUser
   * @returns void
   */
  public async endRide(
    id: ObjectId,
    details: {
      endDateTime: Date;
      startDateTime: Date;
      horseIds: ObjectId[];
    },
    lUser: User
  ): Promise<void> {
    const update = {
      endDateTime: details.endDateTime,
      rideStatus: RideStatus.Complete
    };

    // For backfilling cached data
    if (!!details.startDateTime) {
      update["startDateTime"] = details.startDateTime;
    }
    if (!!details.horseIds) {
      update["horseIdentities"] = await this.getHorseIdentitiesFromCache(
        details.horseIds,
        lUser
      );
      await this._horseRepo.updateHorseEndDateTime(
        details.horseIds,
        details.endDateTime
      );
    }

    await this._rideRepo.updateRide(id, update);
  }

  /**
   * Update ride details after ride has ended
   * Saves ride details including uploaded media
   * Uploads images to gclound
   * Uploads videos to jwplayer
   *
   * @throws BadRequestException if ride does not belong to user
   *
   * @param id
   * @param details
   * @param ridePicture
   * @param images
   * @param videos
   * @param lUser
   * @returns void
   */
  public async updateRideDetails(
    id: ObjectId,
    details: {
      distanceKilometers: number;
      category: RideCategory;
      notes: string;
      paths: RidePath[];
      calculatedGaitMinutes: RideGaitMetrics[];
      manualGaitMinutes: RideGaitMetrics[];
      calculatedGaitKilometers: RideGaitMetrics[];
      endDateTime: Date;
      startDateTime: Date;
      horseIds: ObjectId[];
    },
    ridePicture: UploadedFileObject,
    images: UploadedFileObject[],
    videos: UploadedFileObject[],
    lUser: User
  ): Promise<void> {
    const existing = await this._rideRepo.getRideById(id);
    if (!existing || !existing.riderIdentity._id.equals(lUser._id)) {
      throw new BadRequestException("User may not access this ride");
    }
    if (!ridePicture) {
      throw new InternalServerErrorException("No ride picture uploaded");
    }

    const ridePictureFile = await this._mediaService.createBaseMediaDocument(
      MediaDocumentType.Image,
      {
        buffer: ridePicture.buffer,
        mimetype: ridePicture.mimetype,
        originalname: ridePicture.originalname
      }
    );

    const update = new Ride({
      ...existing,
      ...details,
      name: "", // leave it blank as we haven't got promising results from the getRegionName method
      ridePicture: ridePictureFile
    });
    update.entryType =
      !!details.manualGaitMinutes && details.manualGaitMinutes.length > 0
        ? RideEntryType.Manual
        : RideEntryType.RealTime;

    if (!!images && images.length > 0) {
      for (const m of images) {
        await this._mediaService.createMedia(
          null,
          MediaCollectionName.Ride,
          id,
          MediaDocumentType.Image,
          m,
          lUser.toIdentity()
        );
      }
    }

    if (!!videos && videos.length > 0) {
      for (const v of videos) {
        await this._mediaService.createMedia(
          null,
          MediaCollectionName.Ride,
          id,
          MediaDocumentType.Video,
          v,
          lUser.toIdentity()
        );
      }
    }

    // For backfilling cached data
    if (!!details.startDateTime) {
      update.startDateTime = details.startDateTime;
    }
    if (!!details.endDateTime) {
      update.endDateTime = details.endDateTime;
    }
    if (!!details.horseIds) {
      const horses = await this._horseRepo.getHorsesByIdList(details.horseIds);
      update.horseIdentities = horses.map(
        (h) =>
          new HorseIdentityWithGaits({
            ...h.toIdentity(),
            gaitsKilometersPerHourSnapshot: h.gaitsKilometersPerHour
          })
      );
    }

    delete update.createdDate;
    delete update.modifiedDate;

    await this._rideRepo.updateRide(id, update);
  }

  public async updateRideEntry(
    id: ObjectId,
    details: {
      distanceKilometers: number;
      category: RideCategory;
      notes: string;
      endDateTime: Date;
      startDateTime: Date;
      horseIds: ObjectId[];
      name: string;
    },
    ridePicture: UploadedFileObject,
    lUser: User
  ): Promise<void> {
    const existing = await this._rideRepo.getRideById(id);
    if (!existing || !existing.riderIdentity._id.equals(lUser._id)) {
      throw new BadRequestException("User may not access this ride");
    }

    if (!ridePicture) {
      throw new InternalServerErrorException("No ride picture uploaded");
    }

    const ridePictureFile = await this._mediaService.createBaseMediaDocument(
      MediaDocumentType.Image,
      {
        buffer: ridePicture.buffer,
        mimetype: ridePicture.mimetype,
        originalname: ridePicture.originalname
      }
    );

    const update = new Ride({
      ...existing,
      ...details,
      ridePicture: ridePictureFile
    });
    update.entryType = RideEntryType.Manual;

    // For backfilling cached data
    if (!!details.startDateTime) {
      update.startDateTime = details.startDateTime;
    }
    if (!!details.endDateTime) {
      update.endDateTime = details.endDateTime;
    }
    if (!!details.horseIds) {
      const horses = await this._horseRepo.getHorsesByIdList(details.horseIds);
      update.horseIdentities = horses.map(
        (h) =>
          new HorseIdentityWithGaits({
            ...h.toIdentity(),
            gaitsKilometersPerHourSnapshot: h.gaitsKilometersPerHour
          })
      );
    }

    delete update.createdDate;
    delete update.modifiedDate;

    await this._rideRepo.updateRide(id, update);
  }

  /**
   * Delete ride by id
   *
   * @throws BadRequestException if ride does not belong to logged in user
   *
   * @param id
   * @param lUser
   * @returns void
   */
  public async deleteRideById(id: ObjectId, lUser: User): Promise<void> {
    const existing = await this._rideRepo.getRideById(id);
    if (!existing || !existing.riderIdentity._id.equals(lUser._id)) {
      throw new BadRequestException("User may not access this ride");
    }

    return this._rideRepo.deleteRide(id);
  }

  public async deleteEntryRideById(id: ObjectId): Promise<void> {
    return this._rideRepo.realDeleteRide(id);
  }

  /**
   * Save ride by id
   *
   * @param id
   * @param lUser
   * @returns void
   */
  public async saveHorsesOnOngoingRide(
    id: ObjectId,
    lUser: User
  ): Promise<void> {
    const existingRide = await this._rideRepo.getRideById(id);
    const update = {
      endDateTime: null,
      rideStatus: RideStatus.Complete,
      category: null
    };
    if (!!existingRide.horseIdentities.length) {
      const horseIds = existingRide.horseIdentities.map(({ _id }) => _id);
      update["horseIdentities"] = await this.getHorseIdentitiesFromCache(
        existingRide.horseIdentities.map(({ _id }) => _id),
        lUser
      );
      await this._horseRepo.updateHorseEndDateTime(horseIds, null);
    }
    await this._rideRepo.finishRide(id, update);
  }
}

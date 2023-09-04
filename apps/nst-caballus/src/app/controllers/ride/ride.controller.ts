import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors
} from "@nestjs/common";
import {
  FriendService,
  HorseService,
  MediaService,
  NotificationService,
  RideService,
  UserHorseRelationshipService,
  UserService
} from "@nst-caballus/dal";
import {
  LoggedInUser,
  Secured,
  WildCardPermission
} from "@rfx/nst-permissions";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags
} from "@nestjs/swagger";
import {
  ConnectionIdentity,
  HorseIdentity,
  HorsePermission,
  Notification,
  NotificationCategory,
  NotificationType,
  Ride,
  UploadedFileObject,
  User
} from "@caballus/api-common";
import { IdDto, ObjectId } from "@rfx/nst-db/mongo";
import { StartRideDto } from "./dto/start-ride.dto";
import { EndRideDto } from "./dto/end-ride.dto";
import { RideDetailsDto } from "./dto/ride-details.dto";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { RideEntryDto } from "./dto/ride-entry.dto";

@ApiBearerAuth()
@ApiTags("ride")
@Controller("ride")
export class RideController {
  constructor(
    private readonly _rideService: RideService,
    private readonly _horseService: HorseService,
    private readonly _friendService: FriendService,
    private readonly _notificationService: NotificationService,
    private readonly _userHorseRelationshipService: UserHorseRelationshipService,
    private readonly _userService: UserService,
    private readonly _mediaService: MediaService
  ) {
  }

  @Get("/final")
  @ApiOperation({ summary: "Get Horses For Ride" })
  @Secured(WildCardPermission)
  public async getFinalRide(@LoggedInUser() user: User): Promise<Ride> {
    return this._rideService.getFinalRide(user);
  }

  @Post("start")
  @ApiOperation({ summary: "Start Ride" })
  @Secured(WildCardPermission)
  public async startRide(
    @Body() dto: StartRideDto,
    @LoggedInUser() user: User
  ): Promise<ObjectId> {
    await this._horseService.checkUserHasHorsePermission(
      user._id,
      dto.horseIds,
      HorsePermission.HorseRide
    );
    user = new User(user); // TODO checking with team, better way to handle this?
    return this._rideService.createRide(
      dto._id,
      dto.startDateTime,
      dto.horseIds,
      user
    );
  }

  @Post("updateEntryRide")
  @ApiOperation({ summary: "Update entry ride" })
  @Secured(WildCardPermission)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileFieldsInterceptor([{ name: "ridePicture" }]))
  public async updateEntryRide(
    @Body() dto: RideEntryDto,
    @UploadedFiles() files: UploadedFileObject[],
    @LoggedInUser() user: User
  ): Promise<void> {
    const ridePicture =
      !!files && !!files["ridePicture"] && !!files["ridePicture"][0]
        ? files["ridePicture"][0]
        : null;
    return await this._rideService.updateRideEntry(
      dto._id,
      dto,
      ridePicture,
      user
    );
  }

  @Post("createEmptyRide")
  @ApiOperation({ summary: "Create empty ride" })
  @Secured(WildCardPermission)
  public async createEmptyRide(@LoggedInUser() user: User): Promise<Ride> {
    return await this._rideService.createEmptyRide(user);
  }

  @Patch("end")
  @ApiOperation({ summary: "End Ride" })
  @Secured(WildCardPermission)
  public async endRide(
    @Body() dto: EndRideDto,
    @LoggedInUser() user: User
  ): Promise<void> {
    return this._rideService.endRide(dto._id, dto, user);
  }

  @Patch("details")
  @ApiOperation({ summary: "Update Ride Details" })
  @Secured(WildCardPermission)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "images[]" },
      { name: "videos[]" },
      { name: "ridePicture" }
    ])
  )
  public async updateRideDetails(
    @Body() dto: RideDetailsDto,
    @UploadedFiles() files: UploadedFileObject[],
    @LoggedInUser() user: User
  ): Promise<void> {
    if (!!dto.horseIds) {
      await this._horseService.checkUserHasHorsePermission(
        user._id,
        dto.horseIds,
        HorsePermission.HorseRide
      );
    }
    const images = !!files ? files["images[]"] : null;
    const videos = !!files ? files["videos[]"] : null;
    const ridePicture =
      !!files && !!files["ridePicture"] && !!files["ridePicture"][0]
        ? files["ridePicture"][0]
        : null;

    user = new User(user); // TODO checking with team, better way to handle this?

    await this._rideService.updateRideDetails(
      dto._id,
      dto.toPartialRideModel(dto),
      ridePicture,
      images,
      videos,
      user
    );
    const horses = await Promise.all(dto.horseIds.map((id) => this._horseService.getHorseById(id)));
    const followedUsersOfHorses = await Promise.all(dto.horseIds.map((id) => this._horseService.getFollowedUsersByHorseId(id)));
    followedUsersOfHorses.forEach((users, horseIndex) => {
      if (horses[horseIndex]) {
        users?.forEach((rider) => {
          if (rider._id.toString() !== user._id.toString()) {
            let notification: Notification = new Notification({
              message: `${
                user.displayName
              } completed a ride on ${dto.endDateTime.toLocaleDateString()} ${dto.endDateTime.toLocaleTimeString(
                [],
                { hour12: false }
              )}`,
              userIdentity: new ConnectionIdentity({
                ...rider.profile,
                displayName: `${rider.profile.firstName} ${rider.profile.lastName}`,
                profilePicture: rider.profile.profilePicture,
                profileUrl: rider.profileUrl,
                profilePublic: rider.profilePublic
              }),
              notificationCategory: NotificationCategory.Caballus,
              notificationType: NotificationType.RideEnded,
              riderIdentity: new ConnectionIdentity({
                ...user.profile,
                displayName: `${user.profile.firstName} ${user.profile.lastName}`,
                profilePicture: user.profile.profilePicture,
                profileUrl: user.profileUrl,
                profilePublic: user.profilePublic
              }),
              horseIdentity: horses[horseIndex].toIdentity(),
              rideId: dto._id,
              lastReactionDate: new Date(),
              friendId: null
            });
            this._notificationService.createNotification(notification);
          }
        })
      }
    })
  }

  @Delete(":id")
  @Secured(WildCardPermission)
  public async deleteRide(
    @Param() idDto: IdDto,
    @LoggedInUser() user: User
  ): Promise<void> {
    return this._rideService.deleteRideById(idDto.id, user);
  }

  @Delete("deleteEntyRide/:id")
  @ApiOperation({ summary: "Delete entry ride" })
  @Secured(WildCardPermission)
  public async deleteEntyRide(@Param() idDto: IdDto): Promise<void> {
    return this._rideService.deleteEntryRideById(idDto.id);
  }

  @Post("/saveOngoingRide")
  @ApiOperation({ summary: "Save ongoing ride" })
  @Secured(WildCardPermission)
  public async saveHorsesOnOngoingRide(
    @Body() idDto: IdDto,
    @LoggedInUser() user: User
  ): Promise<void> {
    return this._rideService.saveHorsesOnOngoingRide(idDto.id, user);
  }
}

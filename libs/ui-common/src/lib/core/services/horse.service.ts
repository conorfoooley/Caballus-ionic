import { Injectable } from '@angular/core';
import { HttpService, Post, Body, Get, Query, Path, Put, Delete, Patch } from '@rfx/ngx-http';
import { Observable } from 'rxjs';
import { ResponseType } from '@rfx/ngx-http';
import {
    HorseForRide,
    HorseDetails,
    HorseStatTotals,
    HorseRelationshipsSimple,
    HorseSummaryForInvitation,
    HorseHealthSimple,
    HorseEvaluationSimple,
    Ride,
    HorseCompetitionSimple,
    Horse
} from '../models';
import {
    GaitNumbers,
    HorseProfilePrivacy,
    HorseBreed,
    HorseProfileStatus,
    HorseHealthType,
    Address,
    HorseVeterinarianProfile,
    Privacy,
    RideHistorySimple,
    HorseBasicProfile,
    HorseMatrixType,
    HorseEvaluationType
} from '@caballus/common';
import { HttpClient } from '@angular/common/http';
import * as jsonToFormData from 'json-form-data';
import { PaginatedList } from '@rfx/common';
import { HorseMatrixSimple } from '@caballus/ui-common';

interface HorsesDto {
    horses: {
        _id: string;
        profile: {
            commonName: string;
            breedOther?: string;
            privacy?: HorseProfilePrivacy;
            registeredName?: string;
            breed?: HorseBreed;
            registrationNumber?: string;
            heightMeters?: number;
            weightKilograms?: number;
        };
        gaitsKilometersPerHour: GaitNumbers;
    }[];
}

interface HorseDto {
    _id?: string;
    profile: {
        commonName: string;
        registeredName: string;
        breed: string;
        registrationNumber: string;
        heightMeters: number;
        weightKilograms: number;
    };
    gaitsKilometersPerHour: GaitNumbers;
}

export interface HorseBioDto {
    id: string;
    commonName: string;
    breedOther?: string;
    registeredName?: string;
    breed?: HorseBreed;
    registrationNumber?: string;
    heightMeters?: number;
    weightKilograms?: number;
}

export interface HorsePrivacyDto {
    id: string;
    overallPrivacy: Privacy;
    bio: Privacy;
    media: Privacy;
    rideHistory: Privacy;
    studentsAndTrainers: Privacy;
    ownerDetails: Privacy;
    gaitTotals: Privacy;
    gaitSettings: Privacy;
    medicalHistory: Privacy;
    performanceEvaluations: Privacy;
    competitions: Privacy;
}

export interface HorseGaitsDto {
    id: string;
    gaitsKilometersPerHour: GaitNumbers;
}

export interface HorseHealthDto {
    horseId: string;
    horseHealthType: HorseHealthType;
    notes: string;
    date: Date;
}

export interface HorseEvaluationMatrixDto {
    horseId: string;
    horseMatrixType: HorseMatrixType | string;
    notes: string;
    rating: number;
    evaluationId: string;
    horseMatrixGroupTitle: string;
}

export interface HorseVeterinarianProfileDto {
    fullName: string;
    email: string;
    phone: string;
    address: Address;
}

export interface HorseEvaluationDto {
    _id?: string;
    evaluator: string;
    location: string;
    date: Date;
    evaluationType: HorseEvaluationType;
}

export interface HorseCompetitionDto {
    _id?: string;
    name: string;
    location: string;
    results: string;
    notes: string;
    date: Date;
}

@Injectable({
    providedIn: 'root'
})
export class HorseService extends HttpService {
    constructor(private _httpClient: HttpClient) {
        super(_httpClient);
    }

    @Get('/horse/forRide')
    public getHorsesForRide(): Observable<HorseForRide[]> {
        return null;
    }

    @Post('/horse')
    public createHorses(@Body() dtos: HorsesDto): Observable<string[]> {
        return null;
    }

    @Post('/horse/create')
    public createHorse(@Body() dtos: any): Observable<string> {
        return null;
    }

    @Patch('/horse')
    public editHorseBio(@Body() dto: HorseBioDto): Observable<void> {
        return null;
    }

    @Patch('/horse/gaits')
    public editHorseGaits(@Body() dto: HorseGaitsDto): Observable<void> {
        return null;
    }

    @Post('/horse/ongoingRide')
    public getHorsesOnRide(@Body() dto: { ids: string[] }): Observable<Ride[]> {
        return null;
    }

    @Get('/horse/list')
    public getViewableHorses(): Observable<HorseDetails[]> {
        return null;
    }

    @Get('/horse/basic')
    public getHorseBasic(@Query('id') id: string): Observable<Horse> {
        return null;
    }

    @Get('/horse/profile/relationships')
    public getHorseRelationships(@Query('id') id: string): Observable<HorseRelationshipsSimple> {
        return null;
    }

    @Post('/horse/profile/relationships/list')
    public getHorseRelationshipsList(
        @Body('ids') ids: string[]
    ): Observable<HorseRelationshipsSimple[]> {
        return null;
    }

    @Get('/horse/profile/distancePerRide')
    public getHorseDistancePerRide(
        @Query('id') id: string
    ): Observable<{ date: Date; distanceKilometers: number }[]> {
        return null;
    }

    @Get('/horse/profile/statTotals')
    public getHorseStatTotals(@Query('id') id: string): Observable<HorseStatTotals> {
        return null;
    }

    @Post('/horse/profile/statTotals/list')
    public getHorseStatTotalsList(@Body('ids') ids: string[]): Observable<HorseStatTotals[]> {
        return null;
    }

    @Put('/horse/delete')
    public deleteHorsesByIds(@Body('ids') ids: string[]): Observable<void> {
        return null;
    }

    @Put('/horse/:id/profileStatus', { responseType: ResponseType.Text })
    public toggleHorseProfileStatus(@Path('id') id: string): Observable<HorseProfileStatus> {
        return null;
    }

    @Get('/horse/byInvitation/:id')
    public getHorseSummaryByInvitationId(
        @Path('id') id: string
    ): Observable<HorseSummaryForInvitation> {
        return null;
    }

    public createHorseHealth(
        horseHealthId: string,
        dto: HorseHealthDto,
        documents: File[]
    ): Observable<string> {
        const formData = jsonToFormData(dto);
        formData.append('_id', horseHealthId);
        if (documents?.length) {
            for (const document of documents) {
                formData.append('documents[]', document);
            }
        }
        return this._httpClient.post('/horse/horseHealth/create', formData, {
            responseType: ResponseType.Text
        });
    }

    public editHorseHealth(
        horseHealthId: string,
        horseId: string,
        dto: HorseHealthDto,
        documents: File[]
    ): Observable<void> {
        const formData = jsonToFormData(dto);
        formData.append('_id', horseHealthId);
        if (documents?.length) {
            for (const document of documents) {
                formData.append('documents[]', document);
            }
        }
        return this._httpClient.request<void>(
            'put',
            `/horse/horseHealth/${horseHealthId}?id=${horseId}`,
            { body: formData }
        );
    }

    @Delete('/horse/horseHealth/document/:documentId')
    public deleteHorseHealthDocument(
        @Path('documentId') documentId: string,
        @Query('id') id: string
    ): Observable<void> {
        return null;
    }

    @Delete('/horse/horseHealth/:horseHealthId')
    public deleteHorseHealth(
        @Path('horseHealthId') horseHealthId: string,
        @Query('id') id: string
    ): Observable<void> {
        return null;
    }

    @Get('/horse/horseHealth')
    public getHorseHealthByHorseId(@Query('id') id: string): Observable<HorseHealthSimple[]> {
        return null;
    }

    @Get('/horse/veterinarianProfile')
    public getHorseVeterinarianProfileByHorseId(
        @Query('id') id: string
    ): Observable<HorseVeterinarianProfile> {
        return null;
    }

    @Put('/horse/:id/veterinarianProfile')
    public updateHorseVeterinarianProfileByHorseId(
        @Path('id') id: string,
        @Body() horseVeterinarianProfile: HorseVeterinarianProfileDto
    ): Observable<void> {
        return null;
    }

    @Patch('/horse/privacy')
    public editHorsePrivacy(@Body() dto: HorsePrivacyDto): Observable<void> {
        return null;
    }

    @Get('/evaluations/:evaluationId/matrixes/list')
    public getHorseEvaluationMatrixByEvaluationId(
        @Path('evaluationId') evaluationId: string,
        @Query('id') horseId: string
    ): Observable<HorseMatrixSimple[]> {
        return null;
    }

    @Get('/evaluations/:horseId/list')
    public getHorseEvaluationByHorseId(
        @Path('horseId') horseId: string
    ): Observable<HorseEvaluationSimple[]> {
        return null;
    }

    @Post('/evaluations/:horseId')
    public createHorseEvaluationByHorseId(
        @Path('horseId') horseId: string,
        @Body() dto: HorseEvaluationDto
    ): Observable<string> {
        return null;
    }

    @Put('/evaluations/:horseId/:evaluationId')
    public editHorseEvaluationById(
        @Path('evaluationId') evaluationId: string,
        @Path('horseId') horseId: string,
        @Body() dto: HorseEvaluationDto
    ): Observable<void> {
        return null;
    }

    @Delete('/evaluations/:horseId/:evaluationId')
    public deleteHorseEvaluationById(
        @Path('evaluationId') evaluationId: string,
        @Path('horseId') horseId: string
    ): Observable<void> {
        return null;
    }

    @Get('/competitions/:horseId/list')
    public getHorseCompetitionByHorseId(
        @Path('horseId') horseId: string
    ): Observable<HorseCompetitionSimple[]> {
        return null;
    }

    public createHorseCompetitionByHorseId(
        horseId: string,
        dto: HorseCompetitionDto,
        image?: File
    ): Observable<string> {
        const formData = jsonToFormData(dto);
        formData.append('image', image);
        return this._httpClient.post(`/competitions/${horseId}`, formData, {
            responseType: ResponseType.Text
        });
    }

    public editHorseCompetitionById(
        competitionId: string,
        horseId: string,
        dto: HorseCompetitionDto,
        removeImage: boolean,
        image?: File
    ): Observable<void> {
        const formData = jsonToFormData(dto);
        formData.append('_id', competitionId);
        if (image) {
            formData.append('image', image);
        }
        return this._httpClient.put<void>(`/competitions/${horseId}/${competitionId}`, formData);
    }

    @Delete('/competitions/:horseId/:competitionId')
    public deleteHorseCompetitionById(
        @Path('competitionId') competitionId: string,
        @Path('horseId') horseId: string
    ): Observable<void> {
        return null;
    }

    @Delete('/competitions/:horseId/:competitionId/image')
    public deleteHorseCompetitionPictureById(
        @Path('competitionId') competitionId: string,
        @Path('horseId') horseId: string
    ): Observable<void> {
        return null;
    }

    @Get('/horse/profile/rideHistory')
    public getRideHistory(
        @Query('id') id: string,
        @Query('skipRecord') skipRecord: number
    ): Observable<PaginatedList<RideHistorySimple>> {
        return null;
    }

    @Get('/horse/profile/rideHistoryByUserId')
    public getRideHistoryByUserId(
        @Query('id') id: string,
        @Query('skipRecord') skipRecord: number
    ): Observable<PaginatedList<RideHistorySimple>> {
        return null;
    }

    @Get('/horse/:id/basic-profile')
    public getBasicHorseProfile(@Path('id') id: string): Observable<HorseBasicProfile> {
        return null;
    }

    public createUpdateHorseEvaluationMatrix(
        dto: HorseEvaluationMatrixDto,
        documents: File[]
    ): Observable<void> {
        const formData = jsonToFormData(dto);
        if (documents?.length) {
            for (const document of documents) {
                formData.append('documents[]', document);
            }
        }
        return this._httpClient.post<void>('/evaluations/horseEvaluationMatrix', formData);
    }

    @Delete('/evaluations/horseEvaluationMatrix/:horseId/:horseEvaluationMatrixId')
    public deleteHorseMatrixById(
        @Path('horseId') horseId: string,
        @Path('horseEvaluationMatrixId') horseEvaluationMatrixId: string
    ): Observable<void> {
        return null;
    }

    @Get('/horse/ride')
    public rideById(
        @Query('horseId') horseId: string,
        @Query('rideId') rideId: string
    ): Observable<string> {
        return null;
    }

    @Put('/horse/:id/follow')
    public followUnfollowHorse(@Path('id') id: string): Observable<HorseBasicProfile> {
        return null;
    }

    @Get('/horse/:id/follow')
    public isHorseFollowed(@Path('id') id: string): Observable<boolean> {
        return null;
    }
}

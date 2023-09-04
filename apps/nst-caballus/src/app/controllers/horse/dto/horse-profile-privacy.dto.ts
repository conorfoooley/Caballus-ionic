import { IsString, IsIn } from 'class-validator';
import { Privacy } from '@caballus/api-common';
import { ApiProperty } from '@nestjs/swagger';

export class HorseProfilePrivacyDto {
    @IsString()
    @IsIn(Privacy.members)
    @ApiProperty()
    public overallPrivacy: Privacy;

    @IsString()
    @IsIn(Privacy.members)
    @ApiProperty()
    public bio: Privacy;

    @IsString()
    @IsIn(Privacy.members)
    @ApiProperty()
    public media: Privacy;

    @IsString()
    @IsIn(Privacy.members)
    @ApiProperty()
    public rideHistory: Privacy;

    @IsString()
    @IsIn(Privacy.members)
    @ApiProperty()
    public studentsAndTrainers: Privacy;

    @IsString()
    @IsIn(Privacy.members)
    @ApiProperty()
    public ownerDetails: Privacy;

    @IsString()
    @IsIn(Privacy.members)
    @ApiProperty()
    public gaitTotals: Privacy;

    @IsString()
    @IsIn(Privacy.members)
    @ApiProperty()
    public gaitSettings: Privacy;

    @IsString()
    @IsIn(Privacy.members)
    @ApiProperty()
    public medicalHistory: Privacy;

    @IsString()
    @IsIn(Privacy.members)
    @ApiProperty()
    public performanceEvaluations: Privacy;

    @IsString()
    @IsIn(Privacy.members)
    @ApiProperty()
    public competitions: Privacy;
}

import { ObjectId } from '@rfx/nst-db/mongo';
import { IsString } from 'class-validator';

export class HorseShareDto {

    @IsString()
    public id: ObjectId;
    
    @IsString()
    public title: string;

    @IsString()
    public description: string;

    @IsString()
    public image: string;
    
    @IsString()
    public desktopUrl: string;
    
}

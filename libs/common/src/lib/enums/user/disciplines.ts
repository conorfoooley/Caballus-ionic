export enum UserDisciplines {
    Trainer = '[UserDisciplines] trainer',
    LeisureRider = '[UserDisciplines] leisure rider',
    Breeder = '[UserDisciplines] breeder',
    WesternRiding = '[UserDisciplines] western riding',
    WesternPerformance = '[UserDisciplines] western performance',
    Rodeo = '[UserDisciplines] rodeo',
    EnglishRiding = '[UserDisciplines] english riding',
    Driving = '[UserDisciplines] driving',
    TrailRiding = '[UserDisciplines] trail riding'
}

export namespace UserDisciplines {
    export function toString(type: UserDisciplines): string {
        switch (type) {
            case UserDisciplines.Trainer:
                return 'Trainer';
            case UserDisciplines.LeisureRider:
                return 'Leisure Rider';
            case UserDisciplines.Breeder:
                return 'Breeder';
            case UserDisciplines.WesternRiding:
                return 'Western Riding';
            case UserDisciplines.WesternPerformance:
                return 'Western Performance';
            case UserDisciplines.Rodeo:
                return 'Rodeo';
            case UserDisciplines.EnglishRiding:
                return 'English Riding';
            case UserDisciplines.Driving:
                return 'Driving';
            case UserDisciplines.TrailRiding:
                return 'Trail Riding';
            default:
                return '';
        }
    }
}

export enum UserDisciplines {
    Trainer = '[UserDisciplines] trainer',
    WesternPerformance = '[UserDisciplines] western performance',
    Breeder = '[UserDisciplines] breeder',
    LeisureRider = '[UserDisciplines] leisure rider',
    Rodeo = '[UserDisciplines] rodeo',
    WesternRiding = '[UserDisciplines] western riding',
    Driving = '[UserDisciplines] driving',
    EnglishRiding = '[UserDisciplines] english riding',
    TrailRiding = '[UserDisciplines] trail riding'
}

export namespace UserDisciplines {
    export function toString(type: UserDisciplines): string {
        switch (type) {
            case UserDisciplines.Trainer:
                return 'Trainer';
            case UserDisciplines.WesternPerformance:
                return 'Western Performance';
            case UserDisciplines.WesternRiding:
                return 'Western Riding';
            case UserDisciplines.LeisureRider:
                return 'Leisure Rider';
            case UserDisciplines.Breeder:
                return 'Breeder';
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

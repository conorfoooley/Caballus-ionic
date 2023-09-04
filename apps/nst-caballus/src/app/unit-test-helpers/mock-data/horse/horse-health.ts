import { HorseHealthType, Media, HorseHealthSimple, BaseMediaDocument } from '@caballus/api-common';
export const mockHorseHealthDocument: Media = new Media({
    latest: new BaseMediaDocument({
        path: 'test.pdf'
    })
});

export const mockHorseHealth: HorseHealthSimple[] = [new HorseHealthSimple({
    date: new Date('01/01/2021'),
    notes: 'Test',
    horseHealthType: HorseHealthType.Health,
    documents: [mockHorseHealthDocument]
}), new HorseHealthSimple({
    date: new Date('01/01/2021'),
    notes: 'Test',
    horseHealthType: HorseHealthType.Health,
    documents: []
})];


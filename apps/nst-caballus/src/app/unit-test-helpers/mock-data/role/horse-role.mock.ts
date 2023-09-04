import { HorsePermission, HorseRole } from '@caballus/api-common';
import { ObjectId } from '@rfx/njs-db/mongo';

export const mockOwnerHorseRole = new HorseRole({
    _id: new ObjectId(),
    name: 'Owner',
    editable: false,
    permissions: [
        HorsePermission.HorseView,
        HorsePermission.HorseEdit,
        HorsePermission.HorseDelete,
        HorsePermission.HorseRide
    ]
});

export const mockViewOnlyHorseRole = new HorseRole({
    _id: new ObjectId(),
    name: 'Watcher',
    editable: false,
    permissions: [
        HorsePermission.HorseView
    ]
});

export const mockCannotViewHorseRole = new HorseRole({
    _id: new ObjectId(),
    name: 'IDEK',
    editable: false,
    permissions: [
    ]
});


export const mockStudentHorseRole = new HorseRole({
    _id: new ObjectId(),
    name: 'Student',
    editable: false,
    permissions: [
        HorsePermission.HorseView,
        HorsePermission.HorseRide
    ]
});


export const mockTrainerHorseRole = new HorseRole({
    _id: new ObjectId(),
    name: 'Trainer',
    editable: false,
    permissions: [
        HorsePermission.HorseView,
        HorsePermission.HorseEdit,
        HorsePermission.HorseRide
    ]
});

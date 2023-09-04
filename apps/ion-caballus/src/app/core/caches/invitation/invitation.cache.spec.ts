import { TestBed } from '@angular/core/testing';
import { InvitationCache, InvitationCacheKeys } from './invitation.cache';
import { StorageService, CapacitorPluginService } from '../../services';
import {
    Invitation,
    InvitationService    
} from '@caballus/ui-common';
import { of, Observable, forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';

const MockStorageService = {
    getUserData: jest.fn(),
    setUserData: jest.fn(),
    clearUserData: jest.fn()
};
const MockCapacitorPluginService = {
    networkStatus: jest.fn()
};
const MockInvitationService = {
    createOwnershipTransferInvitation: jest.fn(),
    getSentOwnershipTransferInvitations: jest.fn(),
    retractOwnershipTransferInivtation: jest.fn()
};

describe('InvitationCache', () => {
    let invitationCache: InvitationCache;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: StorageService, useValue: MockStorageService },
                { provide: CapacitorPluginService, useValue: MockCapacitorPluginService },
                { provide: InvitationService, useValue: MockInvitationService }
            ]
        });
        invitationCache = TestBed.inject(InvitationCache);
        jest.resetAllMocks();
    });

    it('should create', () => {
        expect(invitationCache).toBeDefined();
    });

    it('should multicast the sync operation', done => {
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({ connected: true }));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockStorageService.clearUserData.mockResolvedValue(undefined);

        MockInvitationService.getSentOwnershipTransferInvitations.mockReturnValue(of([]));

        const observables: Observable<void>[] = [];
        for (let _o = 0; _o < 5; ++_o) {
            observables.push(invitationCache.sync());
        }

        forkJoin(observables).pipe(take(1)).subscribe(() => {
            expect(MockInvitationService.getSentOwnershipTransferInvitations).toHaveBeenCalledTimes(1);
            done();
        });
    });

    it('should deliver cache entries for ownership invitations when offline', done => {
        const invitations = [new Invitation({ _id: '0' })];
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({ connected: false }));
        MockStorageService.getUserData.mockResolvedValueOnce(JSON.stringify(invitations));
        invitationCache.getSentOwnershipTransferInvitations().pipe(take(1)).subscribe(invitations => {
            expect(invitations).toHaveLength(1);
            expect(invitations[0]._id).toBe('0');
            expect(MockInvitationService.getSentOwnershipTransferInvitations).toHaveBeenCalledTimes(0);
            done();
        });
    });

    it('should download and return fresh cache entries for ownership invitations when online', done => {
        const invitations = [new Invitation({ _id: '0' }), new Invitation({ _id: '1' })];
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({ connected: true }));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockInvitationService.getSentOwnershipTransferInvitations.mockReturnValueOnce(of(invitations));
        invitationCache.getSentOwnershipTransferInvitations().pipe(take(1)).subscribe(invitations => {
            expect(invitations).toHaveLength(2);
            expect(invitations[0]._id).toBe('0');
            expect(invitations[1]._id).toBe('1');
            expect(MockInvitationService.getSentOwnershipTransferInvitations).toHaveBeenCalledTimes(1);
            const setCall = MockStorageService.setUserData.mock.calls[0];
            expect(setCall[0]).toBe(InvitationCacheKeys.SentOwnershipTransferInvitations);
            const setInvitations = JSON.parse(setCall[1]);
            expect(setInvitations[0]).toMatchObject(JSON.parse(JSON.stringify(invitations[0])));
            expect(setInvitations[1]).toMatchObject(JSON.parse(JSON.stringify(invitations[1])));
            done();
        });
    });
});

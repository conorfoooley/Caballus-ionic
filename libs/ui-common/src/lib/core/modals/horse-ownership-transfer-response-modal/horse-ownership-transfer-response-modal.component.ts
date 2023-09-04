import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HorseBreed, kgToLbs, meterToHands, UserHorseRelationshipAction } from '@caballus/common';
import { HorseSummaryForInvitation } from '../../models';
import { Router } from '@angular/router';
import { InvitationService } from '../../services/invitation.service';
import { ToastService } from '@rfx/ngx-toast';

@Component({
    selector: 'caballus-horse-ownership-transfer-response-modal',
    templateUrl: './horse-ownership-transfer-response-modal.component.html',
    styleUrls: ['./horse-ownership-transfer-response-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorseOwnershipTransferResponseModalComponent implements OnInit {
    public invitationId: string;
    public summary: HorseSummaryForInvitation;

    public HorseBreed: typeof HorseBreed = HorseBreed;
    public readonly kgToLbs: (k: number) => number = kgToLbs;
    public readonly meterToHands: (k: number) => number = meterToHands;
    
    constructor(
        public dialogRef: MatDialogRef<HorseSummaryForInvitation>,
        @Inject(MAT_DIALOG_DATA) public data: { summary: HorseSummaryForInvitation, inviteId: string },
        private readonly _router: Router,
        private readonly _invitationService: InvitationService,
        private readonly _toastService: ToastService
    ) {}

    ngOnInit(): void {
        this.summary = this.data.summary;
        this.invitationId = this.data.inviteId;
    }

    public cancelTransfer(): void {
        this._invitationService.rejectInvitation(this.invitationId).subscribe(
            () => {
                this.dialogRef.close(UserHorseRelationshipAction.Reject);
            },
            err => {
                this._toastService.error(err);
                this.dialogRef.close();
            }
        );
    }

    public acceptTransfer(): void {
        this._invitationService.acceptOwnershipTransferInvitation(this.invitationId).subscribe(
            () => {
                this.dialogRef.close(UserHorseRelationshipAction.Accept);
            },
            err => {
                this._toastService.error(err);
                this.dialogRef.close();
            }
        );
    }
}

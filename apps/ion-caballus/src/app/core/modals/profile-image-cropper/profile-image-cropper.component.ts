import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import Cropper from 'cropperjs';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-image-cropper',
    templateUrl: './profile-image-cropper.component.html',
    styleUrls: [`./profile-image-cropper.component.scss`]
})
export class ProfileImageCropperComponent implements OnInit, AfterViewInit {
    @ViewChild('image') public imageElement: ElementRef;
    @Input('src') public imageSource: SafeResourceUrl;
    public imageDestination: string;
    private cropper: Cropper;

    constructor(private _modalCtrl: ModalController, private _alertCtrl: AlertController) {
        this.imageDestination = '';
    }

    ngOnInit(): void { }

    public dismiss(data?: string): void {
        this._modalCtrl.dismiss(data);
    }

    ngAfterViewInit(): void {
        // create cropper object
        this.cropper = new Cropper(this.imageElement.nativeElement, {
            zoomable: false,
            scalable: false,
            aspectRatio: 1,
            background: false,
            initialAspectRatio: 1,
            responsive: false,
            rotatable: true,
            center: false,
            crop: (): void => {
                const canvas = this.cropper.getCroppedCanvas({
                    minWidth: 256,
                    minHeight: 256,
                    maxWidth: 4096,
                    maxHeight: 4096,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });
                this.imageDestination = canvas.toDataURL("image/png", 1);
            }
        });
    }

    /**
     * rotate image to left 90deg
     */
    public rotateImageLeft(): void {
        this.cropper.rotate(-90);
    }

    /**
     * rotate image to right 90deg
     */
    public rotateImageRight(): void {
        this.cropper.rotate(90);
    }

    public async closeCropper(): Promise<void> {
        const alert = await this._alertCtrl.create({
            header: 'Do you want to save this as the new profile image',
            buttons: [
                {
                    cssClass: 'cancel',
                    role: 'save',
                    text: 'Save'
                },
                {
                    cssClass: 'danger',
                    text: `Don't Save`,
                    role: `delete`
                }
            ]
        });
        await alert.present();
        const res = await alert.onDidDismiss();
        if (res.role === 'delete') {
            this.dismiss();
        } else {
            this.dismiss(this.imageDestination);
        }
    }
}

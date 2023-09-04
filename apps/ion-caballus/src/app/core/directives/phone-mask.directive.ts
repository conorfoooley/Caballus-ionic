import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';
const areaCodeNum = 3;
const exchangeCodeNum = 6;
const fullNum = 10;
@Directive({
    selector: '[formControlName][phoneMask]',
})
export class PhoneMaskDirective {

    constructor(private readonly _ngControl: NgControl) { }

    @HostListener('ngModelChange', ['$event'])
    public onModelChange(event: string): void {
        this.onInputChange(event, false);
    }

    @HostListener('keydown.backspace', ['$event'])
    public keydownBackspace(event: Event): void {
        this.onInputChange((<HTMLInputElement> event.target).value, true);
    }

    public onInputChange(event: string, backspace: boolean): void {
        let newVal = event.replace(/\D/g, '');
        if (backspace && newVal.length <= exchangeCodeNum) {
            newVal = newVal.substring(0, newVal.length - 1);
        }
        if (newVal.length === 0) {
            newVal = '';
        } else if (newVal.length <= areaCodeNum) {
            newVal = newVal.replace(/^(\d{0,3})/, '($1)');
        } else if (newVal.length <= exchangeCodeNum) {
            newVal = newVal.replace(/^(\d{0,3})(\d{0,3})/, '($1) $2');
        } else if (newVal.length <= fullNum) {
            newVal = newVal.replace(/^(\d{0,3})(\d{0,3})(\d{0,4})/, '($1) $2-$3');
        } else {
            newVal = newVal.substring(0, fullNum);
            newVal = newVal.replace(/^(\d{0,3})(\d{0,3})(\d{0,4})/, '($1) $2-$3');
        }
        this._ngControl.valueAccessor.writeValue(newVal);
    }
}

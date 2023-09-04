import {BehaviorSubject} from "rxjs";
import {Injectable} from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class DataService {

    private isCheckedSubject = new BehaviorSubject<boolean>(false);
    public isChecked$ = this.isCheckedSubject.asObservable();

    constructor() { }

    public setCheckedValue(value: boolean) {
        this.isCheckedSubject.next(value);
    }
}

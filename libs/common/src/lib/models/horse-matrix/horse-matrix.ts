import { HorseMatrixType } from '../../enums';
import { BaseDoc } from '../base/base-doc';
import { HorseIdentityWithoutIds } from '../horse/horse-identity';

export class HorseMatrixWithoutIds extends BaseDoc {
  public _id: any;
  public horseMatrixType: HorseMatrixType | string;
  public rating: number;
  public notes: string;
  public evaluationId: any;
  public horseIdentity: HorseIdentityWithoutIds;
  public isCustom: boolean = false;
  public horseMatrixGroupTitle: string = '';

  constructor(params?: Partial<HorseMatrixWithoutIds>) {
    super(params);
    if (!!params) {
      this._id = params._id || this._id;
      this.evaluationId = params.evaluationId || this.evaluationId;
      this.horseIdentity = !!params.horseIdentity ? new HorseIdentityWithoutIds(params.horseIdentity) : this.horseIdentity;
      this.horseMatrixType = params.horseMatrixType || this.horseMatrixType;
      this.rating = typeof params.rating === 'number' ? params.rating : this.rating;
      this.notes = params.notes || this.notes || '';
      this.horseMatrixGroupTitle = params.horseMatrixGroupTitle || this.horseMatrixGroupTitle || '';
      this.isCustom = typeof params.isCustom === 'boolean'
        ? params.isCustom : this.isCustom;
    }
  }
}

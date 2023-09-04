import { HorseMatrixWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';

export class HorseMatrix extends HorseMatrixWithoutIds {
    public _id: ObjectId;
    public evaluationId: ObjectId;

    constructor(params?: Partial<HorseMatrix>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
            this.evaluationId = !!params.evaluationId ? parseObjectId(params.evaluationId) : this.evaluationId;
        }
    }
}

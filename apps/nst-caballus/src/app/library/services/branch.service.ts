import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { environment } from '@nst-caballus/env';

@Injectable()
export class BranchService {
    constructor(private _http: HttpService) {
    }

    public async createBranchUrl(data: unknown): Promise<string> {
        const branchData = {
            branch_key: environment.branch.key,
            data
        };
        try {
            // create branch url
            const branchInvitationUrl = await this._http.post(environment.branch.baseUrl, branchData).toPromise();
            return branchInvitationUrl.data?.url;
        } catch (e) {
            console.log(e);
            console.error('Branch link creation failed');
            // if branch create url fails, then create use default invitation url
            // the shortened URL domain.
            return environment.ionBaseUrl;
        }
    }
}

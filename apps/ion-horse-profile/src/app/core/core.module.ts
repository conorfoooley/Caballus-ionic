import { NgModule } from '@angular/core';
import { guards } from './routes/guards';

@NgModule({
    providers: [...guards]
})
export class CoreModule {}

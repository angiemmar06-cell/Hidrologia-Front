import { Routes } from '@angular/router';
import { MapComponent } from './components/map/map.component';
import { AboutComponent } from './components/about/about.component';
import { HelpComponent } from './components/help/help.component';
import { HomeComponent } from './components/home/home.component';
import { LoginFormComponent } from './components/forms/login-form/login-form.component';
import { LogoutFormComponent } from './components/forms/logout-form/logout-form.component';
import{CaucesFormComponent} from './components/forms/cauces-form/cauces-form.component';
import { EstacionesMonitoreoFormComponent} from './components/forms/estacionesmonitoreo-form/estacionesmonitoreo-form.component';
import { SubCuencasFormComponent } from './components/forms/subcuencas-form/subcuencas-form.component';

    
export const routes: Routes = [
    {path: '', redirectTo: '/home', pathMatch: 'full'},
    {path: 'home', component: HomeComponent},
    {path: 'help', component:HelpComponent},
    {path: 'about', component:AboutComponent},
    {path: 'map', component:MapComponent},
    {path: 'login-form', component:LoginFormComponent},
    {path: 'logout-form', component:LogoutFormComponent},
    {path: 'cauces-form', component:CaucesFormComponent},
    {path: 'estacionesmonitoreo-form', component:EstacionesMonitoreoFormComponent},
    {path: 'subcuencas-form', component:SubCuencasFormComponent},
];

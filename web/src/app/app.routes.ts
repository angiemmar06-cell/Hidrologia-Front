// Tabla de rutas del frontend.
// Le dice a Angular qué componente mostrar en el <router-outlet> según la URL del navegador.

import { Routes } from '@angular/router';

// Importamos cada componente que se puede mostrar como página
import { MapComponent } from './components/map/map.component';
import { AboutComponent } from './components/about/about.component';
import { HelpComponent } from './components/help/help.component';
import { HomeComponent } from './components/home/home.component';
import { LoginFormComponent } from './components/forms/login-form/login-form.component';
import { LogoutFormComponent } from './components/forms/logout-form/logout-form.component';
import { CaucesFormComponent } from './components/forms/cauces-form/cauces-form.component';
import { EstacionesMonitoreoFormComponent } from './components/forms/estacionesmonitoreo-form/estacionesmonitoreo-form.component';
import { SubCuencasFormComponent } from './components/forms/subcuencas-form/subcuencas-form.component';

// Cada objeto define: qué texto en la URL muestra qué componente
export const routes: Routes = [
    // Si la URL está vacía redirigimos a /home
    { path: '', redirectTo: '/home', pathMatch: 'full' },

    // Páginas generales del proyecto
    { path: 'home', component: HomeComponent },
    { path: 'help', component: HelpComponent },
    { path: 'about', component: AboutComponent },
    { path: 'map', component: MapComponent },

    // Páginas de login / logout (opcionales del Cap 7)
    { path: 'login-form', component: LoginFormComponent },
    { path: 'logout-form', component: LogoutFormComponent },

    // Páginas con los formularios CRUD de las 3 tablas de hidrografia
    { path: 'cauces-form', component: CaucesFormComponent },
    { path: 'estacionesmonitoreo-form', component: EstacionesMonitoreoFormComponent },
    { path: 'subcuencas-form', component: SubCuencasFormComponent },
];

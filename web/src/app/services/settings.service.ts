// Servicio que guarda las URLs base del proyecto.
// Cambiando "mode" pasamos de URLs locales (desarrollo) a URLs del servidor real (producción).

import { Injectable } from '@angular/core';

// providedIn: 'root' hace que sea único en toda la app (singleton)
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  // mode = 1 para desarrollo local, mode = 2 para producción
  public mode = 1;

  // URLs que usarán los componentes y servicios
  public API_URL;
  public GEOSERVER_URL;
  public WEB_URL;

  // Según el modo seleccionado asignamos un grupo de URLs u otro
  constructor() {
    if (this.mode == 1) {
      // Modo desarrollo: las URLs apuntan a los contenedores Docker en localhost
      this.API_URL = 'http://localhost:8001/';
      this.GEOSERVER_URL = 'http://localhost:8080/geoserver/';
      this.WEB_URL = 'http://localhost:4200/';
    } else if (this.mode == 2) {
      // Modo producción: las URLs apuntan al VPS real
      this.API_URL = 'https://gisserver.car.upv.es/desweb-api/';
      this.GEOSERVER_URL = 'https://gisserver.car.upv.es/geoserver/';
      this.WEB_URL = 'https://gisserver.car.upv.es/desweb/';
    }
  }
}

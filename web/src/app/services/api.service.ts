// Servicio Angular que centraliza todas las peticiones HTTP hacia la API de Django.
// Lo usan todos los componentes que necesiten leer o modificar datos del servidor.

import { Injectable } from '@angular/core';

// HttpClient: cliente HTTP de Angular para hacer peticiones GET/POST/PUT/DELETE.
// HttpHeaders: para definir las cabeceras de la petición (por ejemplo Content-Type).
// HttpParams: para enviar parámetros en la URL en peticiones GET.
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

// SettingsService guarda las URLs base del proyecto (API_URL, GEOSERVER_URL, etc.)
import { SettingsService } from './settings.service';

// providedIn: 'root' hace que este servicio sea único en toda la app (singleton)
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // Cabecera que indica al servidor que mandamos JSON en el body.
  // Django lee el body con json.loads(request.body), por eso debe ser application/json.
  headers = new HttpHeaders({
    'Content-Type': 'application/json'
  })

  // Inyectamos SettingsService (para tener la URL base) y HttpClient (para hacer las peticiones)
  constructor(public settingsService:SettingsService, private httpClient:HttpClient) { }

  // GET: para selectAll y selectOne. Devuelve un Observable al que el componente se suscribe.
  get(endPointUrl:string, getParams:HttpParams=new HttpParams({})){
    return this.httpClient.get<any>(this.settingsService.API_URL + endPointUrl,
      {
        headers: this.headers,
        responseType : 'json',
        reportProgress: false,
        params: getParams,
        // withCredentials envía cookies (necesario si más adelante usamos sesiones de login)
        withCredentials: true,
      })
  }

  // POST: para crear un registro nuevo. Manda los datos en el body como JSON.
  post(endPointUrl:string, postParams:{}={}){
    console.log('postParams',postParams);

    return this.httpClient.post<any>(
      this.settingsService.API_URL + endPointUrl,
      postParams,
      { headers: this.headers,
        responseType : 'json',
        reportProgress: false,
        withCredentials: true,
      }
    )
  }

  // PUT: para actualizar un registro existente. Se llama con la URL que incluye el id.
  put(endPointUrl: string, putParams: {} = {}) {
    return this.httpClient.put<any>(
      this.settingsService.API_URL + endPointUrl,
      putParams,
      { headers: this.headers,
        responseType: 'json',
        reportProgress: false,
        withCredentials: true,
      }
    )
  }

  // DELETE: para borrar un registro por id. No lleva body, solo la URL con el id.
  delete(endPointUrl: string) {
    return this.httpClient.delete<any>(
      this.settingsService.API_URL + endPointUrl,
      { headers: this.headers,
        responseType: 'json',
        reportProgress: false,
        withCredentials: true,
      }
    )
  }

  // Función auxiliar que convierte un objeto JS en query string (key=value&key2=value2).
  // Sirve para mandar datos como application/x-www-form-urlencoded.
  // Ahora no se usa porque mandamos JSON directamente, pero la dejamos por si se necesita más adelante.
  private generarHttpParamsDesdeObjeto(data: { [key: string]: string | number }): string {
    let params = new HttpParams();
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        params = params.set(key, data[key].toString());
      }
    }
    return params.toString();
  }
}

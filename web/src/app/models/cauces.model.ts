// Modelo que representa un cauce (un río) tal como lo devuelve la API de Django.
// Sirve para que TypeScript sepa qué campos esperamos y nos avise si nos confundimos.
export class CauceModel {
    public id: number = -1;
    public nombre: string = '';
    public tipo: string = '';
    public longitud_km: number = -1;
    public caudal_medio: number = -1;
    public estado_ecologico: string = '';
    // La geometría llega como texto WKT, por ejemplo: "LINESTRING (727000 4370000, 727500 4370000)"
    public geom: string = '';
    public data_creation: string = '';
}

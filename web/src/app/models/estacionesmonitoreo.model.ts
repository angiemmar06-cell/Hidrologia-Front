// Modelo que representa una estación de monitoreo tal como la devuelve la API de Django.
// Sirve para que TypeScript sepa qué campos esperamos y nos avise si nos confundimos.
export class EstacionMonitoreoModel {
    public id: number = -1;
    public nombre: string = '';
    public tipo: string = '';
    public organismo: string = '';
    public estado: string = '';
    public fecha_instalacion: string = '';
    // La geometría llega como texto WKT, por ejemplo: "POINT (728200 4371000)"
    public geom: string = '';
    public data_creation: string = '';
}

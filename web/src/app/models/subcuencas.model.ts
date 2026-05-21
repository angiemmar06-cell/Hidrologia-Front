// Modelo que representa una subcuenca tal como la devuelve la API de Django.
// Sirve para que TypeScript sepa qué campos esperamos y nos avise si nos confundimos.
export class SubCuencasModel {
    public id: number = -1;
    public nombre: string = '';
    public codigo: string = '';
    // area_km2 y perimetro_km los calcula Django automáticamente al guardar
    public area_km2: number = -1;
    public perimetro_km: number = -1;
    public uso_suelo: string = '';
    // La geometría llega como texto WKT, por ejemplo: "POLYGON ((730000 4370000, 730200 4370000, ...))"
    public geom: string = '';
    public data_creation: string = '';
}

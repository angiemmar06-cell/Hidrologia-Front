//esto lo copio y lo meto dentro de building front (en mi caso como se llame el mio)
// si tengo 3 modelos debo tener 3 ficheros queda en src/app/models/ y cada uno con su nombre, por ejemplo building.model.ts, server-answer.model.ts, etc. y cada uno con su clase exportada para poder usarla en otros archivos, por ejemplo en el api.service.ts para poder usar la clase ServerAnswerModel y hacer las peticiones http correspondientes a las respuestas del servidor

export class ServerAnswerModel {
    message: string='';
    ok: boolean = false;
    data: {
      [key: string]: any; // Permite otras propiedades dinámicas si las hay, numeros o cadenas
    }[]=[];
  }
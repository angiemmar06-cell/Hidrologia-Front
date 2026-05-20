//ell server answer model es el modelo que se va a usar para recibir las respuestas del servidor, y 
// el event model es el modelo que se va a usar para enviar eventos desde el front al back, por ejemplo 
// para enviar un evento de que se ha seleccionado un edificio, o un evento de que se ha seleccionado una subcuenca, etc. 
// y en el back se puede recibir ese evento y hacer lo que se quiera con esa información, por ejemplo hacer una consulta a la 
// base de datos para obtener la información del edificio seleccionado, o de la subcuenca seleccionada, etc.
export class EventModel {
    type: string='';
    data: any;
    constructor(type: string, data: any) {
        this.type = type;
        this.data = data;
    }
  }
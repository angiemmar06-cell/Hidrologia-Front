// Modelo que describe la forma de las respuestas que envía Django al frontend.
// Toda respuesta de la API tiene estos tres campos siempre: ok, message y data.

export class ServerAnswerModel {
    // Mensaje en español que Django devuelve (ejemplo: "Cauce insertado correctamente")
    message: string = '';

    // True si la operación salió bien, False si hubo error
    ok: boolean = false;

    // Lista de objetos con los datos del registro (vacía si no aplica)
    // Cada objeto puede tener cualquier propiedad porque depende de la tabla
    data: {
        [key: string]: any;
    }[] = [];
}

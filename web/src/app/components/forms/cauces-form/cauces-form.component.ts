// Componente Angular del formulario de Cauces.
// Maneja las 5 operaciones CRUD (insert, select, selectAll, update, delete) contra la API de Django.

// Component: para declarar el componente. OnInit: para ejecutar código cuando carga el componente.
import { Component, OnInit } from '@angular/core';

// CommonModule: trae las directivas básicas de Angular (@if, @for, ngClass, etc.)
import { CommonModule } from '@angular/common';

// Imports para formularios reactivos y para los inputs de Angular Material
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from "@angular/material/input";
import { MatTooltip } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

// FormControl: cada campo del formulario. FormGroup: agrupa los campos. Validators: reglas de validación.
import { FormControl } from '@angular/forms';
import { FormGroup, Validators } from '@angular/forms';

// ApiService: el mediador que envía peticiones HTTP a Django.
import { ApiService } from '../../../services/api.service';
// ServerAnswerModel: el formato de respuesta que devuelve Django ({ok, message, data}).
import { ServerAnswerModel } from '../../../models/server-answer.model';
// CauceModel: la forma de los datos de un cauce (id, nombre, geom, etc.).
import { CauceModel } from '../../../models/cauces.model';
// ActivatedRoute y Router: para leer parámetros de la URL.
import { ActivatedRoute, Router } from '@angular/router';

// Decorador que define las propiedades del componente
@Component({
  selector: 'app-cauces-form',
  standalone: true,
  // Los módulos que el HTML necesita para funcionar (botones, inputs, tooltips, etc.)
  imports: [
    CommonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatTooltip,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './cauces-form.component.html',
  styleUrl: './cauces-form.component.scss'
})
export class CaucesFormComponent implements OnInit {
  // Indica si la geometría vino como parámetro en la URL
  geomInUrl = false;
  // Lista que llena la tabla de resultados
  l: CauceModel[] = [];
  // Mensaje que se muestra al usuario tras cada operación
  serverMessage = '';

  // Cada FormControl representa un campo del formulario.
  // longitud_km y data_creation NO son obligatorios: Django/BD los rellenan solos.
  id = new FormControl('');
  nombre = new FormControl('', [Validators.required]);
  tipo = new FormControl('', [Validators.required]);
  longitud_km = new FormControl('');
  caudal_medio = new FormControl('', [Validators.required, Validators.min(0)]);
  estado_ecologico = new FormControl('', [Validators.required]);
  geom = new FormControl('', [Validators.required, Validators.minLength(10)]);
  data_creation = new FormControl('');

  // FormGroup agrupa todos los FormControls para validar y manejar el form a la vez
  // El form se considera válido solo si todos los campos obligatorios cumplen sus validaciones.
  controlsGroup = new FormGroup({
    id: this.id,
    nombre: this.nombre,
    tipo: this.tipo,
    longitud_km: this.longitud_km,
    caudal_medio: this.caudal_medio,
    estado_ecologico: this.estado_ecologico,
    geom: this.geom,
    data_creation: this.data_creation
  });

  // Inyectamos los servicios en el constructor.
  // ApiService manda las peticiones, ActivatedRoute lee parámetros de URL, Router navega entre páginas.
  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    public router: Router
  ) {}

  // ngOnInit se ejecuta una vez al cargar el componente.
  // Si la URL trae un parámetro ?geom=..., lo rellenamos en el campo geom del form.
  ngOnInit(): void {
    this.activatedRoute.queryParamMap.subscribe(params => {
      var geom = params.get("geom");
      if (geom) {
        this.geom.setValue(geom);
        this.geomInUrl = true;
      }
    });
  }

  // Rellena el formulario con datos de prueba para facilitar tests rápidos
  fillForm(){
    this.nombre.setValue('Cauce Popular');
    this.tipo.setValue('Río');
    this.caudal_medio.setValue('24');
    this.estado_ecologico.setValue('estable');
    this.geom.setValue('LINESTRING (30 10, 10 30, 40 40)');
  }

  // INSERT: envía un POST a Django con los valores del form para crear un cauce nuevo
  insert() {
    this.serverMessage = '';
    console.log('hidrografia_django/views.py/', this.controlsGroup.valid);
    console.log(this.controlsGroup.value);
    // Solo enviamos los campos que el usuario rellena. id, longitud_km y data_creation los pone Django/BD.
    var values = {
      nombre: this.nombre.value,
      tipo: this.tipo.value,
      caudal_medio: this.caudal_medio.value,
      estado_ecologico: this.estado_ecologico.value,
      geom: this.geom.value,
    }
    //con subscribe enviamos la petición. next se ejecuta si Django responde con éxito y error si responde con error.
    this.apiService.post('hidrografia/cauces/', values).subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Guardamos el mensaje del insert para que no lo pise el del refrescar la tabla
        const mensajeInsert = response.message;
        if (response.ok) {
          // Rellenamos el form con los datos del cauce nuevo (incluye longitud_km y data_creation calculados)
          var row: CauceModel = response.data[0] as CauceModel;
          this.setDataInForm(row);
          // Refrescamos la tabla para que aparezca el cauce nuevo en la lista
          this.apiService.get('hidrografia/cauces/').subscribe({
            next: (r: ServerAnswerModel) => {
              this.l = r.data as CauceModel[];
              this.serverMessage = mensajeInsert;
            }
          });
        } else {
          this.serverMessage = mensajeInsert;
        }
      },
      error: (error:any) => {
        console.log(error);
        // Si Django devuelve un error, mostramos su mensaje en la pantalla
        this.serverMessage = error.error?.message || 'Error al conectar con el servidor'; // || es para el caso de que error.error.message no exista, así evitamos mostrar "undefined" al usuario.
        //Es así porque Angular envuelve la respuesta de Django dentro de su propio objeto de error.
        //
      }
    });
  }

  // SELECT ONE: busca un cauce por su id y rellena el form con sus datos
  select() {
    this.serverMessage = '';
    console.log(this.controlsGroup.value);
    // Si no hay id no tiene sentido buscar, avisamos y salimos
    if (!this.id.value) {
      console.log('Put an id');
      this.serverMessage = 'Put an id';
      return;
    }
    this.apiService.get('hidrografia/cauces/' + this.id.value + '/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        console.log('response.data', response.data);
        if (response.ok) {
          // Cargamos los datos del cauce en el formulario y limpiamos la tabla
          var d: CauceModel = response.data[0] as CauceModel;
          this.setDataInForm(d);
          this.clearList();
        }
        this.serverMessage = response.message;
      },
      error: (error: any) => {
        console.log(error);
        // Aquí cae cuando Django responde 404 (cauce no encontrado). Mostramos el mensaje.
        this.serverMessage = error.error?.message || 'Error al conectar con el servidor';
      }
    });
  }

  // SELECT ALL: trae todos los cauces y los muestra en la tabla
  selectAll() {
    this.serverMessage = '';
    this.apiService.get('hidrografia/cauces/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Asignamos los datos recibidos a la lista que pinta la tabla del HTML
        this.l = response.data as CauceModel[];
        this.serverMessage = response.message;
      },
      error: (error: any) => {
        console.log(error);
        this.serverMessage = error.error?.message || 'Error al conectar con el servidor';
      }
    });
  }

  // DELETE: borra un cauce por id y refresca la tabla
  deleteRow() {
    this.serverMessage = '';
    console.log(this.controlsGroup.value);
    if (!this.id.value) {
      console.log('Put an id');
      this.serverMessage = 'Put an id';
      return;
    }
    this.apiService.delete('hidrografia/cauces/' + this.id.value + '/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Guardamos el mensaje del delete antes de refrescar la tabla,
        // para que no lo sobrescriba el mensaje del refresh ("Cauces recuperados").
        const mensajeDelete = response.message;
        if (response.ok) {
          this.clearForm();
          // Refrescamos la tabla y al final asignamos el mensaje del delete
          this.apiService.get('hidrografia/cauces/').subscribe({
            next: (r: ServerAnswerModel) => {
              this.l = r.data as CauceModel[];
              this.serverMessage = mensajeDelete;
            }
          });
        } else {
          this.serverMessage = mensajeDelete;
        }
      },
      error: (error: any) => {
        console.log(error);
        this.serverMessage = error.error?.message || 'Error al conectar con el servidor';
      }
    });
  }

  // UPDATE: actualiza un cauce existente por id y refresca la tabla
  update() {
    this.serverMessage = '';
    console.log(this.controlsGroup.value);
    if (!this.id.value) {
      console.log('Put an id');
      this.serverMessage = 'Put an id';
      return;
    }
    this.apiService.put('hidrografia/cauces/' + this.id.value + '/', this.controlsGroup.value).subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        console.log('response.data', response.data);
        // Guardamos el mensaje del update para que no lo pise el del refresh
        const mensajeUpdate = response.message;
        if (response.ok) {
          this.apiService.get('hidrografia/cauces/').subscribe({
            next: (r: ServerAnswerModel) => {
              this.l = r.data as CauceModel[];
              this.serverMessage = mensajeUpdate;
            }
          });
        } else {
          this.serverMessage = mensajeUpdate;
        }
      },
      error: (error: any) => {
        console.log(error);
        this.serverMessage = error.error?.message || 'Error al conectar con el servidor';
      }
    });
  }

  // Vacía todos los campos del formulario
  clearForm() {
    this.controlsGroup.reset();
  }

  // Vacía la tabla de resultados
  clearList() {
    this.l = [];
  }

  // Rellena los campos del form con los datos de un cauce recibido del servidor.
  // Los números se convierten a string porque los FormControls son de tipo string.
  setDataInForm(data: CauceModel) {
    this.id.setValue(data.id.toString());
    this.nombre.setValue(data.nombre);
    this.tipo.setValue(data.tipo);
    this.longitud_km.setValue(data.longitud_km.toString());
    this.caudal_medio.setValue(data.caudal_medio.toString());
    this.estado_ecologico.setValue(data.estado_ecologico);
    this.geom.setValue(data.geom);
    this.data_creation.setValue(data.data_creation);
  }

  // Si la geometría vino como parámetro en la URL, la cargamos en el form (útil para el Cap 10)
  useGeomInUrl() {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.geom.setValue(params.get("geom"));
    });
  }
}

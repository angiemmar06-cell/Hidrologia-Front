// Componente Angular del formulario de Estaciones de Monitoreo.
// Maneja las 5 operaciones CRUD (insert, select, selectAll, update, delete) contra la API de Django.

import { Component, OnInit } from '@angular/core';

// CommonModule: trae las directivas básicas de Angular (@if, @for, ngClass, etc.)
import { CommonModule } from '@angular/common';

// Módulos para formularios reactivos e inputs de Angular Material
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from "@angular/material/input";
import { MatTooltip } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

// FormControl: cada campo. FormGroup: agrupa los campos. Validators: reglas de validación.
import { FormControl } from '@angular/forms';
import { FormGroup, Validators } from '@angular/forms';

// ApiService: el mediador que envía peticiones HTTP a Django.
import { ApiService } from '../../../services/api.service';
// ServerAnswerModel: el formato de respuesta que devuelve Django ({ok, message, data}).
import { ServerAnswerModel } from '../../../models/server-answer.model';
// EstacionMonitoreoModel: la forma de los datos de una estación.
import { EstacionMonitoreoModel } from '../../../models/estacionesmonitoreo.model';
// ActivatedRoute y Router: para leer parámetros de la URL.
import { ActivatedRoute, Router } from '@angular/router';

// Decorador que define las propiedades del componente
@Component({
  selector: 'app-estacionesmonitoreo-form',
  standalone: true,
  // Módulos que el HTML necesita para funcionar
  imports: [
    CommonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatTooltip,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './estacionesmonitoreo-form.component.html',
  styleUrl: './estacionesmonitoreo-form.component.scss'
})
export class EstacionesMonitoreoFormComponent implements OnInit {
  // Indica si la geometría vino como parámetro en la URL (para el mapa del Cap 10)
  geomInUrl = false;
  // Lista que llena la tabla de resultados
  l: EstacionMonitoreoModel[] = [];
  // Mensaje que se muestra al usuario tras cada operación
  serverMessage = '';

  // FormControls del formulario.
  // data_creation no es obligatorio: la BD la rellena sola por db_default.
  id = new FormControl('');
  nombre = new FormControl('', [Validators.required]);
  tipo = new FormControl('', [Validators.required]);
  organismo = new FormControl('', [Validators.required]);
  estado = new FormControl('', [Validators.required]);
  fecha_instalacion = new FormControl('', [Validators.required]);
  geom = new FormControl('', [Validators.required, Validators.minLength(7)]);
  data_creation = new FormControl('');

  // FormGroup agrupa todos los FormControls para validar y manejar el form a la vez
  controlsGroup = new FormGroup({
    id: this.id,
    nombre: this.nombre,
    tipo: this.tipo,
    organismo: this.organismo,
    estado: this.estado,
    fecha_instalacion: this.fecha_instalacion,
    geom: this.geom,
    data_creation: this.data_creation
  });

  // Inyectamos los servicios en el constructor.
  // ApiService manda peticiones, ActivatedRoute lee parámetros, Router navega.
  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    public router: Router
  ) {}

  // ngOnInit se ejecuta una vez al cargar el componente.
  // Si la URL trae ?geom=..., lo rellenamos en el campo geom del form.
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
    this.nombre.setValue('Estación test 1');
    this.tipo.setValue('Río');
    this.organismo.setValue('Organismo 1');
    this.estado.setValue('Activa');
    this.fecha_instalacion.setValue('2023-01-01');
    this.geom.setValue('POINT (728200.0 4371000.0)');
  }

  // INSERT: envía un POST a Django con los valores del form para crear una estación nueva
  insert() {
    this.serverMessage = '';
    console.log(this.controlsGroup.valid);
    console.log(this.controlsGroup.value);
    this.apiService.post('hidrografia/estaciones_monitoreo/', this.controlsGroup.value).subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Guardamos el mensaje del insert para que no lo pise el del refresh de la tabla
        const mensajeInsert = response.message;
        if (response.ok) {
          // Rellenamos el form con los datos de la estación nueva (incluye data_creation)
          var row: EstacionMonitoreoModel = response.data[0] as EstacionMonitoreoModel;
          this.setDataInForm(row);
          // Refrescamos la tabla para que aparezca la estación nueva en la lista
          this.apiService.get('hidrografia/estaciones_monitoreo/').subscribe({
            next: (r: ServerAnswerModel) => {
              this.l = r.data as EstacionMonitoreoModel[];
              this.serverMessage = mensajeInsert;
            }
          });
        } else {
          this.serverMessage = mensajeInsert;
        }
      },
      error: (error: any) => {
        console.log(error);
        // Si Django devuelve error (validación, no encontrado, etc.) mostramos su mensaje
        this.serverMessage = error.error?.message || 'Error al conectar con el servidor';
      }
    });
  }

  // SELECT ONE: busca una estación por su id y rellena el form con sus datos
  select() {
    this.serverMessage = '';
    console.log(this.controlsGroup.value);
    // Si no hay id no tiene sentido buscar, avisamos y salimos
    if (!this.id.value) {
      console.log('Put an id');
      this.serverMessage = 'Put an id';
      return;
    }
    this.apiService.get('hidrografia/estaciones_monitoreo/' + this.id.value + '/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        console.log('response.data', response.data);
        if (response.ok) {
          // Cargamos los datos de la estación en el formulario y limpiamos la tabla
          var d: EstacionMonitoreoModel = response.data[0] as EstacionMonitoreoModel;
          this.setDataInForm(d);
          this.clearList();
        }
        this.serverMessage = response.message;
      },
      error: (error: any) => {
        console.log(error);
        // Aquí cae cuando Django responde 404 (estación no encontrada). Mostramos el mensaje.
        this.serverMessage = error.error?.message || 'Error al conectar con el servidor';
      }
    });
  }

  // SELECT ALL: trae todas las estaciones y las muestra en la tabla
  selectAll() {
    this.serverMessage = '';
    this.apiService.get('hidrografia/estaciones_monitoreo/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Asignamos los datos recibidos a la lista que pinta la tabla del HTML
        this.l = response.data as EstacionMonitoreoModel[];
        this.serverMessage = response.message;
      },
      error: (error: any) => {
        console.log(error);
        this.serverMessage = error.error?.message || 'Error al conectar con el servidor';
      }
    });
  }

  // DELETE: borra una estación por id y refresca la tabla
  deleteRow() {
    this.serverMessage = '';
    console.log(this.controlsGroup.value);
    if (!this.id.value) {
      console.log('Put an id');
      this.serverMessage = 'Put an id';
      return;
    }
    this.apiService.delete('hidrografia/estaciones_monitoreo/' + this.id.value + '/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Guardamos el mensaje del delete antes de refrescar la tabla,
        // para que no lo sobrescriba el mensaje del refresh.
        const mensajeDelete = response.message;
        if (response.ok) {
          this.clearForm();
          // Refrescamos la tabla y al final asignamos el mensaje del delete
          this.apiService.get('hidrografia/estaciones_monitoreo/').subscribe({
            next: (r: ServerAnswerModel) => {
              this.l = r.data as EstacionMonitoreoModel[];
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

  // UPDATE: actualiza una estación existente por id y refresca la tabla
  update() {
    this.serverMessage = '';
    console.log(this.controlsGroup.value);
    if (!this.id.value) {
      console.log('Put an id');
      this.serverMessage = 'Put an id';
      return;
    }
    this.apiService.put('hidrografia/estaciones_monitoreo/' + this.id.value + '/', this.controlsGroup.value).subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        console.log('response.data', response.data);
        // Guardamos el mensaje del update para que no lo pise el del refresh
        const mensajeUpdate = response.message;
        if (response.ok) {
          this.apiService.get('hidrografia/estaciones_monitoreo/').subscribe({
            next: (r: ServerAnswerModel) => {
              this.l = r.data as EstacionMonitoreoModel[];
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

  // Rellena los campos del form con los datos de una estación recibida del servidor.
  // El id se convierte a string porque el FormControl es de tipo string.
  setDataInForm(data: EstacionMonitoreoModel) {
    this.id.setValue(data.id.toString());
    this.nombre.setValue(data.nombre);
    this.tipo.setValue(data.tipo);
    this.organismo.setValue(data.organismo);
    this.estado.setValue(data.estado);
    this.fecha_instalacion.setValue(data.fecha_instalacion);
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

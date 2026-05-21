// Componente Angular del formulario de Subcuencas.
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
// SubCuencasModel: la forma de los datos de una subcuenca.
import { SubCuencasModel } from '../../../models/subcuencas.model';
// ActivatedRoute y Router: para leer parámetros de la URL.
import { ActivatedRoute, Router } from '@angular/router';

// Decorador que define las propiedades del componente
@Component({
  selector: 'app-subcuencas-form',
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
  templateUrl: './subcuencas-form.component.html',
  styleUrl: './subcuencas-form.component.scss'
})
export class SubCuencasFormComponent implements OnInit {
  // Indica si la geometría vino como parámetro en la URL (para el mapa del Cap 10)
  geomInUrl = false;
  // Lista que llena la tabla de resultados
  l: SubCuencasModel[] = [];
  // Mensaje que se muestra al usuario tras cada operación
  serverMessage = '';

  // FormControls del formulario.
  // area_km2, perimetro_km y data_creation no son obligatorios: Django/BD los rellenan solos.
  id = new FormControl('');
  nombre = new FormControl('', [Validators.required]);
  codigo = new FormControl('', [Validators.required]);
  uso_suelo = new FormControl('', [Validators.required]);
  geom = new FormControl('', [Validators.required, Validators.minLength(20)]);
  area_km2 = new FormControl('');
  perimetro_km = new FormControl('');
  data_creation = new FormControl('');

  // FormGroup agrupa todos los FormControls para validar y manejar el form a la vez
  controlsGroup = new FormGroup({
    id: this.id,
    nombre: this.nombre,
    codigo: this.codigo,
    uso_suelo: this.uso_suelo,
    geom: this.geom,
    area_km2: this.area_km2,
    perimetro_km: this.perimetro_km,
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
    this.nombre.setValue('Subcuenca test 1');
    this.codigo.setValue('SC999');
    this.uso_suelo.setValue('forestal');
    this.geom.setValue('POLYGON((730000 4370000, 730200 4370000, 730200 4370200, 730000 4370200, 730000 4370000))');
  }

  // INSERT: envía un POST a Django con los valores del form para crear una subcuenca nueva
  insert() {
    this.serverMessage = '';
    console.log(this.controlsGroup.valid);
    console.log(this.controlsGroup.value);
    this.apiService.post('hidrografia/subcuencas/', this.controlsGroup.value).subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Guardamos el mensaje del insert para que no lo pise el del refresh de la tabla
        const mensajeInsert = response.message;
        if (response.ok) {
          // Rellenamos el form con los datos de la subcuenca nueva (incluye area_km2, perimetro_km y data_creation calculados)
          var row: SubCuencasModel = response.data[0] as SubCuencasModel;
          this.setDataInForm(row);
          // Refrescamos la tabla para que aparezca la subcuenca nueva en la lista
          this.apiService.get('hidrografia/subcuencas/').subscribe({
            next: (r: ServerAnswerModel) => {
              this.l = r.data as SubCuencasModel[];
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

  // SELECT ONE: busca una subcuenca por su id y rellena el form con sus datos
  select() {
    this.serverMessage = '';
    console.log(this.controlsGroup.value);
    // Si no hay id no tiene sentido buscar, avisamos y salimos
    if (!this.id.value) {
      console.log('Put an id');
      this.serverMessage = 'Put an id';
      return;
    }
    this.apiService.get('hidrografia/subcuencas/' + this.id.value + '/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        console.log('response.data', response.data);
        if (response.ok) {
          // Cargamos los datos de la subcuenca en el formulario y limpiamos la tabla
          var d: SubCuencasModel = response.data[0] as SubCuencasModel;
          this.setDataInForm(d);
          this.clearList();
        }
        this.serverMessage = response.message;
      },
      error: (error: any) => {
        console.log(error);
        // Aquí cae cuando Django responde 404 (subcuenca no encontrada). Mostramos el mensaje.
        this.serverMessage = error.error?.message || 'Error al conectar con el servidor';
      }
    });
  }

  // SELECT ALL: trae todas las subcuencas y las muestra en la tabla
  selectAll() {
    this.serverMessage = '';
    this.apiService.get('hidrografia/subcuencas/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Asignamos los datos recibidos a la lista que pinta la tabla del HTML
        this.l = response.data as SubCuencasModel[];
        this.serverMessage = response.message;
      },
      error: (error: any) => {
        console.log(error);
        this.serverMessage = error.error?.message || 'Error al conectar con el servidor';
      }
    });
  }

  // DELETE: borra una subcuenca por id y refresca la tabla
  deleteRow() {
    this.serverMessage = '';
    console.log(this.controlsGroup.value);
    if (!this.id.value) {
      console.log('Put an id');
      this.serverMessage = 'Put an id';
      return;
    }
    this.apiService.delete('hidrografia/subcuencas/' + this.id.value + '/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Guardamos el mensaje del delete antes de refrescar la tabla,
        // para que no lo sobrescriba el mensaje del refresh.
        const mensajeDelete = response.message;
        if (response.ok) {
          this.clearForm();
          // Refrescamos la tabla y al final asignamos el mensaje del delete
          this.apiService.get('hidrografia/subcuencas/').subscribe({
            next: (r: ServerAnswerModel) => {
              this.l = r.data as SubCuencasModel[];
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

  // UPDATE: actualiza una subcuenca existente por id y refresca la tabla
  update() {
    this.serverMessage = '';
    console.log(this.controlsGroup.value);
    if (!this.id.value) {
      console.log('Put an id');
      this.serverMessage = 'Put an id';
      return;
    }
    this.apiService.put('hidrografia/subcuencas/' + this.id.value + '/', this.controlsGroup.value).subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        console.log('response.data', response.data);
        // Guardamos el mensaje del update para que no lo pise el del refresh
        const mensajeUpdate = response.message;
        if (response.ok) {
          this.apiService.get('hidrografia/subcuencas/').subscribe({
            next: (r: ServerAnswerModel) => {
              this.l = r.data as SubCuencasModel[];
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

  // Rellena los campos del form con los datos de una subcuenca recibida del servidor.
  // Los números se convierten a string porque los FormControls son de tipo string.
  // Si area_km2 o perimetro_km no llegan (subcuenca nueva sin guardar todavía), ponemos cadena vacía.
  setDataInForm(data: SubCuencasModel) {
    this.id.setValue(data.id.toString());
    this.nombre.setValue(data.nombre);
    this.codigo.setValue(data.codigo);
    this.uso_suelo.setValue(data.uso_suelo);
    this.geom.setValue(data.geom);
    this.area_km2.setValue(data.area_km2 != null ? data.area_km2.toString() : '');
    this.perimetro_km.setValue(data.perimetro_km != null ? data.perimetro_km.toString() : '');
    this.data_creation.setValue(data.data_creation);
  }

  // Si la geometría vino como parámetro en la URL, la cargamos en el form (útil para el Cap 10)
  useGeomInUrl() {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.geom.setValue(params.get("geom"));
    });
  }
}

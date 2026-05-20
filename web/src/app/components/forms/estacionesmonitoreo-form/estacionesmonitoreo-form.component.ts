import { Component, OnInit } from '@angular/core';

//To use the template syntax @if, @for, ...
import { CommonModule } from '@angular/common';

//To use forms 
//  Import in the imports on the component the following
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from "@angular/material/input"; //angular material must be installed before
import { MatTooltip } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

//To use the controls in the component
//  Import in the imports on the component the following
import { FormControl } from '@angular/forms';
import { FormGroup, Validators } from '@angular/forms'; //FormGroup para agrupar controles
//los validadores son para que si envia algo que no es real se mande un error, por ejemplo si el area es un numero negativo, o si la descripcion es muy corta, etc.

import { ApiService } from '../../../services/api.service';
import { ServerAnswerModel } from '../../../models/server-answer.model';
import { EstacionMonitoreoModel } from '../../../models/estacionesmonitoreo.model';
import { ActivatedRoute, Router } from '@angular/router';

//una vez estan importados con @component, se pueden usar en el template html, por ejemplo para crear un formulario con los controles definidos en el componente, o para mostrar la lista de datos obtenida del servidor, etc. 
//decorador: 
@Component({
  selector: 'app-estacionesmonitoreo-form',
  standalone: true,
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
  geomInUrl = false; //esto es para saber si el parametro geom viene en la url, por ejemplo para mostrarlo en el formulario, o para usarlo en alguna consulta al servidor, etc.
  l: EstacionMonitoreoModel[] = [];
  serverMessage = '';

  //Form component creation
  //data_creation es readonly: la BD la rellena
  id = new FormControl('');
  nombre = new FormControl('', [Validators.required]);
  tipo = new FormControl('', [Validators.required]);
  organismo = new FormControl('', [Validators.required]);
  estado = new FormControl('', [Validators.required]);
  fecha_instalacion = new FormControl('', [Validators.required]);
  geom = new FormControl('', [Validators.required, Validators.minLength(7)]);
  data_creation = new FormControl('');

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

  //Pay attention to::
  //  - Services must be injected in the constructor
  //  - Services are not imported in the component, in the imports array
  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.subscribe(params => {
      var geom = params.get("geom");
      if (geom) {
        this.geom.setValue(geom);
        this.geomInUrl = true;
      }
    });
  }

  fillForm(){
    this.id.setValue('99');
    this.nombre.setValue('Estación test 1');
    this.tipo.setValue('Río');
    this.organismo.setValue('Organismo 1');
    this.estado.setValue('Activa');
    this.fecha_instalacion.setValue('2023-01-01');
    this.geom.setValue('POINT (30 10)');
  }

  insert() {
    this.serverMessage = '';
    console.log(this.controlsGroup.valid);
    console.log(this.controlsGroup.value);
    this.apiService.post('hidrografia/estaciones_monitoreo/', this.controlsGroup.value).subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Guardamos el mensaje del insert para que no lo pise el del selectAll
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
    }); //subscribe
  }

  select() {
    this.serverMessage = '';
    console.log(this.controlsGroup.value);
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
    }); //subscribe
  }

  selectAll() {
    this.serverMessage = '';
    this.apiService.get('hidrografia/estaciones_monitoreo/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        this.l = response.data as EstacionMonitoreoModel[];
        this.serverMessage = response.message;
      },
      error: (error: any) => {
        console.log(error);
        this.serverMessage = error.error?.message || 'Error al conectar con el servidor';
      }
    }); //subscribe
  }

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
        // Guardamos el mensaje del delete para que no lo pise el del selectAll
        const mensajeDelete = response.message;
        if (response.ok) {
          this.clearForm();
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
    }); //subscribe
  }

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
        // Guardamos el mensaje del update para que no lo pise el del selectAll
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
    }); //subscribe
  }

  clearForm() {
    this.controlsGroup.reset();
  }

  clearList() {
    this.l = [];
  }

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

  useGeomInUrl() {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.geom.setValue(params.get("geom"));
    });
  }
}
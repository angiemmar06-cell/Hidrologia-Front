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
import { CauceModel } from '../../../models/cauces.model';
import { ActivatedRoute, Router } from '@angular/router';

//una vez estan importados con @component, se pueden usar en el template html, por ejemplo para crear un formulario con los controles definidos en el componente, o para mostrar la lista de datos obtenida del servidor, etc. 
//decorador: 
@Component({
  selector: 'app-cauces-form',
  standalone: true,
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
  geomInUrl = false; //esto es para saber si el parametro geom viene en la url, por ejemplo para mostrarlo en el formulario, o para usarlo en alguna consulta al servidor, etc.
  l: CauceModel[] = [];
  serverMessage = '';

  //Form component creation
  id = new FormControl('');
  nombre = new FormControl('', [Validators.required]); //los validadores son esos ultimos
  tipo = new FormControl('', [Validators.required]);
  longitud_km = new FormControl('', [Validators.required, Validators.min(0)]);
  caudal_medio = new FormControl('', [Validators.required, Validators.min(0)]);
  estado_ecologico = new FormControl('', [Validators.required]);
  geom = new FormControl('', [Validators.required, Validators.minLength(10)]);
  data_creation = new FormControl('');

  //Create a form group to eval the data at once -- crear grupo para evaluar todos los componentes a la vez, por ejemplo para enviar los datos al servidor, o para validar que todos los campos son correctos antes de enviar los datos al servidor, etc.
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
    this.nombre.setValue('Cauce test 1');
    this.tipo.setValue('Río');
    this.longitud_km.setValue('100');
    this.caudal_medio.setValue('50');
    this.estado_ecologico.setValue('Bueno');
    this.geom.setValue('LINESTRING (30 10, 10 30, 40 40)');
    this.data_creation.setValue(new Date().toISOString());
  }

  insert() {
    this.serverMessage = '';
    console.log('hidrografia_django/views.py/', this.controlsGroup.valid);
    console.log(this.controlsGroup.value);
    var values = { //valores que necesita la base de datos
      nombre: this.nombre.value,
      tipo: this.tipo.value,
      caudal_medio: this.caudal_medio.value,
      estado_ecologico: this.estado_ecologico.value,
      geom: this.geom.value,
    }
    this.apiService.post('hidrografia/cauces/', values).subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Guardamos el mensaje del insert para que no lo pise el del refresh de la tabla
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
    this.apiService.get('hidrografia/cauces/' + this.id.value + '/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        console.log('response.data', response.data);
        if (response.ok) {
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
    }); //subscribe
  }

  selectAll() {
    this.serverMessage = '';
    this.apiService.get('hidrografia/cauces/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        this.l = response.data as CauceModel[];
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
    this.apiService.delete('hidrografia/cauces/' + this.id.value + '/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Guardamos el mensaje del delete antes de refrescar la tabla,
        // para que no lo sobrescriba el mensaje de "Cauces recuperados".
        const mensajeDelete = response.message;
        if (response.ok) {
          this.clearForm();
          // Refrescamos la tabla pero asignamos el mensaje del delete al final
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
    this.apiService.put('hidrografia/cauces/' + this.id.value + '/', this.controlsGroup.value).subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        console.log('response.data', response.data);
        // Guardamos el mensaje del update antes de refrescar la tabla
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
    }); //subscribe
  }

  clearForm() {
    this.controlsGroup.reset();
  }

  clearList() {
    this.l = [];
  }

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

  useGeomInUrl() {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.geom.setValue(params.get("geom"));
    });
  }
}
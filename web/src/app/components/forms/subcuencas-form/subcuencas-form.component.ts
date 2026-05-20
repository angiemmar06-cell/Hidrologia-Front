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
import { SubCuencasModel } from '../../../models/subcuencas.model';
import { ActivatedRoute, Router } from '@angular/router';

//una vez estan importados con @component, se pueden usar en el template html, por ejemplo para crear un formulario con los controles definidos en el componente, o para mostrar la lista de datos obtenida del servidor, etc. 
//decorador: 
@Component({
  selector: 'app-subcuencas-form',
  standalone: true,
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
  geomInUrl = false; //esto es para saber si el parametro geom viene en la url, por ejemplo para mostrarlo en el formulario, o para usarlo en alguna consulta al servidor, etc.
  l: SubCuencasModel[] = [];
  serverMessage = '';

  //Form component creation
  //area_km2, perimetro_km y data_creation son readonly: Django/BD los rellenan
  id = new FormControl('');
  nombre = new FormControl('', [Validators.required]);
  codigo = new FormControl('', [Validators.required]);
  uso_suelo = new FormControl('', [Validators.required]);
  geom = new FormControl('', [Validators.required, Validators.minLength(20)]);
  area_km2 = new FormControl('');
  perimetro_km = new FormControl('');
  data_creation = new FormControl('');

  //Create a form group to eval the data at once
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
    this.nombre.setValue('Subcuenca test 1');
    this.codigo.setValue('SC999');
    this.uso_suelo.setValue('forestal');
    this.geom.setValue('POLYGON((730000 4370000, 730200 4370000, 730200 4370200, 730000 4370200, 730000 4370000))');
  }

  insert() {
    this.serverMessage = '';
    console.log(this.controlsGroup.valid);
    console.log(this.controlsGroup.value);
    this.apiService.post('hidrografia/subcuencas/', this.controlsGroup.value).subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Guardamos el mensaje del insert para que no lo pise el del selectAll
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
    this.apiService.get('hidrografia/subcuencas/' + this.id.value + '/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        console.log('response.data', response.data);
        if (response.ok) {
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
    }); //subscribe
  }

  selectAll() {
    this.serverMessage = '';
    this.apiService.get('hidrografia/subcuencas/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        this.l = response.data as SubCuencasModel[];
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
    this.apiService.delete('hidrografia/subcuencas/' + this.id.value + '/').subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        // Guardamos el mensaje del delete para que no lo pise el del selectAll
        const mensajeDelete = response.message;
        if (response.ok) {
          this.clearForm();
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
    this.apiService.put('hidrografia/subcuencas/' + this.id.value + '/', this.controlsGroup.value).subscribe({
      next: (response: ServerAnswerModel) => {
        console.log('response', response);
        console.log('response.data', response.data);
        // Guardamos el mensaje del update para que no lo pise el del selectAll
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
    }); //subscribe
  }

  clearForm() {
    this.controlsGroup.reset();
  }

  clearList() {
    this.l = [];
  }

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

  useGeomInUrl() {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.geom.setValue(params.get("geom"));
    });
  }
}
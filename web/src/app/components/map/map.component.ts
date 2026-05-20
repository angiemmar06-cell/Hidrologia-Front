import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ElementRef} from '@angular/core';



//My imports
import { MapService } from '../../services/map.service';
import { DrawBuildingComponent } from '../draw-building/draw-building.component';
import { DrawFlowerComponent } from '../draw-flower/draw-flower.component';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [DrawBuildingComponent, DrawFlowerComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy{
  //Referemce to the map div
  //It is available in this.mapContainer.nativeElement
  //! is a non-null assertion operator. Means that the variable is not null or undefined
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  //Usually only to inject services
  constructor(public mapService: MapService) {}
  

  //Called when the component is created
  //It is called before the template objects are created
  //but after the constructor
  ngOnInit(): void {

  }

  //After the template objects are created.
  //This method is called after ngOnInit
  //It is necessary to give time to build the component, so
  // de div with the id map is created
  //and the map can be created
  ngAfterViewInit(): void {
    console.log('mapComponent initialized');
    this.mapService.map.setTarget(this.mapContainer.nativeElement);
    console.log('Mapa reasociado al nuevo DOM');
  }

  ngOnDestroy(): void {
    if (this.mapService.map) {
      // Cuando el componente se destruye, es CRUCIAL 
      // desvincular el mapa del elemento DOM.
      // Si no lo haces, OpenLayers puede intentar renderizar 
      // en un elemento inexistente,
      // lo que puede causar errores o pérdidas de memoria.
      this.mapService.map.setTarget(undefined);

      console.log('Mapa desvinculado del DOM antes de destruir el componente');
    }
  }
}

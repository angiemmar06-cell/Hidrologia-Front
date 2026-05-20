import { Injectable } from '@angular/core';

//OpenLayers
import Map from 'ol/Map';
import View from 'ol/View';
import Layer from 'ol/layer/Layer'; // Tipo base para cualquier capa
import BaseLayer from 'ol/layer/Base'; // Puedes importarlo si lo necesi
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { Projection } from 'ol/proj';
import LayerGroup from 'ol/layer/Group';
import MousePosition from 'ol/control/MousePosition.js';
import {createStringXY} from 'ol/coordinate.js';
import Interaction from 'ol/interaction/Interaction'; // Importa la clase Interaction
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom'; // Importa MouseWheelZoom
import DragPan from 'ol/interaction/DragPan';             // Importa DragPan

//vector layers
import { Vector as VectorLayer} from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
//layerswitcher
import LayerSwitcher from 'ol-layerswitcher';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  //Map can be a Map or undefined
  map: Map;
  baseLayersGroup:LayerGroup;
  myLayersGroup:LayerGroup;

  constructor(public settingsService: SettingsService) { 
      this.baseLayersGroup= this.createBaseLayers();
      this.myLayersGroup= this.createMyLayers();
      this.map= this.createMap();//Create the map and store it in the mapService
      this.addLayerSwitcherControl();
      this.addMousePositionControl();
  }

  createBaseLayers(): LayerGroup {
    var pnoa = new TileLayer({
      properties: {
            title: 'Cadastre WMS'
          },
      source: new TileWMS(({
        url: "https://www.ign.es/wms-inspire/pnoa-ma?",
        params: {"LAYERS": "OI.OrthoimageCoverage", 'VERSION': "1.3.0", "TILED": "true", "TYPE": 'base', "FORMAT": "image/png"},
      }))
    });

    var catastro= new TileLayer({
          properties: {
            title: 'Cadastre WMS',
          },
          source: new TileWMS({
          url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
          // crossOrigin: '*', (En capas del ign y catastro no se pone crossOrigin)
          params: {
            'LAYERS': 'Catastro', 'VERSION': '1.1.1', 'TILED': true, 'TRANSPARENT': true, 'FORMAT': 'image/png'
          }
        })
      });

    const baseLayersGroup = new LayerGroup({
        properties: {
          title: 'Base Layers',
        },
        layers: [pnoa, catastro]
      });
     return baseLayersGroup;
  }

  createMyLayers(): LayerGroup {
    var buildings= new TileLayer({
        properties: {
          title: 'Buildings WMS'
        },
        source: new TileWMS({
          url: this.settingsService.GEOSERVER_URL + 'wms?',
          params: {
            'LAYERS': 'buildings_buildings', 'VERSION': '1.3.0', 'TILED': true, 'TRANSPARENT': true, 'FORMAT': 'image/png'
          }
        })
      });
    var buildingsVectorSource = new VectorSource({wrapX: false}); 
    var buildingsVectorLayer = new VectorLayer({
      source: buildingsVectorSource,
      properties: {
        title: 'Buildings vector' // <--- Define el título aquí
        // Puedes añadir otras propiedades personalizadas aquí si es necesario
        // Por ejemplo: isBaseLayer: false, description: 'Capa para edificios'
      }   
    });//The layer were we will draw

    var myLayersGroup = new LayerGroup({
        properties: {
          title: 'My layers'
        },
        layers: [buildings, buildingsVectorLayer]
      });
    return myLayersGroup;
  }


  createMap(): Map { 
    let epsg25830:Projection;
    epsg25830=new Projection({
      code:'EPSG:25830',
      extent: [-729785.76,3715125.82,945351.10,9522561.39],
      units: 'm'
    });
    var map: Map = new Map({
      controls: [],
      view: new View({
        center: [729035,4373419],
        zoom: 14,
        projection: epsg25830,
      }),
      layers: [this.baseLayersGroup, this.myLayersGroup],
      target: undefined
    }); 
    return map;
  }

  addLayerSwitcherControl() {
    const layerSwitcher = new LayerSwitcher(
      {
        activationMode: 'mouseover',
        startActive: true,
        tipLabel: 'Show-hide layers',
        groupSelectStyle: 'group',
        reverse: false
      }
    );
    this.map.addControl(layerSwitcher); //! --> tells typescript that map is not undefined
    
  }
  addMousePositionControl(){
      //Adds the mouse coordinate position to the map
      const mousePositionControl = new MousePosition({
        coordinateFormat: createStringXY(0),
        projection: 'EPSG:25830',
        // comment the following two lines to have the mouse position
        // be placed within the map.
        //className: 'custom-mouse-position',
        //target: document.getElementById('map_mouse_position_control'),
        //undefinedHTML: '----------------------'
      });
      this.map.addControl(mousePositionControl);//! --> tells typescript that map is not undefined
  }

  /**
   * Busca una capa en el mapa (o dentro de LayerGroups) por su propiedad 'title'.
   *
   * @param title El título de la capa a buscar.
   * @param layers La colección de capas a buscar (normalmente map.getLayers() o group.getLayers()).
   * @returns El objeto de la capa si se encuentra, o undefined.
   */
  getLayerByTitle(title: string, layers?: BaseLayer[]): Layer<any> | undefined {
    // Si no se proporciona una colección de capas, empezamos desde la raíz del mapa
    const currentLayers = layers || this.map.getLayers().getArray();

    for (const baseLayer of currentLayers) {
      // 1. Comprobar si es un Layer y tiene el título
      if (this.isLayer(baseLayer)) {
        const layerProperties = baseLayer.getProperties();
        if (layerProperties && layerProperties['title'] === title) {
          //console.log(`Capa '${title}' encontrada!`, baseLayer);
          return baseLayer;
        }
      }
      // 2. Comprobar si es un LayerGroup y buscar recursivamente dentro de él
      else if (this.isLayerGroup(baseLayer)) {
        //console.log(`Entrando en el grupo de capas: ${baseLayer.getProperties()['title'] || 'Unnamed Group'}`);
        const foundLayerInGroup = this.getLayerByTitle(title, baseLayer.getLayers().getArray());
        if (foundLayerInGroup) {
          return foundLayerInGroup; // Capa encontrada dentro de este grupo
        }
      }
    }
    //console.log(`Capa '${title}' no encontrada en la jerarquía actual.`);
    return undefined; // No se encontró ninguna capa con ese título en este nivel o sus subgrupos
  }

  /**
 * Función de guardia de tipo para determinar si un BaseLayer es un Layer (y no un LayerGroup).
 * @param layer El objeto BaseLayer a comprobar.
 * @returns true si el objeto es una instancia de ol/layer/Layer, false en caso contrario.
 */
  private isLayer(layer: BaseLayer): layer is Layer<any> {
    // Una forma robusta es comprobar si tiene el método getSource.
    // LayerGroup no tiene getSource.
    return (layer as Layer<any>).getSource !== undefined;

    // Otra forma si ol/layer/Layer es una clase concreta y no abstracta en tu versión:
    // return layer instanceof Layer; // Esto puede dar problemas si Layer es abstracta o si la importación no es directa.
    // La comprobación de `getSource` es más fiable en este caso.
  } 

  // Helper para verificar si un BaseLayer es un LayerGroup (y tiene .getLayers())
  private isLayerGroup(layer: BaseLayer): layer is LayerGroup {
    return (layer as LayerGroup).getLayers !== undefined;
  }

  disableMapInteractions(): void {
    if (this.map) {
      this.map.getInteractions().forEach((interaction: Interaction) => {
        // Comprueba si la interacción NO es una instancia de MouseWheelZoom o DragPan
        if (!(interaction instanceof MouseWheelZoom) && !(interaction instanceof DragPan)) {
          interaction.setActive(false);
        }
      });
    }
  }
}

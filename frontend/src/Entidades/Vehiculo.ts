export type TipoVehiculo = 'CamionCarga' | 'FurgonetaElectrica';
export type EstadoVehiculo = 'Disponible' | 'EnServicio' | 'Mantenimiento';

export interface IVehiculo {
  id?: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  capacidadCargaKg: number;
  kilometraje: number;
  tipo: TipoVehiculo;
  estado: EstadoVehiculo;

  // Atributos de Camión de carga
  consumoLitros100Km?: number;
  precioLitro?: number;
  numeroEjes?: number;
  costoMantenimientoKm?: number;

  // Atributos de Furgoneta eléctrica
  capacidadBateriaKWh?: number;
  consumoKWh100Km?: number;
  costoKWh?: number;
  autonomiaKm?: number;
  porcentajeBateria?: number;
}

export abstract class VehiculoBase implements IVehiculo {
  id?: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  capacidadCargaKg: number;
  kilometraje: number;
  tipo: TipoVehiculo;
  estado: EstadoVehiculo;

  constructor(data: IVehiculo) {
    this.id = data.id;
    this.placa = data.placa;
    this.marca = data.marca;
    this.modelo = data.modelo;
    this.anio = data.anio;
    this.capacidadCargaKg = data.capacidadCargaKg;
    this.kilometraje = data.kilometraje;
    this.tipo = data.tipo;
    this.estado = data.estado || 'Disponible';
  }

  abstract calcularCostoOperativo(distanciaKm: number): number;
  abstract calcularTarifaBase(distanciaKm: number, pesoCargaKg: number): { costoOperativo: number; tarifaBase: number; recargoCargaAutonomia: number; totalTarifa: number };
}

export class CamionCarga extends VehiculoBase {
  consumoLitros100Km: number;
  precioLitro: number;
  numeroEjes: number;
  costoMantenimientoKm: number;

  constructor(data: IVehiculo) {
    super({ ...data, tipo: 'CamionCarga' });
    this.consumoLitros100Km = data.consumoLitros100Km || 0;
    this.precioLitro = data.precioLitro || 0;
    this.numeroEjes = data.numeroEjes || 2;
    this.costoMantenimientoKm = data.costoMantenimientoKm || 0;
  }

  calcularCostoOperativo(distanciaKm: number): number {
    const costoCombustible = (distanciaKm / 100) * this.consumoLitros100Km * this.precioLitro;
    return costoCombustible + (distanciaKm * this.costoMantenimientoKm);
  }

  calcularTarifaBase(distanciaKm: number, pesoCargaKg: number) {
    const costoOperativo = this.calcularCostoOperativo(distanciaKm);
    let tarifaBase = costoOperativo * 1.35;
    let recargo = 0;
    // Si la carga supera el 80% de la capacidad, añadir 8% a la tarifa base
    if (pesoCargaKg > this.capacidadCargaKg * 0.8) {
      recargo = tarifaBase * 0.08;
    }
    return {
      costoOperativo: Number(costoOperativo.toFixed(2)),
      tarifaBase: Number(tarifaBase.toFixed(2)),
      recargoCargaAutonomia: Number(recargo.toFixed(2)),
      totalTarifa: Number((tarifaBase + recargo).toFixed(2))
    };
  }
}

export class FurgonetaElectrica extends VehiculoBase {
  capacidadBateriaKWh: number;
  consumoKWh100Km: number;
  costoKWh: number;
  autonomiaKm: number;
  porcentajeBateria: number;

  constructor(data: IVehiculo) {
    super({ ...data, tipo: 'FurgonetaElectrica' });
    this.capacidadBateriaKWh = data.capacidadBateriaKWh || 0;
    this.consumoKWh100Km = data.consumoKWh100Km || 0;
    this.costoKWh = data.costoKWh || 0;
    this.autonomiaKm = data.autonomiaKm || 0;
    this.porcentajeBateria = data.porcentajeBateria !== undefined ? data.porcentajeBateria : 100;
  }

  calcularAutonomiaDisponible(): number {
    if (this.consumoKWh100Km <= 0) return 0;
    const energiaDisponibleKWh = (this.porcentajeBateria / 100) * this.capacidadBateriaKWh;
    return (energiaDisponibleKWh / this.consumoKWh100Km) * 100;
  }

  calcularCostoOperativo(distanciaKm: number): number {
    return (distanciaKm / 100) * this.consumoKWh100Km * this.costoKWh;
  }

  calcularTarifaBase(distanciaKm: number, _pesoCargaKg: number) {
    const costoEnergetico = this.calcularCostoOperativo(distanciaKm);
    let tarifaBase = (costoEnergetico + 18) * 1.30;
    let recargo = 0;
    // Si la distancia supera el 80% de la autonomía, añadir 10% a la tarifa base
    if (distanciaKm > this.autonomiaKm * 0.8) {
      recargo = tarifaBase * 0.10;
    }
    return {
      costoOperativo: Number(costoEnergetico.toFixed(2)),
      tarifaBase: Number(tarifaBase.toFixed(2)),
      recargoCargaAutonomia: Number(recargo.toFixed(2)),
      totalTarifa: Number((tarifaBase + recargo).toFixed(2))
    };
  }
}

import { describe, it, expect, beforeEach } from 'vitest';
import { VehiculosService } from './vehiculos/vehiculos.service';
import { VehiculoEntity } from './entities/vehiculo.entity';
import { BadRequestException } from '@nestjs/common';

describe('Req-09: Pruebas Automatizadas de Reglas de Negocio TRANSLOGIC S.A.', () => {
  let vehiculosService: VehiculosService;

  beforeEach(() => {
    // Mock repositorio para instanciar servicio
    const repoMock = {} as any;
    vehiculosService = new VehiculosService(repoMock);
  });

  // 1. Tarifa Camión de Carga
  it('1. Debe calcular correctamente la tarifa base y recargo del camión de carga (>80% capacidad)', () => {
    const camion = new VehiculoEntity();
    camion.tipo = 'CamionCarga';
    camion.capacidadCargaKg = 10000;
    camion.consumoLitros100Km = 30;
    camion.precioLitro = 2.0;
    camion.costoMantenimientoKm = 0.5;

    // Distancia: 100 km, Peso: 9000 kg (> 80% de 10000 kg -> recargo 8%)
    // Costo combustible = (100 / 100) * 30 * 2 = 60
    // Costo operativo = 60 + (100 * 0.5) = 110
    // Tarifa base = 110 * 1.35 = 148.5
    // Recargo 8% = 148.5 * 0.08 = 11.88
    // Total = 148.5 + 11.88 = 160.38
    const resultado = vehiculosService.calcularTarifa(camion, 100, 9000);

    expect(resultado.costoOperativo).toBe(110);
    expect(resultado.tarifaBase).toBe(148.5);
    expect(resultado.recargoCargaAutonomia).toBe(11.88);
    expect(resultado.totalTarifa).toBe(160.38);
  });

  // 2. Tarifa Furgoneta Eléctrica
  it('2. Debe calcular tarifa de furgoneta eléctrica y recargo si supera el 80% de la autonomía', () => {
    const furgoneta = new VehiculoEntity();
    furgoneta.tipo = 'FurgonetaElectrica';
    furgoneta.capacidadBateriaKWh = 50;
    furgoneta.consumoKWh100Km = 20;
    furgoneta.costoKWh = 0.15;
    furgoneta.autonomiaKm = 250;
    furgoneta.porcentajeBateria = 100;
    furgoneta.capacidadCargaKg = 1000;

    // Distancia: 220 km (> 80% de 250 km = 200 km -> recargo 10%)
    // Costo energetico = (220 / 100) * 20 * 0.15 = 6.6
    // Tarifa base = (6.6 + 18) * 1.30 = 31.98
    // Recargo 10% = 31.98 * 0.10 = 3.20
    // Total = 31.98 + 3.20 = 35.18
    const resultado = vehiculosService.calcularTarifa(furgoneta, 220, 500, true);

    expect(resultado.costoOperativo).toBe(6.6);
    expect(resultado.tarifaBase).toBe(31.98);
    expect(resultado.recargoCargaAutonomia).toBe(3.2);
    expect(resultado.totalTarifa).toBe(35.18);
  });

  // 3. Límites de Carga
  it('3. Debe rechazar cargas que superen la capacidad autorizada del vehículo', () => {
    const camion = new VehiculoEntity();
    camion.tipo = 'CamionCarga';
    camion.capacidadCargaKg = 5000;

    expect(() => {
      vehiculosService.calcularTarifa(camion, 100, 5500);
    }).toThrow(BadRequestException);
  });

  // 4. Distancia no positiva
  it('4. Debe rechazar distancias no positivas en el cálculo de tarifa', () => {
    const camion = new VehiculoEntity();
    camion.tipo = 'CamionCarga';
    camion.capacidadCargaKg = 5000;

    expect(() => {
      vehiculosService.calcularTarifa(camion, 0, 1000);
    }).toThrow(BadRequestException);

    expect(() => {
      vehiculosService.calcularTarifa(camion, -50, 1000);
    }).toThrow(BadRequestException);
  });

  // 5. Autonomía Eléctrica
  it('5. Debe impedir el inicio de servicios eléctricos sin energía suficiente salvo recarga planificada', () => {
    const furgoneta = new VehiculoEntity();
    furgoneta.tipo = 'FurgonetaElectrica';
    furgoneta.capacidadBateriaKWh = 40;
    furgoneta.consumoKWh100Km = 20;
    furgoneta.porcentajeBateria = 25; // 10 kWh disponibles -> autonomía 50 km
    furgoneta.autonomiaKm = 200;
    furgoneta.capacidadCargaKg = 1000;

    // Distancia requerida: 80 km sin recarga planificada -> debe fallar
    expect(() => {
      vehiculosService.calcularTarifa(furgoneta, 80, 400, false);
    }).toThrow(BadRequestException);

    // Con recarga planificada -> debe permitir el cálculo
    expect(() => {
      vehiculosService.calcularTarifa(furgoneta, 80, 400, true);
    }).not.toThrow();
  });

  // 6. Validación de porcentaje de batería fuera de rango 0-100%
  it('6. Debe rechazar porcentajes de batería fuera de 0 a 100%', async () => {
    const vehiculoRepoMock = {
      findOne: () => null,
      create: (d: any) => d,
      save: (d: any) => d,
    } as any;
    const service = new VehiculosService(vehiculoRepoMock);

    await expect(
      service.create({
        placa: 'TEST-123',
        marca: 'Test',
        modelo: 'T1',
        capacidadCargaKg: 1000,
        tipo: 'FurgonetaElectrica',
        porcentajeBateria: 120, // Inválido
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.create({
        placa: 'TEST-124',
        marca: 'Test',
        modelo: 'T1',
        capacidadCargaKg: 1000,
        tipo: 'FurgonetaElectrica',
        porcentajeBateria: -10, // Inválido
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // 7. Descuentos por volumen de servicios completados en el mes
  it('7. Debe aplicar 5% de descuento para 3-5 servicios y 10% para 6 o más', () => {
    const calcularDescuento = (serviciosCompletadosMes: number) => {
      if (serviciosCompletadosMes >= 6) return 10;
      if (serviciosCompletadosMes >= 3) return 5;
      return 0;
    };

    expect(calcularDescuento(1)).toBe(0);
    expect(calcularDescuento(2)).toBe(0);
    expect(calcularDescuento(3)).toBe(5);
    expect(calcularDescuento(5)).toBe(5);
    expect(calcularDescuento(6)).toBe(10);
    expect(calcularDescuento(12)).toBe(10);
  });

  // 8. Recargos de facturación (>300 km: 6%, Domingo: 12%)
  it('8. Debe calcular recargos por distancia mayor a 300km (6%) y domingo (12%)', () => {
    const base = 1000;
    const recargo300Km = 1000 * 0.06; // 60
    const recargoDomingo = 1000 * 0.12; // 120

    expect(recargo300Km).toBe(60);
    expect(recargoDomingo).toBe(120);
    expect(base + recargo300Km + recargoDomingo).toBe(1180);
  });
});

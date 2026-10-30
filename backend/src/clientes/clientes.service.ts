import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClienteEntity } from '../entities/cliente.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(ClienteEntity)
    private readonly clienteRepo: Repository<ClienteEntity>,
  ) {}

  async findAll(page?: number, limit?: number) {
    if (page && limit) {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const [items, total] = await this.clienteRepo.findAndCount({
        order: { nombre: 'ASC' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      });
      return { items, total, page: pageNum, limit: limitNum };
    }
    return this.clienteRepo.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: string) {
    const cliente = await this.clienteRepo.findOne({ where: { id } });
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    return cliente;
  }

  async create(data: Partial<ClienteEntity>) {
    if (!data.identificacion || !data.nombre) {
      throw new BadRequestException('Identificación y nombre son requeridos');
    }
    const existe = await this.clienteRepo.findOne({ where: { identificacion: data.identificacion } });
    if (existe) {
      throw new BadRequestException(`Ya existe un cliente con identificación ${data.identificacion}`);
    }
    const nuevo = this.clienteRepo.create(data);
    return this.clienteRepo.save(nuevo);
  }
}

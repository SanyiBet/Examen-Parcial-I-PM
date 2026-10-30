import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { ClienteEntity } from '../entities/cliente.entity';

@ApiTags('clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los clientes' })
  async findAll() {
    return this.clientesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  async findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo cliente' })
  async create(@Body() body: Partial<ClienteEntity>) {
    return this.clientesService.create(body);
  }
}

import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { ClienteEntity } from '../entities/cliente.entity';

@ApiTags('clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (opcional)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad por página (opcional)' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.clientesService.findAll(page, limit);
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

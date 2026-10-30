import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuarioEntity } from '../entities/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepo: Repository<UsuarioEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, passwordPlain: string) {
    const user = await this.usuarioRepo.findOne({ where: { email } });
    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas o cuenta desactivada');
    }

    const passwordValida = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email, rol: user.rol, nombre: user.nombre };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        activo: user.activo,
      },
    };
  }

  async registrar(nombre: string, email: string, passwordPlain: string, rol: 'Administrador' | 'Operador' = 'Operador') {
    const existe = await this.usuarioRepo.findOne({ where: { email } });
    if (existe) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    const nuevo = this.usuarioRepo.create({
      nombre,
      email,
      passwordHash,
      rol,
      activo: true,
    });

    return this.usuarioRepo.save(nuevo);
  }
}

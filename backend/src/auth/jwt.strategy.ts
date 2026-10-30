import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioEntity } from '../entities/usuario.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepo: Repository<UsuarioEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'translogic-secret-key-2026',
    });
  }

  async validate(payload: { sub: string; email: string; rol: string }) {
    const user = await this.usuarioRepo.findOne({ where: { id: payload.sub, activo: true } });
    if (!user) {
      throw new UnauthorizedException('Token inválido o usuario inactivo');
    }
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    };
  }
}

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { AuthService } from './auth.service';

export class LoginDto {
  @ApiProperty({ example: 'admin@translogic.com' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'admin123' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticación de usuario' })
  @ApiResponse({ status: 200, description: 'Token de acceso generado exitosamente' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }
}

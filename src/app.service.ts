import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Holiii, porfa cierra esta ventana porfa :D';
  }
}

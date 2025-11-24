import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

const config = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.get('DATABASE_HOST'),
  port: parseInt(config.get('DATABASE_PORT', '5432')),
  username: config.get('DATABASE_USER'),
  password: config.get('DATABASE_PASSWORD'),
  database: config.get('DATABASE_NAME'),
  entities: [path.join(__dirname, '**', '*.entity.{ts,js}')],
  synchronize: config.get('SYNCHRONIZE') === 'true',
  logging: true,
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
});

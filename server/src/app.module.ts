import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/sqlite';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BrandsModule } from './brands/brands.module.js';
import { ProductsModule } from './products/products.module.js';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...defineConfig({
        dbName: 'data/db.sqlite3',
        entities: [], // forFeature() registrations are auto-loaded
        ensureDatabase: { create: true }, // creates the file and tables from metadata on first connect
      }),
      autoLoadEntities: true, // entities registered via forFeature() are added automatically
    }),
    BrandsModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

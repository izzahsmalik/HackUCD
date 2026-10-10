import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/sqlite';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...defineConfig({
        dbName: 'data/db.sqlite3',
        entities: [], // no entities yet; forFeature() registrations are auto-loaded
        discovery: { warnWhenNoEntities: false }, // v7 throws on an empty entity list without this
      }),
      autoLoadEntities: true, // entities registered via forFeature() are added automatically
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

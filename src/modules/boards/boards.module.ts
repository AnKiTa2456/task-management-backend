import { Module }           from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService }    from './boards.service';
import { ActivityModule }   from '../activity/activity.module';

@Module({
  imports:     [ActivityModule],
  controllers: [BoardsController],
  providers:   [BoardsService],
})
export class BoardsModule {}

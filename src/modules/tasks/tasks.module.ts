import { Module }          from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService }    from './tasks.service';
import { ActivityModule }  from '../activity/activity.module';

@Module({
  imports:     [ActivityModule],
  controllers: [TasksController],
  providers:   [TasksService],
})
export class TasksModule {}

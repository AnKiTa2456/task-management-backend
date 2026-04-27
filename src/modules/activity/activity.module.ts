import { Module }              from '@nestjs/common';
import { ActivityController }  from './activity.controller';
import { ActivityService }     from './activity.service';

@Module({
  controllers: [ActivityController],
  providers:   [ActivityService],
  exports:     [ActivityService],   // exported so Tasks/Comments can inject it
})
export class ActivityModule {}

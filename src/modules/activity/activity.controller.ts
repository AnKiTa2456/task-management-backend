import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ActivityService } from './activity.service';

@ApiTags('Activity')
@ApiBearerAuth()
@Controller()
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  // GET /boards/:boardId/activity?page=1&limit=30
  @Get('boards/:boardId/activity')
  @ApiOperation({ summary: 'Get activity feed for a board' })
  @ApiQuery({ name: 'page',  required: false })
  @ApiQuery({ name: 'limit', required: false })
  getBoardActivity(
    @Param('boardId') boardId: string,
    @Query('page')  page:  string,
    @Query('limit') limit: string,
  ) {
    return this.activityService.getBoardActivity(
      boardId,
      parseInt(page  ?? '1',  10),
      parseInt(limit ?? '30', 10),
    );
  }

  // GET /tasks/:taskId/activity
  @Get('tasks/:taskId/activity')
  @ApiOperation({ summary: 'Get activity history for a specific task' })
  getTaskActivity(@Param('taskId') taskId: string) {
    return this.activityService.getTaskActivity(taskId);
  }
}

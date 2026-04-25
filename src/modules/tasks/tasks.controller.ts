import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiCreatedResponse, ApiOkResponse,
} from '@nestjs/swagger';
import { TasksService }   from './tasks.service';
import { CreateTaskDto }  from './dto/create-task.dto';
import { UpdateTaskDto, MoveTaskDto, AssignTaskDto } from './dto/update-task.dto';
import { FilterTaskDto }  from './dto/filter-task.dto';
import { CurrentUser }    from '../../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  // ── Scoped under a board ─────────────────────────────────────────────────

  // POST /boards/:boardId/tasks
  @Post('boards/:boardId/tasks')
  @ApiOperation({ summary: 'Create a new task on a board' })
  @ApiCreatedResponse({ description: 'Task created' })
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(user.id, dto);
  }

  // GET /boards/:boardId/tasks?status=TODO&priority=HIGH&page=1&limit=20
  @Get('boards/:boardId/tasks')
  @ApiOperation({ summary: 'List all tasks on a board (with filters and pagination)' })
  findAll(
    @Param('boardId') boardId: string,
    @Query() filters: FilterTaskDto,
  ) {
    return this.tasksService.findAll(boardId, filters);
  }

  // ── Single task endpoints ────────────────────────────────────────────────

  // GET /tasks/:id
  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task detail (includes comments)' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  // PATCH /tasks/:id
  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update task title, description, priority, status, labels' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, user.id, dto);
  }

  // PATCH /tasks/:id/move
  @Patch('tasks/:id/move')
  @ApiOperation({ summary: 'Move task to another column (drag-and-drop)' })
  move(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: MoveTaskDto,
  ) {
    return this.tasksService.move(id, user.id, dto);
  }

  // PATCH /tasks/:id/assign
  @Patch('tasks/:id/assign')
  @ApiOperation({ summary: 'Assign or unassign a user to a task' })
  assign(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: AssignTaskDto,
  ) {
    return this.tasksService.assign(id, user.id, dto);
  }

  // DELETE /tasks/:id
  @Delete('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task (creator only)' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.remove(id, user.id);
  }
}

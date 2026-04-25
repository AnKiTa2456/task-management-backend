import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommentsService }  from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { CurrentUser }      from '../../common/decorators/current-user.decorator';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller()
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  // GET /tasks/:taskId/comments
  @Get('tasks/:taskId/comments')
  @ApiOperation({ summary: 'List all comments for a task' })
  findAll(@Param('taskId') taskId: string) {
    return this.commentsService.findAll(taskId);
  }

  // POST /tasks/:taskId/comments
  @Post('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Add a comment to a task' })
  create(
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(taskId, user.id, dto);
  }

  // PATCH /comments/:id
  @Patch('comments/:id')
  @ApiOperation({ summary: 'Edit your own comment' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, user.id, dto);
  }

  // DELETE /comments/:id
  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete your own comment' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.remove(id, user.id);
  }
}

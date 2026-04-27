import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BoardsService }   from './boards.service';
import { CreateBoardDto, UpdateBoardDto, CreateColumnDto } from './dto/board.dto';
import { CurrentUser }     from '../../common/decorators/current-user.decorator';

@ApiTags('Boards')
@ApiBearerAuth()
@Controller('boards')
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  // GET /boards
  @Get()
  @ApiOperation({ summary: 'List all boards the user has access to' })
  findAll(@CurrentUser() user: any) {
    return this.boardsService.findAll(user.id);
  }

  // GET /boards/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get a full board with columns, tasks, and labels' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.boardsService.findOne(id, user.id);
  }

  // POST /boards
  @Post()
  @ApiOperation({ summary: 'Create a new board (auto-creates 4 default columns)' })
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateBoardDto,
  ) {
    return this.boardsService.create(user.id, dto);
  }

  // PATCH /boards/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Update board details (owner only)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardsService.update(id, user.id, dto);
  }

  // DELETE /boards/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a board and all its data (owner only)' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.boardsService.remove(id, user.id);
  }

  // POST /boards/:id/columns
  @Post(':id/columns')
  @ApiOperation({ summary: 'Add a new column to a board' })
  addColumn(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateColumnDto,
  ) {
    return this.boardsService.addColumn(id, user.id, dto);
  }

  // DELETE /boards/columns/:columnId
  @Delete('columns/:columnId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a column (owner only)' })
  removeColumn(
    @Param('columnId') columnId: string,
    @CurrentUser() user: any,
  ) {
    return this.boardsService.removeColumn(columnId, user.id);
  }
}

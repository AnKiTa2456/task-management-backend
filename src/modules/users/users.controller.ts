import {
  Controller, Get, Patch, Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService }    from './users.service';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { CurrentUser }     from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // GET /users/search?q=alice
  @Get('search')
  @ApiOperation({ summary: 'Search users by name or email (for task assignment)' })
  @ApiQuery({ name: 'q', required: true, example: 'alice' })
  search(@Query('q') q: string) {
    return this.usersService.search(q ?? '');
  }

  // GET /users/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get a user profile by ID' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // PATCH /users/profile
  @Patch('profile')
  @ApiOperation({ summary: 'Update the current user\'s profile' })
  updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  // PATCH /users/password
  @Patch('password')
  @ApiOperation({ summary: 'Change the current user\'s password' })
  changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }
}

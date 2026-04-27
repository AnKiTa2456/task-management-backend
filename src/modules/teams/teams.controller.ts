import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TeamsService }      from './teams.service';
import {
  CreateTeamDto, UpdateTeamDto,
  InviteMemberDto, UpdateMemberRoleDto,
} from './dto/team.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  // GET /teams
  @Get()
  @ApiOperation({ summary: "List all teams the user belongs to" })
  findAll(@CurrentUser() user: any) {
    return this.teamsService.findAll(user.id);
  }

  // GET /teams/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get team with members and boards' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.findOne(id, user.id);
  }

  // POST /teams
  @Post()
  @ApiOperation({ summary: 'Create a new team (creator becomes OWNER)' })
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateTeamDto,
  ) {
    return this.teamsService.create(user.id, dto);
  }

  // PATCH /teams/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Update team details (OWNER or ADMIN)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(id, user.id, dto);
  }

  // POST /teams/:id/members
  @Post(':id/members')
  @ApiOperation({ summary: 'Invite a user to the team by email (OWNER or ADMIN)' })
  invite(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: InviteMemberDto,
  ) {
    return this.teamsService.inviteMember(id, user.id, dto);
  }

  // PATCH /teams/:id/members/:userId
  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Update a member\'s role (OWNER or ADMIN)' })
  updateRole(
    @Param('id') id: string,
    @Param('userId') targetId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(id, targetId, user.id, dto);
  }

  // DELETE /teams/:id/members/:userId
  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from the team (OWNER or ADMIN)' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') targetId: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.removeMember(id, targetId, user.id);
  }
}

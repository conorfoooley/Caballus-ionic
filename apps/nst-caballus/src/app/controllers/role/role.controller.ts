import { Controller, Post, Body, Put, Param, Get, Delete, Query } from '@nestjs/common';
import { HorseRoleService, RoleService } from '@nst-caballus/dal';
import { LoggedInUser, Secured, WildCardPermission, Anonymous } from '@rfx/nst-permissions';
import { ApiOperation, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User, Permission, Role, HorseRole } from '@caballus/api-common';
import { RoleDto } from './dto/role.dto';
import { ObjectId, IdDto } from '@rfx/nst-db/mongo';
import { PaginatedListModel } from '@rfx/common';
import { RoleParamsDto } from './dto/role-params.dto';
import { IdListDto } from '../id-list.dto';
import { HorseRoleDto } from './dto/horse-role.dto';

@ApiBearerAuth()
@ApiTags('role')
@Controller('role')
export class RoleController {
    constructor(
        private readonly _roleService: RoleService,
        private readonly _horseRoleService: HorseRoleService
    ) {}

    @Get('')
    @ApiOperation({ summary: 'Get Roles' })
    @Secured(Permission.RoleView)
    public async getRoles(): Promise<Role[]> {
        return this._roleService.getRoles();
    }

    @Post('')
    @ApiOperation({ summary: 'Create Role' })
    @Secured(Permission.RoleCreate)
    public async createRole(@Body() dto: RoleDto): Promise<ObjectId> {
        return this._roleService.createRole(dto);
    }

    @Put('')
    @ApiOperation({ summary: 'Edit Role' })
    @Secured(Permission.RoleEdit)
    public async editRole(@Body() idDto: IdDto, @Body() dto: RoleDto): Promise<void> {
        return this._roleService.updateRole(idDto.id, dto);
    }

    @Delete('')
    @Secured(Permission.RoleDelete)
    public async deleteRoles(
        @Body() idListDto: IdListDto
    ): Promise<void> {
        return this._roleService.deleteRolesByIdList(idListDto.ids);
    }

    @Post('list')
    @ApiOperation({
        summary: 'Roles List',
        description: `List all active roles`
    })
    @ApiBearerAuth()
    @Secured(Permission.RoleView)
    public async listGridStringTermFilter(
        @Body() dto: RoleParamsDto
    ): Promise<PaginatedListModel<Role>> {
        return this._roleService.getGridRoles(dto.toRoleGridParams());
    }

    @Get('horseRoles')
    @ApiOperation({
        summary: 'Get HorseRoles',
        description: 'Get HorseRoles, excludes Owner role by default'
    })
    @Secured(WildCardPermission)
    public async getHorseRoles(
        @Query() horseRolesDto: HorseRoleDto,
    ): Promise<HorseRole[]> {
        return this._horseRoleService.getHorseRoles(horseRolesDto.includeOwner);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get Role' })
    @Secured(Permission.RoleView)
    public async getRole(@Param() idDto: IdDto, @LoggedInUser() user: User): Promise<Role> {
        return this._roleService.getRoleById(idDto.id);
    }

}

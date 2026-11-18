import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { CodeService } from './code.service';
import { CodeExecutionDto } from './dto/code-execution.dto';
import { CodeGenerateDto, ProjectGenerateDto } from './dto/code-generate.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('code')
export class CodeController {
  constructor(private readonly codeService: CodeService) {}

  @Public()
  @Post('execute')
  async executeCode(@Body() dto: CodeExecutionDto) {
    if (!dto.code || !dto.code.trim()) {
      throw new BadRequestException('Source code cannot be empty.');
    }
    return this.codeService.executeCode(dto);
  }

  @Public()
  @Post('generate')
  async generateCode(
    @Body() dto: CodeGenerateDto,
    @CurrentUser('id') userId?: string,
  ) {
    if (!dto.prompt || !dto.prompt.trim()) {
      throw new BadRequestException('Prompt cannot be empty.');
    }
    return this.codeService.generateCode(dto, userId);
  }

  @Public()
  @Post('project')
  async generateProject(
    @Body() dto: ProjectGenerateDto,
    @CurrentUser('id') userId?: string,
  ) {
    if (!dto.prompt || !dto.prompt.trim()) {
      throw new BadRequestException('Project prompt cannot be empty.');
    }
    return this.codeService.generateProject(dto.prompt, dto.template, userId);
  }
}

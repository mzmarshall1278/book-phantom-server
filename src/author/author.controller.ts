// src/author/author.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Patch,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { AuthorService } from './author.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { UserDocument } from '../user/schemas/user.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { AuthorDocument } from './schema/author.schema';

@Controller('authors')
export class AuthorController {
  constructor(
    private readonly authorService: AuthorService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('register-author')
  @HttpCode(HttpStatus.CREATED)
  async registerAuthor(@Body() createAuthorDto: CreateAuthorDto) {
    return this.authorService.createAuthor(createAuthorDto);
  }

  @Patch('update')
  @UseGuards(JwtAuthGuard)
  async updateAuthor(
    @Req() req: Request,
    @Body() updateAuthorDto: UpdateAuthorDto,
  ): Promise<AuthorDocument> {
    const user = req.user as UserDocument;
    return this.authorService.updateAuthor(user._id, updateAuthorDto);
  }

  @Post('upload-profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('profileImage')) // 'profileImage' is the field name in the form-data
  async uploadProfileImage(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'image',
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 2, // 2MB limit
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ): Promise<{ profileImageUrl: string }> {
    const user = req.user as UserDocument;
    const imageUrl = await this.s3Service.uploadFile(file);
    await this.authorService.updateAuthorProfileImage(user._id, imageUrl);
    return { profileImageUrl: imageUrl };
  }

  @Post('follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async follow(
    @Req() req: Request,
    @Body('authorId') authorId: string,
  ): Promise<void> { 
    const userId = (req.user as UserDocument)._id.toString();
    await this.authorService.followAuthor(userId, authorId);
  }

  @Post('unfollow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @Req() req: Request,
    @Body('authorId') authorId: string,
  ): Promise<void> {
    const userId = (req.user as UserDocument)._id.toString();
    await this.authorService.unfollowAuthor(userId, authorId);
  }
}
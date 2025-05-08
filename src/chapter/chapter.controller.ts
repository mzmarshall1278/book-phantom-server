import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Get,
  Put,
  Delete,
  UseInterceptors,
  UploadedFiles,
  UnauthorizedException,
} from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { AuthorJwtAuthGuard } from '../auth/guards/author-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Chapter } from './schemas/chapter.schema';
import { FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { ChapterAccessGuard } from './guards/chapter-access.guard';
import { ChapterRequestService } from './chapter-request.service';
import { BookService } from 'src/book/book.service';

@Controller('chapters')
export class ChapterController {
  constructor(
    private readonly chapterService: ChapterService,
    private readonly s3Service: S3Service,
    private readonly chapterRequestService: ChapterRequestService,
    private readonly bookService: BookService
  ) {}

  @UseGuards(AuthorJwtAuthGuard)
  @Post('new')
  @UseInterceptors(FilesInterceptor('images', 5, { /* optional file size limits etc. */ }))
  async createChapter(
    @Body() createChapterDto: CreateChapterDto,
    @Request() req: any, // req.user will contain the logged-in author
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return this.chapterService.create(req.user.id, createChapterDto, images);
  }

  // this gets all the chapters in a book with pagination
  @UseGuards(JwtAuthGuard, ChapterAccessGuard)
  @Get('/book/:id')
  async getBookChapters(@Param('id') bookId: string, @Param('page') page: number, @Param('limit') limit: number) {
    return this.bookService.fetchBookChapters(bookId, page, limit )
  }

  @UseGuards(JwtAuthGuard, ChapterAccessGuard)
  @Get(':id')
  async getChapterById(@Param('id') id: string): Promise<Chapter | null> {
    return this.chapterRequestService.getChapter();
  }

  @UseGuards(AuthorJwtAuthGuard)
  @Put(':id')
  async updateChapter(
    @Param('id') id: string,
    @Body() updateChapterDto: UpdateChapterDto,
    @Request() req: any,
  ): Promise<Chapter> {
    const author = req.user;
    const existingChapter = await this.chapterService.findById(id);
    if (!existingChapter.authors.map(a => a.toString()).includes(author.id.toString())) {
      throw new UnauthorizedException('You are not authorized to update this chapter.');
    }
    return this.chapterService.update(id, updateChapterDto);
  }

  @UseGuards(AuthorJwtAuthGuard)
  @Delete(':id')
  async deleteChapter(@Param('id') id: string, @Request() req: any): Promise<void> {
    const author = req.user;
    const chapterToDelete = await this.chapterService.findById(id);
    if (!chapterToDelete.authors.map(a => a.toString()).includes(author.id.toString())) {
      throw new UnauthorizedException('You are not authorized to delete this chapter.');
    }
    await this.chapterService.delete(id);
  }

  // @UseGuards(AuthorJwtAuthGuard)
  // @Post('preview')
  // async previewChapter(@Body() createChapterDto: CreateChapterDto): Promise<any> {
  //   // The dictionary will be fetched within the ChapterProcessingService by the ChaptersService
  //   // So, we don't need to fetch it here in the controller.
  //   return this.chapterService.preview(createChapterDto);
  // }
}
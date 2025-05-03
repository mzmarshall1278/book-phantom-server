import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Patch,
  Param,
  Query,
  Get,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  FileTypeValidator,
  MaxFileSizeValidator,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { AuthorDocument } from '../author/schema/author.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { LibraryService } from 'src/library/library.service';
import { BookDocument } from './schemas/book.schema';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService,
    private readonly libraryService: LibraryService
  ) {}

  @Post('new')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBook(@Req() req: Request, @Body() createBookDto: CreateBookDto) {
    const author = req.user as AuthorDocument;
    return this.bookService.createBook(author, createBookDto);
  }

  @Patch(':bookId')
  @UseGuards(JwtAuthGuard)
  async editBook(
    @Param('bookId') bookId: string,
    @Req() req: Request,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    const author = req.user as AuthorDocument;
    return this.bookService.editBook(bookId, author, updateBookDto);
  }

  @Post(':bookId/publish')
  @UseGuards(JwtAuthGuard)
  async publishBook(@Param('bookId') bookId: string, @Req() req: Request) {
    const author = req.user as AuthorDocument;
    return this.bookService.publishBook(bookId, author);
  }

  @Post(':bookId/cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('coverImage'))
  async uploadCoverImage(
    @Param('bookId') bookId: string,
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: 'image' })
        .addMaxSizeValidator({ maxSize: 1024 * 1024 * 2 }) // 2MB
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
  ) {
    const author = req.user as AuthorDocument;
    return this.bookService.uploadCoverImage(bookId, file, author);
  }

  @Post(':bookId/banner')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('bannerImage'))
  async uploadBannerImage(
    @Param('bookId') bookId: string,
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: 'image' })
        .addMaxSizeValidator({ maxSize: 1024 * 1024 * 2 }) // 2MB
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
  ) {
    const author = req.user as AuthorDocument;
    return this.bookService.uploadBannerImage(bookId, file, author);
  }

  @Get()
  async getAllBooks(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() filters: {
      title?: string;
      genre?: string;
      ageRating?: string;
      isPremium?: string;
      free?: string;
      isCompleted?: string;
    },
  ) {
    const parsedFilters: any = {};
    if (filters.title) parsedFilters.title = filters.title;
    if (filters.genre) parsedFilters.genre = filters.genre;
    if (filters.ageRating) parsedFilters.ageRating = filters.ageRating;
    if (filters.isPremium) parsedFilters.isPremium = filters.isPremium === 'true';
    if (filters.free) parsedFilters.isPremium = filters.free === 'false'; // Assuming free means isPremium is false
    if (filters.isCompleted) parsedFilters.isCompleted = filters.isCompleted === 'true';
    const skip = (page - 1) * limit;
    const [results, total] = await Promise.all([
      this.bookService.findAllBooksWithPagination(parsedFilters, skip, limit),
      this.bookService.countAllBooks(parsedFilters),
    ]);
    return {
      results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get(':bookId')
  async getBookById(@Param('bookId') bookId: string) {
    return this.bookService.findOneBookById(bookId);
  }

  @Get('users/library/books/:bookId')
  @UseGuards(JwtAuthGuard) // Assuming only logged-in users can access their library
  async getBookByIdForUserLibrary(@Param('bookId') bookId: string, @Req() req: Request) {
    const userId = (req.user as any)._id.toString();
    return this.bookService.findBookByIdInUserLibrary(bookId, userId);
  }

  @Get()
  async getUserLibrary(
    @Req() req: Request,
    @Query('page') page: string = '1', // Ensure default value is a string
    @Query('limit') limit: string = '10', // Ensure default value is a string
  ): Promise<{ items: BookDocument[]; total: number }> {
    const userId = (req.user as any)._id.toString();
    return this.libraryService.getUserLibrary(userId, parseInt(page, 10), parseInt(limit, 10));
  }

  @Get('search')
  async searchUserLibrary(
    @Req() req: Request,
    @Query('term') term: string,
    @Query('page') page: string = '1', // Ensure default value is a string
    @Query('limit') limit: string = '10', // Ensure default value is a string
  ): Promise<{ items: BookDocument[]; total: number }> {
    const userId = (req.user as any)._id.toString();
    return this.libraryService.searchUserLibrary(userId, term, parseInt(page, 10), parseInt(limit, 10));
  }

  @Get('byauthor/:authorId')
  async getBooksByAuthor(@Param('authorId') authorId: string) {
    return this.bookService.findBooksByAuthor(authorId);
  }

  @Post(':bookId/purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseBook(@Param('bookId') bookId: string, @Req() req: Request) {
    const userId = (req.user as any)._id.toString();
    return this.bookService.purchaseBook(userId, bookId, req);
  }

  @Get('purchase/success')
  @UseGuards(JwtAuthGuard)
  async purchaseSuccess(
    @Query('bookId') bookId: string,
    @Query('token') orderId: string, // Renamed 'token' to 'orderId' for clarity
    @Query('PayerID') payerId: string, // You might still want to log this
    @Req() req: Request,
  ) {
    const userId = (req.user as any)._id.toString();
    return this.bookService.finalizePurchase(userId, bookId, orderId);
  }

  @Get('purchase/cancel')
  @UseGuards(JwtAuthGuard)
  async purchaseCancel(@Query('bookId') bookId: string) {
    return { message: `Purchase of book with ID ${bookId} was cancelled.` };
  }

  @Post(':bookId/add-to-library')
  @UseGuards(JwtAuthGuard)
  async addBookToLibrary(@Param('bookId') bookId: string, @Req() req: Request) {
    const userId = (req.user as any)._id.toString();
    return this.bookService.addBookToLibrary(userId, bookId);
  }
}
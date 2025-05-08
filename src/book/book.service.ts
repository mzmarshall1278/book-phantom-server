import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument, BookStatus } from './schemas/book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Author, AuthorDocument } from '../author/schema/author.schema';
import { S3Service } from '../s3/s3.service';
import { LibraryService } from 'src/library/library.service';
import { UserDocument } from 'src/user/schemas/user.schema';
import { PayPalService } from 'src/paypal/paypal.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { Chapter } from 'src/chapter/schemas/chapter.schema';


const getId = (obj: Types.ObjectId | { _id?: Types.ObjectId }): string => {
  if (obj instanceof Types.ObjectId) {
    return obj.toString();
  }
  if (obj && typeof obj === 'object' && obj._id instanceof Types.ObjectId) {
    return obj._id.toString();
  }
  return ''; // Or handle the case where _id is missing
};

@Injectable()
export class BookService {
  private readonly logger = new Logger(BookService.name);
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<Chapter>,
    private readonly s3Service: S3Service,
    private readonly libraryService: LibraryService,
    private readonly payPalService: PayPalService,
    private readonly transactionService: TransactionService,
  ) {}

  async createBook(
    author: AuthorDocument,
    createBookDto: CreateBookDto,
  ): Promise<BookDocument> {
    const createdBook = new this.bookModel({
      ...createBookDto,
      authors: [author.id],
    });
    return createdBook.save();
  }

  async editBook(
    bookId: string,
    author: AuthorDocument,
    updateBookDto: UpdateBookDto,
  ): Promise<BookDocument> {
    const book = await this.bookModel.findById(bookId).exec();
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (
      !book.authors.some(
        (bookAuthor: AuthorDocument) =>
          getId(bookAuthor) === author.id.toString(),
      )
    ) {
      throw new UnauthorizedException('You are not the author of this book');
    }
    Object.assign(book, updateBookDto);
    return book.save();
  }

  async publishBook(
    bookId: string,
    author: AuthorDocument,
  ): Promise<BookDocument> {
    const book = await this.bookModel.findById(bookId).exec();
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (
      !book.authors.some(
        (bookAuthor: AuthorDocument) =>
          getId(bookAuthor._id) === author._id.toString(),
      )
    ) {
      throw new UnauthorizedException('You are not the author of this book');
    }
    if (book.isPremium && !book.isCompleted) {
      throw new BadRequestException(
        'Premium books must be completed before publishing',
      );
    }
    book.status = BookStatus.PUBLISHED;
    return book.save();
  }

  async uploadCoverImage(
    bookId: string,
    file: Express.Multer.File,
    author: AuthorDocument,
  ): Promise<{ coverImageUrl: string }> {
    const book = await this.bookModel.findById(bookId).exec();
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (
      !book.authors.some(
        (bookAuthor: AuthorDocument) =>
          getId(bookAuthor._id) === author._id.toString(),
      )
    ) {
      throw new UnauthorizedException('You are not the author of this book');
    }
    const imageUrl = await this.s3Service.uploadFile(file);
    book.coverImageUrl = imageUrl;
    await book.save();
    return { coverImageUrl: imageUrl };
  }

  async uploadBannerImage(
    bookId: string,
    file: Express.Multer.File,
    author: AuthorDocument,
  ): Promise<{ bannerImageUrl: string }> {
    const book = await this.bookModel.findById(bookId).exec();
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (
      !book.authors.some(
        (bookAuthor: AuthorDocument) =>
          getId(bookAuthor._id) === author._id.toString(),
      )
    ) {
      throw new UnauthorizedException('You are not the author of this book');
    }
    const imageUrl = await this.s3Service.uploadFile(file);
    book.bannerImageUrl = imageUrl;
    await book.save();
    return { bannerImageUrl: imageUrl };
  }

  async findAllBooksWithPagination(
    filters: {
      title?: string;
      genre?: string;
      ageRating?: string;
      isPremium?: boolean;
      free?: boolean;
      isCompleted?: boolean;
    },
    skip: number,
    limit: number,
  ): Promise<BookDocument[]> {
    const query: any = { status: BookStatus.PUBLISHED };
    if (filters.title) {
      query.title = { $regex: new RegExp(filters.title, 'i') };
    }
    if (filters.genre) {
      query.genre = filters.genre;
    }
    if (filters.ageRating) {
      query.ageRating = filters.ageRating;
    }
    if (filters.isPremium !== undefined) {
      query.isPremium = filters.isPremium;
    }
    if (filters.free !== undefined) {
      query.isPremium = !filters.free;
    }
    if (filters.isCompleted !== undefined) {
      query.isCompleted = filters.isCompleted;
    }
    return this.bookModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .populate('authors')
      .exec();
  }

  async countAllBooks(filters: {
    title?: string;
    genre?: string;
    ageRating?: string;
    isPremium?: boolean;
    free?: boolean;
    isCompleted?: boolean;
  }): Promise<number> {
    const query: any = { status: BookStatus.PUBLISHED };
    if (filters.title) {
      query.title = { $regex: new RegExp(filters.title, 'i') };
    }
    if (filters.genre) {
      query.genre = filters.genre;
    }
    if (filters.ageRating) {
      query.ageRating = filters.ageRating;
    }
    if (filters.isPremium !== undefined) {
      query.isPremium = filters.isPremium;
    }
    if (filters.free !== undefined) {
      query.isPremium = !filters.free;
    }
    if (filters.isCompleted !== undefined) {
      query.isCompleted = filters.isCompleted;
    }
    return this.bookModel.countDocuments(query).exec();
  }

  async findOneBookById(bookId: string): Promise<BookDocument> {
    const book = await this.bookModel
      .findById(bookId)
      .populate('authors')
      .populate('comments')
      .populate('likes')
      .exec();
    if (!book || book.status !== BookStatus.PUBLISHED) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async findBooksByAuthor(authorId: string): Promise<BookDocument[]> {
    return this.bookModel
      .find({ authors: authorId, status: BookStatus.PUBLISHED })
      .populate('authors')
      .exec();
  }

  async findBookByIdInUserLibrary(
    bookId: string,
    userId: string,
  ): Promise<BookDocument> {
    const book = await this.bookModel
      .findById(bookId)
      .populate('authors')
      .populate('comments')
      .populate('likes')
      .exec();
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const hasInLibrary = await this.libraryService.checkIfUserHasBook(
      userId,
      bookId,
    );

    if (hasInLibrary) {
      return book; // User has the book, grant access regardless of status
    }

    if (book.status !== BookStatus.PUBLISHED) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }

  async fetchBookChapters(
    bookId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const book = await this.bookModel.findById(bookId).exec();
    if (!book) {
      throw new NotFoundException(`Book with ID "${bookId}" not found.`);
    }

    const chapterIds = book.chapters.map((chapter) => chapter.toString());
    const skip = (page - 1) * limit;

    const [totalChapters, chapters] = await Promise.all([
      this.chapterModel.countDocuments({ _id: { $in: chapterIds } }).exec(),
      this.chapterModel
        .find({ _id: { $in: chapterIds } })
        .skip(skip)
        .limit(limit)
        .select('_id chapterNumber isCompleted chapterTitle') // Explicitly select the desired fields
        .sort({ chapterNumber: 1 })
        .exec(),
    ]);

    return {
      totalChapters,
      chapters: chapters.map((chapter) => ({
        chapterId: chapter._id.toString(),
        chapterNumber: chapter.chapterNumber,
        isCompleted: chapter.isCompleted,
        chapterTitle: chapter.chapterTitle,
      })),
    };
  }

  async purchaseBook(
    userId: string,
    bookId: string,
    req: any,
  ): Promise<{ paymentUrl?: string; message?: string }> {
    const book = await this.bookModel.findById(bookId);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (!book.isPremium) {
      throw new BadRequestException('This book is free. ');
    }

    if (book.price <= 0) {
      await this.libraryService.addBookToLibrary(userId, bookId);
      return {
        message:
          'This premium book has a price of zero. It has been added to your library.',
      };
    }

    const returnUrl = `${req.protocol}://${req.get('host')}/books/purchase/success?bookId=${bookId}`;
    const cancelUrl = `${req.protocol}://${req.get('host')}/books/purchase/cancel?bookId=${bookId}`;

    const approvalUrl = await this.payPalService.createOrder(
      book.title,
      book.price,
      returnUrl,
      cancelUrl,
    );

    if (approvalUrl) {
      return { paymentUrl: approvalUrl };
    } else {
      return { message: 'Failed to create PayPal order.' };
    }
  }

  async finalizePurchase(
    userId: string,
    bookId: string,
    token: string,
  ): Promise<string> {
    const book = await this.bookModel.findById(bookId);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    try {
      const captureResponse = await this.payPalService.captureOrder(token);
      if (captureResponse?.result?.status === 'COMPLETED') {
        this.logger.log(
          `Payment for book ${bookId} by user ${userId} successful. PayPal Order ID: ${captureResponse.result.id}`,
        );
        await this.libraryService.addBookToLibrary(userId, bookId);
        await this.transactionService.createTransaction(
          userId,
          bookId,
          captureResponse.result.id,
          captureResponse.result.status,
          book.price, // Assuming book.price is the correct amount
          captureResponse.result.payer?.payer_id,
        );
        return 'Payment successful. Book added to your library.';
      } else {
        this.logger.error(
          `Payment for book ${bookId} by user ${userId} failed. PayPal Response:`,
          captureResponse,
        );
        await this.transactionService.createTransaction(
          userId,
          bookId,
          token, // We might not have the order ID yet in a failure
          captureResponse?.result?.status || 'FAILED',
          book.price,
          captureResponse?.result?.payer?.payer_id,
        );
        return 'Payment failed.';
      }
    } catch (error) {
      this.logger.error(
        `Error finalizing payment for book ${bookId} by user ${userId}:`,
        error,
      );
      await this.transactionService.createTransaction(
        userId,
        bookId,
        token, // We might not have the order ID yet in an error
        'ERROR',
        book.price,
      );
      return 'Payment processing error.';
    }
  }

  async addBookToLibrary(
    userId: string,
    bookId: string,
  ): Promise<UserDocument> {
    const book = await this.bookModel.findById(bookId);
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (book.isPremium && book.price > 0) {
      throw new BadRequestException(
        'This is a premium book. You need to purchase it first.',
      );
    }
    return this.libraryService.addBookToLibrary(userId, bookId);
  }
}

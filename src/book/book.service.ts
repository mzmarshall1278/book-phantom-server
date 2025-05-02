import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument, BookStatus } from './schemas/book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { AuthorDocument } from '../author/schema/author.schema';
import { S3Service } from '../s3/s3.service';

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
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    private readonly s3Service: S3Service,
  ) {}

  async createBook(author: AuthorDocument, createBookDto: CreateBookDto): Promise<BookDocument> {
    const createdBook = new this.bookModel({ ...createBookDto, authors: [author._id] });
    return createdBook.save();
  }

  async editBook(bookId: string, author: AuthorDocument, updateBookDto: UpdateBookDto): Promise<BookDocument> {
    const book = await this.bookModel.findById(bookId).exec();
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (!book.authors.some((bookAuthor: AuthorDocument) => getId(bookAuthor._id) === author._id.toString())) {
      throw new UnauthorizedException('You are not the author of this book');
    }
    Object.assign(book, updateBookDto);
    return book.save();
  }

  async publishBook(bookId: string, author: AuthorDocument): Promise<BookDocument> {
    const book = await this.bookModel.findById(bookId).exec();
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (!book.authors.some((bookAuthor: AuthorDocument) => getId(bookAuthor._id) === author._id.toString())) {
      throw new UnauthorizedException('You are not the author of this book');
    }
    if (book.isPremium && !book.isCompleted) {
      throw new BadRequestException('Premium books must be completed before publishing');
    }
    book.status = BookStatus.PUBLISHED;
    return book.save();
  }

  async uploadCoverImage(bookId: string, file: Express.Multer.File, author: AuthorDocument): Promise<{ coverImageUrl: string }> {
    const book = await this.bookModel.findById(bookId).exec();
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (!book.authors.some((bookAuthor: AuthorDocument) => getId(bookAuthor._id) === author._id.toString())) {
      throw new UnauthorizedException('You are not the author of this book');
    }
    const imageUrl = await this.s3Service.uploadFile(file);
    book.coverImageUrl = imageUrl;
    await book.save();
    return { coverImageUrl: imageUrl };
  }

  async uploadBannerImage(bookId: string, file: Express.Multer.File, author: AuthorDocument): Promise<{ bannerImageUrl: string }> {
    const book = await this.bookModel.findById(bookId).exec();
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (!book.authors.some((bookAuthor: AuthorDocument) => getId(bookAuthor._id) === author._id.toString())) {
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
    return this.bookModel.find(query).skip(skip).limit(limit).populate('authors').exec();
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
    const book = await this.bookModel.findById(bookId).populate('authors').populate('comments').populate('likes').exec();
    if (!book || book.status !== BookStatus.PUBLISHED) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async findBooksByAuthor(authorId: string): Promise<BookDocument[]> {
    return this.bookModel.find({ authors: authorId, status: BookStatus.PUBLISHED }).populate('authors').exec();
  }

  async findBookByIdForUser(bookId: string, userId: string): Promise<BookDocument> {
    const book = await this.bookModel.findById(bookId).populate('authors').populate('comments').populate('likes').exec();
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    // Logic to check if the user has it in their library or has bought it
    // This logic would use the userId to query user's library/purchase history
    if (book.status === BookStatus.ARCHIVED) {
      // Placeholder: Implement your library/purchase check here
      // Example: const hasAccess = await this.libraryService.checkOwnership(userId, bookId);
      // if (hasAccess) return book;
      return book; // For now, allowing access if archived and found
    }
    if (book.status !== BookStatus.PUBLISHED) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }
}
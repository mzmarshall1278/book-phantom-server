import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Book, BookDocument } from '../book/schemas/book.schema';
import { AuthorDocument } from 'src/author/schema/author.schema';

const getId = (obj: Types.ObjectId | { _id: Types.ObjectId }): string => {
  if (obj instanceof Types.ObjectId) {
    return obj.toString();
  }
  return obj._id.toString();
};

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
  ) {}

  async addBookToLibrary(userId: string, bookId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    const book = await this.bookModel.findById(bookId);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const bookObjectId = book._id as Types.ObjectId;

    if (user.library.some((libraryBookId) => libraryBookId.equals(bookObjectId))) {
      throw new BadRequestException('Book is already in the user\'s library');
    }

    user.library.push(bookObjectId);
    return user.save();
  }

  async getUserLibrary(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ items: BookDocument[]; total: number }> {
    const user = await this.userModel.findById(userId).populate({
      path: 'library',
      model: 'Book',
      options: {
        skip: (page - 1) * limit,
        limit: limit,
      },
    }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const populatedLibrary = user.library as BookDocument[]; // Explicit cast
    const total = populatedLibrary.length;
    return { items: populatedLibrary, total };
  }

  async checkIfUserHasBook(userId: string, bookId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return false; // Or throw NotFoundException if user existence is assumed
    }
    return user.library.some((userBookId) => userBookId.equals(bookId));
  }

  async searchUserLibrary(
    userId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ items: BookDocument[]; total: number }> {
    const user = await this.userModel.findById(userId).populate({
      path: 'library',
      model: 'Book',
      populate: {
        path: 'authors',
        model: 'Author',
      },
      options: {
        skip: (page - 1) * limit,
        limit: limit,
      },
    }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const populatedLibrary = user.library as BookDocument[]; // Explicit cast
    const searchRegex = new RegExp(searchTerm, 'i');
    const filteredLibrary = populatedLibrary.filter((book: BookDocument) =>
      searchRegex.test(book.title) ||
      searchRegex.test(book.description) ||
      book.authors.some((author: AuthorDocument) => searchRegex.test(author.penName)),
    );

    const total = filteredLibrary.length;
    const paginatedResults = filteredLibrary.slice((page - 1) * limit, page * limit);

    return { items: paginatedResults, total };
  }
}
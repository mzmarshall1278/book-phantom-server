import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { InjectModel as InjectBookModel } from '@nestjs/mongoose';
import { Book, BookDocument } from '../book/schemas/book.schema';
import { ChapterProcessingService } from './chapter-processing.service';
import { S3Service } from '../s3/s3.service';
import { AuthorDocument } from 'src/author/schema/author.schema';

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
export class ChapterService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectBookModel(Book.name) private bookModel: Model<BookDocument>,
    private readonly chapterProcessingService: ChapterProcessingService,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    authorId: string,
    createChapterDto: CreateChapterDto,
    images?: Express.Multer.File[],
  ) {
    const book = await this.bookModel.findById(createChapterDto.bookId).exec();
    if (!book || !book.dictionary) {
      throw new NotFoundException(
        `Book with ID "${createChapterDto.bookId}" or its dictionary not found.`,
      );
    }

    if (
      !book.authors.some(
        (bookAuthor: AuthorDocument) =>
          getId(bookAuthor) === authorId.toString(),
      )
    ) {
      throw new UnauthorizedException(
        `You are not authorized to access this book"${createChapterDto.bookId}".`,
      );
    }

    const processedContent =
      this.chapterProcessingService.processChapterContent(
        createChapterDto.chapterText,
        createChapterDto.chapterTitle,
        book.dictionary,
      );

    const imageUrls: string[] = [];
    if (images && images.length > 0) {
      for (const image of images) {
        const url = await this.s3Service.uploadFile(image);
        imageUrls.push(url);
      }
    }

    const createdChapter = new this.chapterModel({
      ...createChapterDto,
      processedContent,
      authors: [authorId],
      imageUrls,
    });
    const savedChapter = await createdChapter.save();

    book.chapters.push(savedChapter.id);
    await book.save();
    return savedChapter;
  }

  async findById(id: string): Promise<Chapter> {
    const chapter = await this.chapterModel.findById(id).exec();
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID "${id}" not found`);
    }
    return chapter;
  }

  async update(
    id: string,
    updateChapterDto: UpdateChapterDto,
  ): Promise<Chapter> {
    const chapter = await this.chapterModel.findById(id).exec();
    if (!chapter || !chapter.bookId) {
      throw new NotFoundException(`Chapter with ID "${id}" not found.`);
    }
    const book = await this.bookModel.findById(chapter.bookId).exec();
    if (!book || !book.dictionary) {
      throw new NotFoundException(
        `Book associated with chapter ID "${id}" or its dictionary not found.`,
      );
    }

    const processedContent =
      this.chapterProcessingService.processChapterContent(
        updateChapterDto.chapterText || chapter.chapterText,
        updateChapterDto.chapterTitle || chapter.chapterTitle,
        book.dictionary,
      );

    const updatedChapter = await this.chapterModel
      .findByIdAndUpdate(
        id,
        { ...updateChapterDto, processedContent },
        { new: true },
      )
      .exec();
    if (!updatedChapter) {
      throw new NotFoundException(`Chapter with ID "${id}" not found`);
    }
    return updatedChapter;
  }

  async delete(id: string): Promise<void> {
    const result = await this.chapterModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Chapter with ID "${id}" not found`);
    }
  }

  async findAllByBookId(bookId: string): Promise<Chapter[]> {
    return this.chapterModel.find({ bookId }).exec();
  }

  async preview(createChapterDto: CreateChapterDto): Promise<any> {
    const book = await this.bookModel.findById(createChapterDto.bookId).exec();
    if (!book || !book.dictionary) {
      throw new NotFoundException(
        `Book with ID "${createChapterDto.bookId}" or its dictionary not found for preview.`,
      );
    }
    return this.chapterProcessingService.processChapterContent(
      createChapterDto.chapterText,
      createChapterDto.chapterTitle,
      book.dictionary,
    );
  }
}

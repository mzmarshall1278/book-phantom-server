import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ChapterService } from '../chapter.service';
import { LibraryService } from '../../library/library.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ChapterRequestService } from '../chapter-request.service';

@Injectable()
export class ChapterAccessGuard implements CanActivate {
  constructor(
    private readonly chaptersService: ChapterService,
    private readonly libraryService: LibraryService,
    private readonly jwtService: JwtService,
    private readonly chapterRequestService: ChapterRequestService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const chapterId = request.params.id;
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      if (!userId) {
        throw new UnauthorizedException('Invalid user ID in token');
      }

      const chapter = await this.chaptersService.findById(chapterId);
      if (!chapter) {
        throw new NotFoundException(`Chapter with ID "${chapterId}" not found`);
      }

      // Store the fetched chapter in the request-scoped service
      this.chapterRequestService.setChapter(chapter);

      // Check if the user is the author
      if (chapter.authors.some((authorId) => authorId.toString() === userId)) {
        return true;
      }

      // Check if the user has the book in their library
      return this.libraryService.checkIfUserHasBook(userId, chapter.bookId.toString());

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
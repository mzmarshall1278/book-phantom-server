import { Injectable, Scope } from '@nestjs/common';
import { Chapter } from './schemas/chapter.schema';

@Injectable({ scope: Scope.REQUEST })
export class ChapterRequestService {
  private chapter: Chapter | null = null;

  setChapter(chapter: Chapter) {
    this.chapter = chapter;
  }

  getChapter(): Chapter | null {
    return this.chapter;
  }
}

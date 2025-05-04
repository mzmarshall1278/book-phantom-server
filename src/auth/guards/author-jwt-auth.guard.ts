import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthorJwtAuthGuard extends AuthGuard('author-jwt') {}
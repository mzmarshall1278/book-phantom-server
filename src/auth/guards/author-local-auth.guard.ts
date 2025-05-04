import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthorLocalAuthGuard extends AuthGuard('author-local') {}
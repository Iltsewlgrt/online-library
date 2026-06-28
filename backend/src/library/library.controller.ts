import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { LibraryService } from './library.service';
import { CommentBodyDto, PaginationAndFilterDto, ReadingStatusBodyDto, SearchBooksQueryDto } from './library.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@ApiTags('library')
@Controller('library')
export class LibraryController {
    constructor(private readonly libraryService: LibraryService) { }

    @ApiOperation({ summary: 'Search books via Open Library' })
    @Get('search')
    searchBooks(@Query() query: SearchBooksQueryDto) {
        return this.libraryService.searchBooks(query.q, query.page, query.limit);
    }

    @ApiOperation({ summary: 'Get book details with likes/comments counts' })
    @Get('books/:bookId')
    getBookDetails(@Param('bookId') bookId: string) {
        return this.libraryService.getBookDetails(bookId);
    }

    @ApiOperation({ summary: 'Get paginated public comments for a book' })
    @Get('books/:bookId/comments')
    getComments(@Param('bookId') bookId: string, @Query() query: PaginationAndFilterDto) {
        return this.libraryService.getComments(bookId, query.page, query.limit);
    }

    @ApiOperation({ summary: 'Get total like count for a book' })
    @Get('books/:bookId/likes-count')
    getLikesCount(@Param('bookId') bookId: string) {
        return this.libraryService.getLikesCount(bookId);
    }


    @ApiOperation({ summary: 'Get like + reading-list status for a book (guest-safe)' })
    @ApiBearerAuth()
    @UseGuards(OptionalJwtAuthGuard)
    @Get('books/:bookId/me-status')
    getBookMeStatus(@Req() req: Request, @Param('bookId') bookId: string) {
        return this.libraryService.getBookMeStatus(req.user?.sub, bookId);
    }


    @ApiOperation({ summary: 'Toggle like on a book' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('books/:bookId/likes/toggle')
    toggleLike(@Req() req: Request, @Param('bookId') bookId: string) {
        return this.libraryService.toggleLike(req.user!.sub, bookId);
    }

    @ApiOperation({ summary: 'Get own liked books (paginated, searchable)' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('me/likes')
    getMyLikes(@Req() req: Request, @Query() query: PaginationAndFilterDto) {
        return this.libraryService.getMyLikes(req.user!.sub, query.page, query.limit, query.q);
    }

    @ApiOperation({ summary: 'Get own reading list (paginated, filterable, searchable)' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('me/reading-list')
    getMyReadingList(@Req() req: Request, @Query() query: PaginationAndFilterDto) {
        return this.libraryService.getMyReadingList(req.user!.sub, query.page, query.limit, query.status, query.q);
    }

    @ApiOperation({ summary: 'Add/update a book in own reading list' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('me/reading-list/:bookId')
    addToReadingList(@Req() req: Request, @Param('bookId') bookId: string, @Body() body: ReadingStatusBodyDto) {
        return this.libraryService.upsertReadingItem(req.user!.sub, bookId, body.status);
    }

    @ApiOperation({ summary: 'Update reading status for a book in own list' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Patch('me/reading-list/:bookId')
    updateReadingListItem(@Req() req: Request, @Param('bookId') bookId: string, @Body() body: ReadingStatusBodyDto) {
        return this.libraryService.upsertReadingItem(req.user!.sub, bookId, body.status);
    }

    @ApiOperation({ summary: 'Remove a book from own reading list' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete('me/reading-list/:bookId')
    removeFromReadingList(@Req() req: Request, @Param('bookId') bookId: string) {
        return this.libraryService.deleteReadingItem(req.user!.sub, bookId);
    }

    @ApiOperation({ summary: 'Search books within own liked or reading-list data' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('me/books')
    searchMyBooks(@Req() req: Request, @Query() query: PaginationAndFilterDto) {
        return this.libraryService.searchMyBooks(req.user!.sub, query.scope, query.q, query.page, query.limit);
    }

    @ApiOperation({ summary: 'Post a comment on a book' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('books/:bookId/comments')
    createComment(@Req() req: Request, @Param('bookId') bookId: string, @Body() body: CommentBodyDto) {
        return this.libraryService.createComment(req.user!.sub, bookId, body.text);
    }

    @ApiOperation({ summary: 'Edit own comment' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Patch('comments/:commentId')
    updateComment(@Req() req: Request, @Param('commentId') commentId: string, @Body() body: CommentBodyDto) {
        return this.libraryService.updateComment(req.user!.sub, commentId, body.text);
    }

    @ApiOperation({ summary: 'Delete own comment' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete('comments/:commentId')
    deleteComment(@Req() req: Request, @Param('commentId') commentId: string) {
        return this.libraryService.deleteComment(req.user!.sub, commentId);
    }

    @ApiOperation({ summary: 'Get own comment history (paginated)' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('me/comments')
    getMyComments(@Req() req: Request, @Query() query: PaginationAndFilterDto) {
        return this.libraryService.getMyComments(req.user!.sub, query.page, query.limit);
    }
}

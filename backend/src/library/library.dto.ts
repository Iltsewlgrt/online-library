import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min, Max, MinLength } from 'class-validator';

export enum ReadingStatus {
    WANT = 'WANT',
    READING = 'READING',
    DONE = 'DONE',
}

export class SearchBooksQueryDto {
    @IsString()
    q!: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit = 12;
}

export class PaginationAndFilterDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit = 10;

    @IsOptional()
    @IsEnum(ReadingStatus)
    status?: ReadingStatus;

    @IsOptional()
    @IsString()
    q?: string;

    @IsOptional()
    @IsIn(['likes', 'reading'])
    scope: 'likes' | 'reading' = 'likes';
}

export class CommentBodyDto {
    @IsString()
    @MinLength(1)
    text!: string;
}

export class ReadingStatusBodyDto {
    @IsEnum(ReadingStatus)
    status!: ReadingStatus;
}

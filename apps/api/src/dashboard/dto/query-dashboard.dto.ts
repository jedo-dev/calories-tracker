import { IsString, Matches } from 'class-validator';

export class QueryDashboardDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}

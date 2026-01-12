import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProviderType {
  GMAIL = 'GMAIL',
  OUTLOOK = 'OUTLOOK',
  YAHOO = 'YAHOO',
  IMAP = 'IMAP',
}

export class ConnectMailboxDto {
  @ApiProperty({ enum: ProviderType, example: 'GMAIL' })
  @IsEnum(ProviderType)
  provider: ProviderType;

  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'My Gmail', required: false })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  accessToken?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  refreshToken?: string;

  // For IMAP
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  host?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  port?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  useSsl?: boolean;
}

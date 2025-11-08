import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  feetPhotos?: string[];

  @IsOptional()
  @IsString()
  bio?: string;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  archType?: string;

  @IsOptional()
  @IsString()
  archSize?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  familyStatus?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredArchTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredArchSizes?: string[];
}


export declare class CreateBoardDto {
    name: string;
    description?: string;
    background?: string;
    isPrivate?: boolean;
    teamId?: string;
}
declare const UpdateBoardDto_base: import("@nestjs/common").Type<Partial<CreateBoardDto>>;
export declare class UpdateBoardDto extends UpdateBoardDto_base {
}
export declare class CreateColumnDto {
    name: string;
    color?: string;
}
export {};

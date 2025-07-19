export declare function generateCallNumber(): Promise<string>;
export declare function validateCallNumber(callNumber: string): boolean;
export declare function parseCallNumber(callNumber: string): {
    date: Date;
    sequence: number;
} | null;
//# sourceMappingURL=callNumberGenerator.d.ts.map
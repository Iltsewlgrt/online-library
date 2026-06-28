function required(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

function optional(name: string, defaultValue: string): string {
    return process.env[name] ?? defaultValue;
}

export const config = {
    jwtSecret: required('JWT_SECRET'),
    port: parseInt(optional('PORT', '3000'), 10),
    openLibraryCacheTtlMs: 30 * 60 * 1000,
    openLibraryThrottleMs: 1000,
} as const;

export declare const config: {
    readonly environment: string;
    readonly port: number;
    readonly clientPort: number;
    readonly database: {
        readonly host: string;
        readonly port: number;
        readonly user: string;
        readonly password: string;
        readonly name: string;
        readonly ssl: boolean;
    };
    readonly redis: {
        readonly host: string;
        readonly port: number;
        readonly password: string | undefined;
    };
    readonly jwt: {
        readonly secret: string;
        readonly refreshSecret: string;
        readonly expiresIn: string;
        readonly refreshExpiresIn: string;
    };
    readonly email: {
        readonly host: string;
        readonly port: number;
        readonly secure: boolean;
        readonly user: string | undefined;
        readonly password: string | undefined;
        readonly from: string;
    };
    readonly active911: {
        readonly apiKey: string | undefined;
        readonly baseUrl: string;
    };
    readonly arcgis: {
        readonly apiKey: string | undefined;
        readonly baseUrl: string;
    };
    readonly cors: {
        readonly origin: string[];
        readonly credentials: true;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly max: 100;
    };
    readonly logging: {
        readonly level: string;
        readonly file: string;
    };
    readonly gps: {
        readonly updateInterval: number;
        readonly accuracyThreshold: number;
    };
    readonly notifications: {
        readonly emailEnabled: boolean;
        readonly active911Enabled: boolean;
        readonly webhookEnabled: boolean;
        readonly webhookUrl: string | undefined;
    };
    readonly reports: {
        readonly storagePath: string;
        readonly retentionDays: number;
    };
    readonly security: {
        readonly bcryptRounds: number;
        readonly sessionTimeout: number;
    };
    readonly features: {
        readonly realTimeTracking: boolean;
        readonly mapIntegration: boolean;
        readonly reporting: boolean;
        readonly notifications: boolean;
    };
};
export type Config = typeof config;
//# sourceMappingURL=config.d.ts.map
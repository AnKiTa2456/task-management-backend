declare const _default: () => {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    throttle: {
        ttl: number;
        limit: number;
    };
};
export default _default;

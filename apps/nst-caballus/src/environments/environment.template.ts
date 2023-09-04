export const environment = {
    production: true,
    port: 80, // This has to always be 80 for kubernetes
    authTokenExpireLength: 43200, // 12 hours
    refreshTokenExpireLength: 86400, // 24 hours
    host: 'http://nst-caballus.production.riafox.dev',
    ngxBaseUrl: 'http://ngx-caballus.production.riafox.dev',
    ionBaseUrl: 'https://my.caballusapp.com',
    secretKey: '$RFX_SECRET_KEY',
    mongo: {
        // These environment variables can be whatever, the deploy scripts do
        // not touch these other than to fill them in with the matching var in
        // the build env. Just make sure that these are filled out in pipelines
        // configuration.
        url:
            'riafoxlive0-shard-00-00.uwz72.mongodb.net:27017,riafoxlive0-shard-00-01.uwz72.mongodb.net:27017,riafoxlive0-shard-00-02.uwz72.mongodb.net:27017',
        dbName: 'caballus',
        username: 'Deploy_Caballus_Production',
        password: '$RFX_DB_PASSWORD',
        replicaSetName: 'RiafoxLive0-shard-0',
        authSource: 'admin'
    },
    sendgrid: {
        apiKey: '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',
        fromEmail: 'support@caballusapp.com',
        fromName: 'Caballus Support'
    },
    google: {
        projectId: 'caballus',
        bucket: 'production-l5n3reww6eu1v74erbcg0csm',
        baseStorageUrl: 'https://storage.googleapis.com',
        keyfile: undefined,
        apiKey: '$RFX_MAPS_API_KEY'
    },
    jwplayer: {
        key: 'bmGApSGv',
        secret: 'P49NO3CLXlBshzgnyPYiJ3Aa',
        apiSecret: "y7d0sulDEfqSg7AQH5yKeWInVEZKemJqVnljMU5DV1RKbE5uQkZaRmd5U25STWJGTm0n"
    },
    stripe: {
        secretKey: '$RFX_STRIPE_SECRET_KEY',
        publicKey: 'pk_live_51KtOZlBLPbIphXwICeXKMgKTekU3VluQqiHu2bcG5ocL11FOkngX62jT27Mt9UTH76j2AEsr8Pqq7h6TCuLkO2v100OjwbwZ1m',
        priceKey: 'price_1LsH30BLPbIphXwIGKVucxF0'
    },
    branch: {
        key: '$RFX_BRANCH_KEY',
        baseUrl: 'https://api2.branch.io/v1/url'
    }
};

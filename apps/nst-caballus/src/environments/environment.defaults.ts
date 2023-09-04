export const environment = {
  production: false,
  host: 'http://localhost',
  deepLinkHost: 'https://app.caballusapp.com',
  authTokenExpireLength: 42300, // 12 hours
  refreshTokenExpireLength: 86400, // 24 hours
  ngxBaseUrl: 'http://localhost:9001',
  ionBaseUrl: 'http://localhost:9000',
  port: 9002,
  secretKey: 'a~229lPV5L,kTHxsbrjB?&S7eOF2JyVZG,o6yzC%<81bu^cXA;!AN!ICnB@Sf^>n',
  sendgrid: {
    apiKey: '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',
    fromEmail: 'support@caballusapp.com',
    fromName: 'Caballus Support',
    overrideToEmail: ['dev@riafox.com']
  },
  mongo: {
    url:
      'riafoxdev0-shard-00-00-uwz72.mongodb.net:27017,riafoxdev0-shard-00-01-uwz72.mongodb.net:27017,riafoxdev0-shard-00-02-uwz72.mongodb.net:27017',
    dbName: 'caballus-dev',
    username: 'Deploy_Caballus_NonProduction',
    password: 'xHBVFMxyuWFLbbSz',
    replicaSetName: 'RiafoxDev0-shard-0',
    authSource: 'admin'
  },
  google: {
    projectId: 'caballus',
    bucket: 'dev-rjhx7mog7t6e0vdfi1r76wdb',
    baseStorageUrl: 'https://storage.googleapis.com',
    keyfile: 'caballus-dev-environment.json',
    apiKey: 'AIzaSyArlwo6DPr0BFWxQi0F8cmF2Oyg_8Oi_Zs'
  },
  jwplayer: {
    key: 'bmGApSGv',
    secret: 'P49NO3CLXlBshzgnyPYiJ3Aa',
    apiSecret: 'y7d0sulDEfqSg7AQH5yKeWInVEZKemJqVnljMU5DV1RKbE5uQkZaRmd5U25STWJGTm0n'
  },
  stripe: {
    secretKey:
      'sk_test_51KtOZlBLPbIphXwINwof3M1Bu244eKTsHB2GDUtQhgo8PWPlsZ0VQImfGzVZzgSiNhfJKCQmTNwbHBXMOAI4Ynzk00SWvAfyPb',
    publicKey:
      'pk_test_51KtOZlBLPbIphXwI5i45J2xZR7bhOC9kcO8TjGqJKMBizeOvgiaRyEc17GtThavT3cinqy4uU7WF1ADWcyorGg9f00EVTJcoN5',
    priceKey: 'price_1L0XTYBLPbIphXwIjws3IWp6'
  },
  branch: {
    /**
     * In order to test deep links in non-production environments
     * you must set the in the following values to true
     * Branch.setUseTestBranchKey(false) in
     * ios\App\App\AppDelegate.swift
     * and
     * <bool name="branch_test_mode">false</bool> in
     * android\app\src\main\res\values\strings.xml
     *
     * !!!IMPORTANT!!!
     * !!! Do not commit those changes as it will break production. !!!
     * */

    key: 'key_test_hk8L87WzC69tHMNsb94XrjkfuzdPdkFX',
    baseUrl: 'https://api2.branch.io/v1/url'
  }
};

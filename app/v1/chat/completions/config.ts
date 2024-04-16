export class ApiKey {
  endpoint: string;
  token: string;

  constructor(endpoint: string, token: string) {
    this.endpoint = endpoint;
    this.token = token;
  }
}

export class UserToken {
  userId: string;
  token: string;

  constructor(userId: string, token: string) {
    this.userId = userId;
    this.token = token;
  }
}

export class Config {
  apiKey: ApiKey;
  userTokens: UserToken[];

  constructor(apiKey: ApiKey, userTokens: UserToken[]) {
    this.apiKey = apiKey;
    this.userTokens = userTokens;
  }
}

function getConfig(): Config {
  const configJson = process.env.CONFIG!!;
  try {
    return JSON.parse(configJson);
  } catch (error) {
    return JSON.parse(`
    {
      "apiKey": {
        "endpoint": "xxx",
        "token": "xxx"
      },
      "userTokens": [
        {
          "userId": "xxx",
          "token": "xxx"
        }
      ]
    }
    `);
  }
}

const config = getConfig();
export default config;
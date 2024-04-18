import {NextRequest, NextResponse} from 'next/server';
import config, {ApiKey} from "@/app/v1/chat/completions/config";

const unAuth = NextResponse.json({message: 'Unauthenticated'}, {status: 401});

class Request {
  stream: boolean = false;
  temperature: number = 0;
  messages: Message[] = [];
  model: string = "gpt-4";

  constructor(body: Request) {
    this.stream = body.stream;
    this.temperature = body.temperature;
    this.messages = body.messages;
    this.model = body.model;
  }
}

class Message {
  role: string = "";
  content: string = "";
}

function ensureValidBody(body: Request): Request {
  const messages = body.messages;
  const newMessages: Message[] = [];
  let lastRole = '';

  for (const message of messages) {
    if (lastRole === 'user' && message.role === 'user') {
      newMessages.push({role: 'assistant', content: 'empty'});
    }
    newMessages.push(message);
    lastRole = message.role;
  }

  return new Request({
    ...body,
    messages: newMessages,
  });
}

export async function POST(request: NextRequest) {
  let apiKey: ApiKey;
  const apiKeyStr = request.headers.get('authorization')?.replace('Bearer ', '')
  console.log(config);
  if (config.userTokens.some(userToken => userToken.token === apiKeyStr)) {
    apiKey = config.apiKey;
  } else {
    return unAuth;
  }
  let body: Request = await request.json();

  body = ensureValidBody(body);

  return await chat(apiKey, body);
}

async function chat(apiKey: ApiKey, body: any) {
  let endpoint = apiKey.endpoint;
  const auth = btoa(`token:${apiKey.token}`);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  let resultStream: ReadableStream | undefined;
  const decoder = new TextDecoder();
  resultStream = new ReadableStream(
    {
      async pull(controller) {
        const reader = response.body!.getReader();

        while (true) {
          const {value, done} = await reader.read();
          if (done) {
            console.log('close controller')
            controller.close();
          }
          let data = decoder.decode(value);
          console.log('Received', data);
          controller.enqueue(value);
        }
      }
    },
    {
      highWaterMark: 1,
      size(chunk) {
        return chunk.length;
      },
    }
  );

  return new Response(resultStream, {
    status: response.status,
    headers: response.headers,
  });
}

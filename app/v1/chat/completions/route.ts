import {NextRequest, NextResponse} from 'next/server';
import config, {ApiKey} from "@/app/v1/chat/completions/config";

const unAuth = NextResponse.json({message: 'Unauthenticated'}, {status: 401});

export async function POST(request: NextRequest) {
  let apiKey: ApiKey;
  const apiKeyStr = request.headers.get('authorization')?.replace('Bearer ', '')
  console.log(config);
  if (config.userTokens.some(userToken => userToken.token === apiKeyStr)) {
    apiKey = config.apiKey;
  } else {
    return unAuth;
  }
  const body = await request.json();

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

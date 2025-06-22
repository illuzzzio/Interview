import Vapi from '@vapi-ai/web';

export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);

// Add error handling for missing token
if (!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN) {
  console.error('VAPI_WEB_TOKEN is not set in environment variables');
}

// Listen for events
vapi.on('call-start', () => console.log('Call started'));
vapi.on('call-end', () => console.log('Call ended'));
vapi.on('message', (message) => {
  if (message.type === 'transcript') {
    console.log(`${message.role}: ${message.transcript}`);
  }
});

vapi.on('error', (error) => {
  console.error('VAPI Error:', error);
});

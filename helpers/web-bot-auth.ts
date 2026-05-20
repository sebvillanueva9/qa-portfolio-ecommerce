import { config } from './config'

export function webBotAuthHeaders(): Record<string, string> {
  return {
    'Signature': config.webBotSignature,
    'Signature-Input': config.webBotSignatureInput,
    'Signature-Agent': config.webBotSignatureAgent,
  }
}

import memberstackV1Code from './memberstack-v1.js?raw';
import memberstackV2Code from './memberstack-v2.js?raw';
import type {AdapterConfig} from "@/config";

export function executeMemberstackV1(config: AdapterConfig): void {
    try {
        // Ensure the code is properly formatted
        const cleanCode = (memberstackV1Code || '').trim();

        if (!cleanCode) {
            throw new Error('Memberstack V1 code is empty');
        }

        if (!config.appIdV1) {
            throw new Error('Memberstack ID is required');
        }

        // Add semicolon if missing
        const safeCode = cleanCode.endsWith(';') ? cleanCode : cleanCode + ';';

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.setAttribute('data-memberstack-id', config.appIdV1);
        script.textContent = safeCode;

        document.head.appendChild(script);
    } catch (error) {
        console.error('Failed to execute Memberstack V1:', error);
        throw error;
    }
}

export function executeMemberstackV2(config: AdapterConfig): void {
    try {
        const cleanCode = (memberstackV2Code || '').trim();

        if (!cleanCode) {
            throw new Error('Memberstack V2 code is empty');
        }

        const safeCode = cleanCode.endsWith(';') ? cleanCode : cleanCode + ';';

        const script = document.createElement('script');
        script.type = 'text/javascript';
        if(config.appId) script.setAttribute('data-memberstack-app', config.appId);
        script.textContent = safeCode;

        document.head.appendChild(script);
    } catch (error) {
        console.error('Failed to execute Memberstack V2:', error);
        throw error;
    }
}
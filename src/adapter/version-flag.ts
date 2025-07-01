import type {AdapterConfig} from "@/config";

function createVersionDiv(config: AdapterConfig): HTMLDivElement | null {
    if (!config.adapter.showVersion) {
        return null;
    }

    const versionDiv = document.createElement('div');
    versionDiv.className = 'version-display';
    versionDiv.textContent = `${config.adapter.currentVersion || getCurrentVersion(config)}`;

    // Style the version div
    Object.assign(versionDiv.style, {
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        padding: '4px 8px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666',
        zIndex: '99999',
    });

    // wait until dom loads to insert div
    document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(versionDiv);
    })
    return versionDiv;
}

function getCurrentVersion(config: AdapterConfig): string {
    return config.adapter.currentVersion || 'unknown version';
}


export {createVersionDiv, getCurrentVersion};
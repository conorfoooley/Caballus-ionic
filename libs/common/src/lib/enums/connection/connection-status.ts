export enum ConnectionStatus {
    Pending = '[ConnectionStatus] pending',
    Connected = '[ConnectionStatus] connected',
    Deactivated = '[ConnectionStatus] deactivated',
    NotConnected = '[ConnectionStatus] notConnected',
    Blocked = '[ConnectionStatus] blocked'
}

export namespace ConnectionStatus {
    export function toString(type: ConnectionStatus): string {
        switch (type) {
            case ConnectionStatus.Pending:
                return 'Pending';
            case ConnectionStatus.Connected:
                return 'Connected';
            case ConnectionStatus.Deactivated:
                return 'Deactivated';
            case ConnectionStatus.NotConnected:
                return 'Not Connected';
            case ConnectionStatus.Blocked:
                return 'Blocked';
            default:
                return '';
        }
    }

    export const members: ConnectionStatus[] = [
        ConnectionStatus.Pending,
        ConnectionStatus.Connected,
        ConnectionStatus.Deactivated,
        ConnectionStatus.NotConnected,
        ConnectionStatus.Blocked
    ];
}

export enum ClickType {
    Click = '[ClickType] click',
    Block = '[ClickType] block',
    Unclick = '[ClickType] unclick',
    UnclickFinal = '[ClickType] unclickFinal',
    Unconnect = '[ClickType] unconnect'
}

export namespace ClickType {
    export function toString(type: ClickType): string {
        switch (type) {
            case ClickType.Click:
                return 'Click';
            case ClickType.Block:
                return 'Block';
            case ClickType.Unclick:
                return 'Unclick';
            case ClickType.UnclickFinal:
                return 'Unclick Final';
            case ClickType.Unconnect:
                return 'Unconnect';
            default:
                return '';
        }
    }

    export const members: ClickType[] = [
        ClickType.Click,
        ClickType.Block,
        ClickType.Unclick,
        ClickType.UnclickFinal,
        ClickType.Unconnect,
    ];
}

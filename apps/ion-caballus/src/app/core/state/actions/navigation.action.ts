enum NavigationAction {
    ClearNavigation = '[NavigationAction] clearNavigation',
    FetchNavigation = '[NavigationAction] fetchNavigation'
}

export class FetchNavigationAction {
    public static readonly type: NavigationAction = NavigationAction.FetchNavigation;
}

export class ClearNavigationAction {
    public static readonly type: NavigationAction = NavigationAction.ClearNavigation;
}

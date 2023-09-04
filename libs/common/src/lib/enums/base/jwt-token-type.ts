/**
 * The type of an auth token.
 *
 * NOTE: THE ENUM MEMBERS MUST NEVER BE REORDERED.
 *
 * Additional members need to be appended to the end of the enum.
 */
export const enum JwtTokenType {
    /**
     * Normal authentication token. Returned through the usual login process or
     * via the token refresh endpoint.
     */
    Standard,
    /**
     * Authentication token for password resets. This token identifies the
     * current user but should only be returned by the password reset process.
     * This token should only ever have the password reset permission to access
     * the reset password endpoint.
     */
    PasswordReset,
    /**
     * Token with a longer lifetime than standard tokens, used to automatically
     * reauthenticate after the standard token has expired.
     */
    Refresh,
    /**
     * Authentication token for verifying the email address of a new user.
     * Should only be used on email verification endpoint
     */
    VerifyEmail,
    // This token's purpose is to provide some sort of authorization to the PWA when the subsription process is started
    Subscription
}

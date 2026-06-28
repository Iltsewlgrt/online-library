/** Shape of the JWT payload attached to req.user by JwtStrategy.validate(). */
export interface JwtPayload {
    sub: string;
    username: string;
}

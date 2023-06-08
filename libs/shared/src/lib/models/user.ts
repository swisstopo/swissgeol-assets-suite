import { contramap } from 'fp-ts/Ord';
import { Ord as ordString } from 'fp-ts/string';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

export enum UserRoleEnum {
    admin = 'admin',
    editor = 'editor',
    masterEditor = 'master-editor',
    viewer = 'viewer',
}

const UserRoleDecoder = D.union(
    D.literal(UserRoleEnum.admin),
    D.literal(UserRoleEnum.editor),
    D.literal(UserRoleEnum.masterEditor),
    D.literal(UserRoleEnum.viewer),
);
export const UserRole = C.fromDecoder(UserRoleDecoder);
export type UserRole = D.TypeOf<typeof UserRoleDecoder>;

export const isAdmin = (u: User) => u.role === UserRoleEnum.admin;
export const isMasterEditor = (u: User) => [UserRoleEnum.admin, UserRoleEnum.masterEditor].includes(u.role);
export const isEditor = (u: User) =>
    [UserRoleEnum.admin, UserRoleEnum.editor, UserRoleEnum.masterEditor].includes(u.role);

export const User = C.struct({
    id: C.string,
    email: C.string,
    role: UserRole,
    lang: C.string,
});
export interface User extends D.TypeOf<typeof User> {}
export const byEmail = contramap((u: User) => u.email)(ordString);

export interface UserWithoutId extends Omit<User, 'id'> {}

export const Users = C.array(User);
export type Users = User[];

export const UserPost = D.struct({
    email: D.string,
    role: UserRoleDecoder,
    lang: D.string,
});
export interface UserPost extends D.TypeOf<typeof UserPost> {}

export const UserPatch = D.struct({
    role: UserRoleDecoder,
    lang: D.string,
});
export interface UserPatch extends D.TypeOf<typeof UserPatch> {}

import { Role } from '@shared/models/workgroup';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

export enum UserRoleEnum {
  admin = 'admin',
  editor = 'editor',
  masterEditor = 'master-editor',
  viewer = 'viewer',
}

const WorkgroupRoleDecoder = D.union(D.literal(Role.Editor), D.literal(Role.MasterEditor), D.literal(Role.Viewer));
export const WorkgroupRole = C.fromDecoder(WorkgroupRoleDecoder);

export const User = C.struct({
  id: C.string,
  email: C.string,
  lang: C.string,
  isAdmin: C.boolean,
  workgroups: C.array(
    C.struct({
      id: C.number,
      role: WorkgroupRole,
    })
  ),
});
export type User = D.TypeOf<typeof User>;

export const Users = C.array(User);
export type Users = User[];

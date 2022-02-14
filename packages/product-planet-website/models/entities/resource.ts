import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { ProductVersion } from './productVersion'
import { User } from './user'

@E('Resource')
export class Resource extends EntityModel {
  @F
  name?: string

  @F
  link?: string

  @F
  type?: string

  @R(() => User, '1:n')
  creator?: number | User

  @R(() => ProductVersion, '1:n')
  version?: number | ProductVersion

  @F
  bucket?: string

  @F
  path?: string

  @F
  contentType?: string

  static getFiles = async (id: number) => {
    const files: Resource[] = await Resource.find({
      where: {
        version: id,
        deleted: null
      }
    }).then((res) => {
      return res || []
    })
    const result = {
      doc: files.filter((file) => file.type === 'doc'),
      design: files.filter((file) => file.type === 'design'),
      git: files.filter((file) => file.type === 'git')
    }
    return result
  }
}

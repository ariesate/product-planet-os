/**
 * 更新实体model到对应文件
 * - 已存在的属性不会删除，但其关系和类型会更新
 * - 无效的字段和关系会移除装饰器
 */
const { Project, ScriptTarget, ts, printNode } = require('ts-morph')
const path = require('path')
const { camelcase } = require('stringcase')
const defs = require('../packages/product-planet-server/app/planet.storage.json')
// const { readdirSync } = require('fs')

const prj = new Project({
  compilerOptions: {
    target: ScriptTarget.ES5
  },
  tsConfigFilePath: path.resolve(
    __dirname,
    '../packages/product-planet-website/jsconfig.json'
  ),
  skipAddingFilesFromTsConfig: true,
  skipLoadingLibFiles: true
})

function isFieldMatch (entityId, fieldId, point) {
  return entityId === point.entity && fieldId === point.field
}

function getRelation (entityId, fieldId) {
  for (const relation of defs.relations) {
    if (isFieldMatch(entityId, fieldId, relation.source)) {
      const entity = defs.entities.find((e) => e.id === relation.target.entity)
      return {
        entity,
        field: entity.fields.find((e) => e.id === relation.target.field),
        mode: relation.type,
        isSource: true,
        isCollection: relation.type === '1:n' || relation.type === 'n:n'
      }
    }
    if (isFieldMatch(entityId, fieldId, relation.target)) {
      const entity = defs.entities.find((e) => e.id === relation.source.entity)
      return {
        entity,
        field: entity.fields.find((e) => e.id === relation.source.field),
        mode: relation.type,
        isSource: false,
        isCollection: relation.type === 'n:1' || relation.type === 'n:n'
      }
    }
  }
}

function dedupeImport (src, spec, struct) {
  const imp =
    src.getImportDeclaration(
      (e) => e.getModuleSpecifier().getLiteralText() === spec
    ) ||
    src.addImportDeclaration({
      moduleSpecifier: spec
    })
  const nimp = imp.getNamedImports().find((e) => e.getName() === struct.name)
  if (!nimp) {
    imp.addNamedImport(struct)
  } else {
    if (struct.alias) {
      nimp.setAlias(struct.alias)
    } else {
      nimp.removeAlias()
    }
  }
}

const modelsDir = path.resolve(
  __dirname,
  '../packages/product-planet-website/models'
)
prj.addSourceFilesAtPaths(modelsDir + '/**/*.ts')
const index = prj.createSourceFile(
  path.join(modelsDir, 'index.ts'),
  'export type { QueryOptions } from "./query";',
  { overwrite: true }
)
for (const entity of defs.entities) {
  const filename = path.join(
    modelsDir,
    'entities',
    `${camelcase(entity.name)}.ts`
  )
  const src =
    prj.getSourceFile(filename) ||
    prj.createSourceFile(filename, '', { overwrite: true })
  dedupeImport(src, '../entity', { name: 'EntityModel' })
  dedupeImport(src, '../entity', { name: 'Entity', alias: 'E' })
  dedupeImport(src, '../entity', { name: 'Field', alias: 'F' })
  dedupeImport(src, '../entity', { name: 'Relation', alias: 'R' })
  const cls =
    src.getClass(entity.name) ||
    src.addClass({
      name: entity.name,
      extends: 'EntityModel',
      isExported: true
    })
  cls.getDecorator('Entity')?.remove()
  const entityDeco =
    cls.getDecorator('E') ||
    cls.addDecorator({
      name: 'E'
    })
  entityDeco.getArguments().forEach((arg) => entityDeco.removeArgument(arg))
  entityDeco.addArgument(
    printNode(ts.factory.createStringLiteral(entity.name, true))
  )
  cls.getProperties().forEach((prop) => {
    const field = entity.fields.find((e) => e.name === prop.getName())
    prop.getDecorator('Field')?.remove()
    prop.getDecorator('Relation')?.remove()
    if (!field || field.type === 'rel') {
      prop.getDecorator('F')?.remove()
    }
    if (!field || field.type !== 'rel') {
      prop.getDecorator('R')?.remove()
    }
  })
  for (const field of entity.fields) {
    const prop =
      cls.getProperty(field.name) ||
      cls.addProperty({
        name: field.name,
        hasQuestionToken: true,
        leadingTrivia: (writer) => writer.newLine()
      })
    if (field.type === 'rel') {
      const relation = getRelation(entity.id, field.id)
      if (!relation) {
        throw new Error(`invalid relation at '${entity.id}'.'${field.id}'`)
      }
      if (relation.entity.name !== entity.name) {
        dedupeImport(src, `./${camelcase(relation.entity.name)}`, {
          name: relation.entity.name
        })
      }
      const relationDeco =
        prop.getDecorator('R') ||
        prop.addDecorator({
          name: 'R'
        })
      relationDeco
        .getArguments()
        .forEach((arg) => relationDeco.removeArgument(arg))
      relationDeco.addArgument((writer) =>
        writer.write(
          printNode(
            ts.factory.createArrowFunction(
              undefined,
              undefined,
              [],
              undefined,
              ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              ts.factory.createRegularExpressionLiteral(relation.entity.name)
            )
          )
        )
      )
      relationDeco.addArgument(
        printNode(ts.factory.createStringLiteral(relation.mode, true))
      )
      if (relation.isSource) {
        relationDeco.addArgument(printNode(ts.factory.createTrue()))
      }
      prop.setType((writer) => {
        if (relation.isCollection) {
          writer.write(
            printNode(
              ts.factory.createArrayTypeNode(
                ts.factory.createTypeReferenceNode(relation.entity.name)
              )
            )
          )
        } else {
          writer.write(
            printNode(
              ts.factory.createUnionTypeNode([
                ts.factory.createTypeReferenceNode('number'),
                ts.factory.createTypeReferenceNode(relation.entity.name)
              ])
            )
          )
        }
      })
    } else {
      if (!prop.getDecorator('F')) {
        prop.addDecorator({
          name: 'F'
        })
      }
      prop.setType(field.type)
    }
  }
  src.organizeImports({
    semicolons: ts.SemicolonPreference.Remove,
    indentSize: 2
  })
  src.saveSync()
  console.log(`updated ${path.resolve(filename)}`)
  index.addExportDeclaration({
    moduleSpecifier: `./entities/${camelcase(entity.name)}`
  })
}
//合并业务api
// const apiDir = path.resolve(
//   __dirname,
//   '../packages/product-planet-website/models/apis'
// )
// const files = readdirSync(apiDir)
// for (const filePath of files) {
//   const fileName = filePath.split('/').pop()
//   const moduleName = fileName.split('.').shift()
//   index.addExportDeclaration({
//     moduleSpecifier: `./apis/${camelcase(moduleName)}`
//   })
// }

index.formatText({
  semicolons: ts.SemicolonPreference.Remove,
  indentSize: 2
})
index.saveSync()

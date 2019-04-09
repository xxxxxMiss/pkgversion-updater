'use strict'

const fs = require('fs')
const path = require('path')
const execa = require('execa')
const _ = require('lodash')

module.exports = async () => {
  const pkgPath = path.join(process.cwd(), 'package.json')
  if (!fs.existsSync(pkgPath)) {
    console.error(`The path: ${pkgPath} not contains package.json`)
    process.exit(1)
  }

  const packageInfo = require(pkgPath)
  const dependencies = _.get(packageInfo, 'dependencies')
  const devDependencies = _.get(packageInfo, 'devDependencies')
  const pkgManager = hasYarn() ? 'yarn' : 'npm'

  const commands = [
    Object.keys(dependencies),
    Object.keys(devDependencies),
  ].map(keys => {
    return keys.map(dep => {
      return execa(pkgManager, ['info', dep, 'version'])
    })
  })

  const newDependencies = await getNewDeps(commands[0])
  const newDevDependencies = await getNewDeps(commands[1])
  const newPackage = _.merge(packageInfo, {
    dependencies: newDependencies,
    devDependencies: newDevDependencies,
  })

  fs.writeFileSync(pkgPath, JSON.stringify(newPackage, null, 2))
  return newPackage
}

function getNewDeps(commands) {
  return Promise.all(commands)
    .then(res => {
      const deps = {}
      res.forEach(({ stdout, cmd }) => {
        if (stdout) {
          const version = stdout.split(/\n/)[1] || stdout
          const dep = cmd.split(/\s+/)[2]
          deps[dep] = `^${version}`
        }
      })
      return deps
    })
    .catch(e => console.error(e))
}

function hasYarn() {
  try {
    execa.shellSync('yarn -v')
    return true
  } catch (error) {
    return false
  }
}

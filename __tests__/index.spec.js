import path from 'path'
import execa from 'execa'
import fs from 'fs'
import update from '../src'

process.chdir(path.join(__dirname, 'fixtures'))
jest.setTimeout(10000)

afterAll(() => {
  fs.createReadStream(
    path.join(__dirname, 'fixtures', 'package-backup.json')
  ).pipe(fs.createWriteStream(path.join(__dirname, 'fixtures', 'package.json')))
})

test('should update package version to the latest', async () => {
  const reactVersion = (await execa('npm', ['info', 'react', 'version'])).stdout
  const webpackVersion = (await execa('npm', ['info', 'webpack', 'version']))
    .stdout
  const newPackageInfo = await update()

  expect(newPackageInfo.dependencies.react).toBe(`^${reactVersion}`)
  expect(newPackageInfo.devDependencies.webpack).toBe(`^${webpackVersion}`)
})

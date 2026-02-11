import chalk from 'chalk'
import { availablePlugins } from '../generated/plugins.js'

export async function search(query?: string) {
  console.log(chalk.blue('Available Gitton plugins:'))
  console.log('')

  let plugins = availablePlugins

  if (query) {
    const q = query.toLowerCase()
    plugins = plugins.filter(
      (p) =>
        p.shortName.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    )
  }

  if (plugins.length === 0) {
    console.log(chalk.gray('No plugins found.'))
    if (query) {
      console.log('')
      console.log('Try searching without a query:')
      console.log(chalk.cyan('  gitton search'))
    }
    return
  }

  for (const plugin of plugins) {
    console.log(chalk.green(`  ${plugin.shortName}`))
    console.log(chalk.gray(`    ${plugin.name}@${plugin.version}`))
    if (plugin.description) {
      console.log(chalk.gray(`    ${plugin.description}`))
    }
    console.log('')
  }

  console.log('Install a plugin with:')
  console.log(chalk.cyan('  gitton install <plugin-name>'))
  console.log('')
  console.log('Example:')
  console.log(chalk.cyan('  gitton install github-actions'))
}

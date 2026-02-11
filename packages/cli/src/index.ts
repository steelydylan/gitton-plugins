#!/usr/bin/env node

import { Command } from 'commander'
import { install } from './commands/install.js'
import { list } from './commands/list.js'
import { search } from './commands/search.js'
import { uninstall } from './commands/uninstall.js'

const program = new Command()

program
  .name('gitton')
  .description('CLI tool for managing Gitton plugins')
  .version('0.0.1')

program
  .command('install <package>')
  .alias('i')
  .description('Install a Gitton plugin from npm')
  .option('--dev', 'Install to development plugins directory')
  .action(install)

program
  .command('uninstall <package>')
  .alias('rm')
  .description('Uninstall a Gitton plugin')
  .option('--dev', 'Uninstall from development plugins directory')
  .action(uninstall)

program
  .command('list')
  .alias('ls')
  .description('List installed Gitton plugins')
  .option('--dev', 'List plugins from development directory')
  .action(list)

program
  .command('search [query]')
  .alias('s')
  .description('Search available Gitton plugins on npm')
  .action(search)

program.parse()

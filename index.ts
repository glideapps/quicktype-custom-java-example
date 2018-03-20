#!/usr/bin/env ts-node

function main(args: string[]) {
  console.log(`Hello, world: ${JSON.stringify(args)}`);
}

main(process.argv.slice(2));

#!/usr/bin/env node
import { debuglog } from 'node:util'
import { MCPFiles } from '../main.ts'

const debug = debuglog('ls-mcp')

async function init () {
    const mcpFilesManager = new MCPFiles();
    const mcpFilesList = await mcpFilesManager.findFiles();

    if (mcpFilesList.length > 0) {
        console.log('MCP files found:');
        mcpFilesList.forEach(file => {
            console.log(`- ${file}`);
        });
    } else {
        console.log('No MCP files found.');
    }
}

init()
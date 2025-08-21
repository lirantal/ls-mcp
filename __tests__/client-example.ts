// client example
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const transport = new StdioClientTransport({
  command: 'node',
  args: ['mcp.js']
})

const client = new Client(
  {
    name: 'example-client',
    version: '1.0.0'
  },
  {
    capabilities: {
      prompts: {},
      resources: {},
      tools: {
        add: {}
      }
    }
  }
)

await client.connect(transport)

try {
  // List prompts
  // const prompts = await client.listPrompts();
  // console.log({prompts});

  // Test the tool
  // const packageInfo = await client.callTool("add", {
  //   packageName: "express"
  // });
  const packageInfo = await client.callTool('add', { a: 1, b: 2 }
  )

  console.log('Package info:', packageInfo)
} catch (error) {
  console.error('Error:', error.message)
}

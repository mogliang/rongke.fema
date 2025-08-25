// Simple test to verify our imports and types work correctly
import { ScopesPlugin, Presets as ScopesPresets } from 'rete-scopes-plugin';
import { NodeEditor, GetSchemes, ClassicPreset } from 'rete';

// Test node classes
class TestFunctionNode extends ClassicPreset.Node {
  width = 220;
  height = 140;
  parent?: string;

  constructor(label: string) {
    super(label);
  }
}

class TestStructureNode extends ClassicPreset.Node {
  width = 300;
  height = 200;

  constructor(label: string) {
    super(label);
  }
}

class TestConnection extends ClassicPreset.Connection<TestFunctionNode | TestStructureNode, TestFunctionNode | TestStructureNode> {}

type TestSchemes = GetSchemes<TestFunctionNode | TestStructureNode, TestConnection>;

// Test plugin initialization
function testScopesPlugin() {
  const scopes = new ScopesPlugin<TestSchemes>();
  scopes.addPreset(ScopesPresets.classic.setup());
  
  console.log('Scopes plugin initialized successfully');
  return scopes;
}

// Test node creation with parent relationship
async function testNodeCreation() {
  const editor = new NodeEditor<TestSchemes>();
  
  // Create structure node
  const structureNode = new TestStructureNode('Test Structure');
  await editor.addNode(structureNode);
  
  // Create function node with parent relationship
  const functionNode = new TestFunctionNode('Test Function');
  functionNode.parent = structureNode.id;
  await editor.addNode(functionNode);
  
  console.log('Nodes created successfully with parent-child relationship');
  console.log('Structure node ID:', structureNode.id);
  console.log('Function node ID:', functionNode.id);
  console.log('Function node parent:', functionNode.parent);
  
  return { structureNode, functionNode, editor };
}

export { testScopesPlugin, testNodeCreation };

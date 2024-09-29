import React, { useState, useCallback } from 'react'

interface Node {
  id: string
  content: string
  children: Node[]
}

const MindMapNode: React.FC<{
  node: Node
  onAddChild: (parentId: string) => void
  onDeleteNode: (id: string) => void
  onUpdateContent: (id: string, content: string) => void
  depth?: number
}> = ({ node, onAddChild, onDeleteNode, onUpdateContent, depth = 0 }) => {
  return (
    <div className="flex items-center">
      <div
        className="border rounded p-2 mb-2 cursor-pointer bg-white"
        onClick={() => onDeleteNode(node.id)}
        onContextMenu={(e) => {
          e.preventDefault()
          onAddChild(node.id)
        }}
      >
        {node.content}
      </div>
      {node.children.length > 0 && (
        <div className={`flex flex-col ${depth % 2 === 0 ? 'items-start' : 'items-end'}`}>
          <div className="w-8 border-t border-gray-300"></div>
          <div className="flex">
            <div className="w-8 border-r border-gray-300"></div>
            <div className="flex flex-col justify-center space-y-4">
              {node.children.map((child, index) => (
                <MindMapNode
                  key={child.id}
                  node={child}
                  onAddChild={onAddChild}
                  onDeleteNode={onDeleteNode}
                  onUpdateContent={onUpdateContent}
                  depth={depth + 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const TextualMindMap: React.FC<{
  nodes: Node[]
  onUpdateContent: (id: string, content: string) => void
}> = ({ nodes, onUpdateContent }) => {
  const handleContentChange = (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateContent(id, e.target.value)
  }

  return (
    <ul className="list-disc pl-4">
      {nodes.map((node) => (
        <li key={node.id}>
          <input
            type="text"
            value={node.content}
            onChange={handleContentChange(node.id)}
            className="border-b border-gray-300 focus:outline-none focus:border-blue-500"
          />
          {node.children.length > 0 && (
            <TextualMindMap
              nodes={node.children}
              onUpdateContent={onUpdateContent}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

export default function MindMap() {
  const [root, setRoot] = useState<Node>({
    id: '0',
    content: 'Root',
    children: [],
  })

  const handleAddChild = useCallback((parentId: string) => {
    const newNode: Node = {
      id: Math.random().toString(36).substr(2, 9),
      content: 'New Node',
      children: [],
    }

    const addChildToNode = (node: Node): Node => {
      if (node.id === parentId) {
        return { ...node, children: [...node.children, newNode] }
      }
      return {
        ...node,
        children: node.children.map(addChildToNode),
      }
    }

    setRoot(addChildToNode(root))
  }, [root])

  const handleDeleteNode = useCallback((id: string) => {
    const deleteNodeFromTree = (node: Node): Node | null => {
      if (node.id === id) {
        return null
      }
      return {
        ...node,
        children: node.children
          .map(deleteNodeFromTree)
          .filter((child): child is Node => child !== null),
      }
    }

    const newRoot = deleteNodeFromTree(root)
    if (newRoot) {
      setRoot(newRoot)
    }
  }, [root])

  const handleUpdateContent = useCallback((id: string, content: string) => {
    const updateNodeContent = (node: Node): Node => {
      if (node.id === id) {
        return { ...node, content }
      }
      return {
        ...node,
        children: node.children.map(updateNodeContent),
      }
    }

    setRoot(updateNodeContent(root))
  }, [root])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mind Map</h1>
      <div className="flex">
        <div className="w-2/3 pr-4 overflow-auto">
          <h2 className="text-xl font-semibold mb-2">Graphical View</h2>
          <div className="border p-4 rounded-lg bg-gray-50">
            <MindMapNode
              node={root}
              onAddChild={handleAddChild}
              onDeleteNode={handleDeleteNode}
              onUpdateContent={handleUpdateContent}
            />
          </div>
        </div>
        <div className="w-1/3 pl-4 border-l">
          <h2 className="text-xl font-semibold mb-2">Textual View (Editable)</h2>
          <TextualMindMap
            nodes={root.children}
            onUpdateContent={handleUpdateContent}
          />
        </div>
      </div>
    </div>
  )
}
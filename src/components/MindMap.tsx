import React, { useState, useCallback, useRef, useEffect } from 'react'

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
        className="border rounded p-2 mb-2 cursor-pointer bg-white min-w-[100px] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
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
  onAddSibling: (path: number[]) => void
  onIndent: (path: number[]) => void
  onOutdent: (path: number[]) => void
  path?: number[]
  focusNodeId?: string
}> = ({ nodes, onUpdateContent, onAddSibling, onIndent, onOutdent, path = [], focusNodeId }) => {
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  useEffect(() => {
    if (focusNodeId && inputRefs.current[focusNodeId]) {
      inputRefs.current[focusNodeId]?.focus()
    }
  }, [focusNodeId])

  const handleContentChange =
    (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateContent(id, e.target.value)
    }

  return (
    <ul className="list-disc pl-4">
      {nodes.map((node, index) => {
        const currentPath = [...path, index]

        return (
          <li key={node.id}>
            <input
              type="text"
              value={node.content}
              onChange={handleContentChange(node.id)}
              ref={(el) => (inputRefs.current[node.id] = el)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onAddSibling(currentPath)
                } else if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault()
                  onIndent(currentPath)
                } else if (e.key === 'Tab' && e.shiftKey) {
                  e.preventDefault()
                  onOutdent(currentPath)
                }
              }}
              className="border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full"
            />
            {node.children.length > 0 && (
              <TextualMindMap
                nodes={node.children}
                onUpdateContent={onUpdateContent}
                onAddSibling={onAddSibling}
                onIndent={onIndent}
                onOutdent={onOutdent}
                path={currentPath}
                focusNodeId={focusNodeId}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function MindMap() {
  const [root, setRoot] = useState<Node>({
    id: '0',
    content: 'Root',
    children: [],
  })
  const [focusNodeId, setFocusNodeId] = useState<string | undefined>(undefined)

  const handleAddChild = useCallback(
    (parentId: string) => {
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
    },
    [root]
  )

  const handleDeleteNode = useCallback(
    (id: string) => {
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
    },
    [root]
  )

  const handleUpdateContent = useCallback(
    (id: string, content: string) => {
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
    },
    [root]
  )

  // Helper function to update node at a given path
  const updateNodeAtPath = (
    node: Node,
    path: number[],
    updater: (node: Node, index: number, path: number[]) => Node | null
  ): Node | null => {
    if (path.length === 0) {
      return updater(node, 0, path)
    }

    const [index, ...rest] = path
    if (index < 0 || index >= node.children.length) {
      return node
    }

    const updatedChild = updateNodeAtPath(node.children[index], rest, updater)
    if (updatedChild === null) {
      // Remove the child
      const newChildren = node.children.filter((_, i) => i !== index)
      return { ...node, children: newChildren }
    } else {
      return {
        ...node,
        children: node.children.map((child, i) =>
          i === index ? updatedChild : child
        ),
      }
    }
  }

  const handleAddSibling = useCallback(
    (path: number[]) => {
      const newNode: Node = {
        id: Math.random().toString(36).substr(2, 9),
        content: '',
        children: [],
      }

      const parentPath = path.slice(0, -1)
      const index = path[path.length - 1]

      setRoot((prevRoot) => {
        const newRoot = updateNodeAtPath(prevRoot, parentPath, (node) => {
          const newChildren = [
            ...node.children.slice(0, index + 1),
            newNode,
            ...node.children.slice(index + 1),
          ]
          return { ...node, children: newChildren }
        })
        return newRoot || prevRoot
      })

      // Set focus to the new node
      setFocusNodeId(newNode.id)
    },
    [setRoot, setFocusNodeId]
  )

  const handleIndent = useCallback(
    (path: number[]) => {
      if (path.length === 0) {
        // Can't indent root node
        return
      }
  
      const parentPath = path.slice(0, -1)
      const index = path[path.length - 1]
  
      if (index === 0) {
        // No previous sibling to indent into
        return
      }

      setRoot((prevRoot) => {
        const newRoot = updateNodeAtPath(prevRoot, parentPath, (node) => {
          const targetNode = node.children[index]
          const previousSibling = node.children[index - 1]

          // Remove targetNode from current children
          const newChildren = node.children.filter((_, i) => i !== index)

          // Add targetNode as child of previous sibling
          const newPreviousSibling = {
            ...previousSibling,
            children: [...previousSibling.children, targetNode],
          }

          // Replace previous sibling and update children
          newChildren[index - 1] = newPreviousSibling

          return { ...node, children: newChildren }
        })
        return newRoot || prevRoot
      })
    },
    [setRoot]
  )

  const handleOutdent = useCallback(
    (path: number[]) => {
      if (path.length < 2) {
        // Can't outdent root node
        return
      }

      const parentPath = path.slice(0, -1)
      const grandparentPath = path.slice(0, -2)
      const index = path[path.length - 1]
      const parentIndex = path[path.length - 2]

      setRoot((prevRoot) => {
        const newRoot = updateNodeAtPath(prevRoot, grandparentPath, (node) => {
          const parentNode = node.children[parentIndex]
          const targetNode = parentNode.children[index]

          // Remove targetNode from parent's children
          const newParentChildren = parentNode.children.filter(
            (_, i) => i !== index
          )

          const newParentNode = {
            ...parentNode,
            children: newParentChildren,
          }

          // Insert targetNode into grandparent's children after parentNode
          const newChildren = node.children.flatMap((child, i) => {
            if (i === parentIndex) {
              return [newParentNode, targetNode]
            }
            return child
          })

          return { ...node, children: newChildren }
        })
        return newRoot || prevRoot
      })
    },
    [setRoot]
  )

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
            onAddSibling={handleAddSibling}
            onIndent={handleIndent}
            onOutdent={handleOutdent}
            focusNodeId={focusNodeId}
          />
        </div>
      </div>
    </div>
  )
}